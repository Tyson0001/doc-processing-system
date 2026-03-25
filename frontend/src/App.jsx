import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setProgress(5); // instant feedback
    setStatus("processing");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const docId = data.id;

    const ws = new WebSocket(`ws://localhost:8000/ws/${docId}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setProgress(msg.progress);
      setStatus(msg.status);
    };
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          width: "420px",
          padding: "30px",
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "10px", color: "#333" }}>
          Document Processor
        </h2>

        <p style={{ color: "#777", marginBottom: "20px" }}>
          Upload a file and track real-time processing
        </p>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{
            marginBottom: "10px",
            display: "block",
            width: "100%",
          }}
        />

        {file && (
          <p style={{ fontSize: "14px", color: "#555" }}>
            Selected: {file.name}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontWeight: "600",
            cursor: file ? "pointer" : "not-allowed",
            opacity: file ? 1 : 0.6,
          }}
        >
          Upload & Process
        </button>

        <div style={{ marginTop: "25px" }}>
          <p style={{ marginBottom: "5px", color: "#444" }}>
            Status: <b>{status || "idle"}</b>
          </p>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#e5e7eb",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#4f46e5",
                transition: "width 0.4s ease",
              }}
            />
          </div>

          <p
            style={{
              marginTop: "8px",
              fontSize: "14px",
              color: "#555",
            }}
          >
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;