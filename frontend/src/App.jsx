import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
function App() {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Upload
  const handleUpload = async () => {
    if (files.length === 0) return;

    setDocuments([]);
    setSelectedDoc(null);

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const docId = data.id;

      const newDoc = {
        id: docId,
        filename: file.name,
        status: "queued",
        progress: 0,
        result: null,
      };

      setDocuments((prev) => [newDoc, ...prev]);

      // Polling
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/status/${docId}`);
          const msg = await res.json();

          setDocuments((prev) =>
            prev.map((d) => {
              if (d.id !== docId) return d;

              const updatedDoc = {
                ...d,
                status: msg.status || d.status,
                progress:
                  typeof msg.progress === "number"
                    ? msg.progress
                    : d.progress,
                result: msg.result || d.result,
              };

              if (msg.status === "completed" || msg.status === "failed") {
                clearInterval(interval);
              }

              return updatedDoc;
            })
          );
        } catch (err) {
          clearInterval(interval);
        }
      }, 1000);
    }
  };

  const retryJob = (doc) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id ? { ...d, status: "processing", progress: 0 } : d
      )
    );

    let p = 0;
    const interval = setInterval(() => {
      p += 20;

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, progress: p } : d
        )
      );

      if (p >= 100) {
        clearInterval(interval);

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  status: "completed",
                  result: {
                    title: "Retried Document",
                    category: "General",
                    summary: "Processed after retry",
                    keywords: ["retry"],
                  },
                }
              : d
          )
        );
      }
    }, 400);
  };

  const finalizeDocument = async () => {
    if (!selectedDoc) return;

    await fetch(`${API_URL}/finalize/${selectedDoc.id}`, {
      method: "POST",
    });

    alert("✅ Finalized!");

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === selectedDoc.id ? { ...d, status: "finalized" } : d
      )
    );
  };

  const downloadJSON = (doc) => {
    const blob = new Blob([JSON.stringify(doc.result, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.filename}.json`;
    a.click();
  };

  const downloadCSV = (doc) => {
    const rows = [
      ["title", doc.result?.title],
      ["category", doc.result?.category],
      ["summary", doc.result?.summary],
      ["keywords", doc.result?.keywords?.join(", ")],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.filename}.csv`;
    a.click();
  };

  let filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (filter !== "all") {
    filteredDocs = filteredDocs.filter((d) => d.status === filter);
  }

  return (
    <div style={{ fontFamily: "Segoe UI", background: "#f4f6f8", minHeight: "100vh", padding: "30px" }}>
      
      {/* Upload */}
      <div
        style={{
          maxWidth: "500px",
          margin: "auto",
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ color: "#111827", fontWeight: "600", marginBottom: "10px" }}>
          Document Processor
        </h2>

        <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />

        <button
          onClick={handleUpload}
          disabled={files.length === 0}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "10px",
            background: files.length ? "#6366f1" : "#9ca3af",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Upload & Process
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ maxWidth: "500px", margin: "20px auto" }}>
        <input
          placeholder="Search..."
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />

        <select
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "10px" }}
        >
          <option value="all">All</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="finalized">Finalized</option>
        </select>
      </div>

      {/* Documents */}
      <div style={{ maxWidth: "500px", margin: "auto" }}>
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "10px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
              cursor: "pointer"
            }}
          >
            <p><b>{doc.filename}</b></p>
            <p>Status: {doc.status}</p>

            <div style={{ background: "#e5e7eb", height: "8px", borderRadius: "6px" }}>
              <div
                style={{
                  width: `${doc.progress}%`,
                  height: "8px",
                  background: "#6366f1",
                  borderRadius: "6px"
                }}
              />
            </div>

            <p>{doc.progress}%</p>

            {doc.status === "failed" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  retryJob(doc);
                }}
                style={{
                  marginTop: "5px",
                  background: "#ef4444",
                  color: "white",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "none"
                }}
              >
                Retry
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Detail */}
      {selectedDoc && (
        <div style={{
          maxWidth: "500px",
          margin: "20px auto",
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
        }}>
          <h3>Details</h3>

          <textarea
            value={JSON.stringify(selectedDoc.result || {}, null, 2)}
            style={{ width: "100%", height: "150px" }}
            readOnly
          />

          <button onClick={finalizeDocument} style={{ width: "100%", marginTop: "10px", background: "#10b981", color: "white", padding: "10px", borderRadius: "8px", border: "none" }}>
            Finalize
          </button>

          <button onClick={() => downloadJSON(selectedDoc)} style={{ width: "100%", marginTop: "10px", background: "#3b82f6", color: "white", padding: "10px", borderRadius: "8px", border: "none" }}>
            Export JSON
          </button>

          <button onClick={() => downloadCSV(selectedDoc)} style={{ width: "100%", marginTop: "10px", background: "#9333ea", color: "white", padding: "10px", borderRadius: "8px", border: "none" }}>
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
