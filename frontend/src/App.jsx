import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

function App() {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // 🔹 Upload
  const handleUpload = async () => {
    if (files.length === 0) return;

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const newDoc = {
        id: data.id,
        filename: file.name,
        status: "processing",
        progress: 0,
        result: null,
      };

      setDocuments((prev) => [newDoc, ...prev]);

      const ws = new WebSocket(
        `${API.replace("https", "wss")}/ws/${data.id}`
      );

      const timeout = setTimeout(() => {
        ws.close();
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === data.id ? { ...d, status: "failed" } : d
          )
        );
      }, 15000);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        setDocuments((prev) =>
          prev.map((d) => {
            if (d.id !== data.id) return d;

            if (d.status === "failed") return d;

            if (msg.progress >= 60 && Math.random() < 0.4) {
              clearTimeout(timeout);
              ws.close();

              return {
                ...d,
                status: "failed",
                progress: msg.progress,
              };
            }

            if (msg.status === "completed") {
              clearTimeout(timeout);
              ws.close();

              return {
                ...d,
                status: "completed",
                progress: 100,
                result:
                  msg.result || {
                    title: "Processed Document",
                    category: "General",
                    summary: "Processed successfully",
                    keywords: ["document"],
                  },
              };
            }

            return {
              ...d,
              status: msg.status,
              progress: msg.progress,
            };
          })
        );
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        ws.close();

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === data.id ? { ...d, status: "failed" } : d
          )
        );
      };
    }
  };

  // 🔹 Retry
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

  // 🔹 Finalize
  const finalizeDocument = async () => {
    if (!selectedDoc) return;

    await fetch(`${API}/finalize/${selectedDoc.id}`, {
      method: "POST",
    });

    alert("✅ Finalized!");

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === selectedDoc.id ? { ...d, status: "finalized" } : d
      )
    );
  };

  // 🔹 Export JSON
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

  // 🔹 Export CSV
  const downloadCSV = (doc) => {
    const rows = [
      ["title", doc.result.title],
      ["category", doc.result.category],
      ["summary", doc.result.summary],
      ["keywords", doc.result.keywords.join(", ")],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.filename}.csv`;
    a.click();
  };

  // 🔹 Filter
  let filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (filter !== "all") {
    filteredDocs = filteredDocs.filter((d) => d.status === filter);
  }

  return (
    <div style={{ fontFamily: "Segoe UI", background: "#f4f6f8", minHeight: "100vh", padding: "30px" }}>
      {/* Upload */}
      <div style={{
        maxWidth: "500px",
        margin: "auto",
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
      }}>
        <h2>Document Processor</h2>

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
        <input placeholder="Search..." onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "8px" }} />

        <select onChange={(e) => setFilter(e.target.value)} style={{ width: "100%", padding: "8px", marginTop: "10px" }}>
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
      {selectedDoc && selectedDoc.result && (
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
            value={JSON.stringify(selectedDoc.result, null, 2)}
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
