import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import axios from "../axiosConfig";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFCoverPreview = ({ pdfUrl, width = 200, height = 260 }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const renderFirstPage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const token = localStorage.getItem("token");
        const response = await axios.get(pdfUrl, {
          responseType: "arraybuffer",
          headers: { Authorization: `Bearer ${token}` },
        });

        const loadingTask = pdfjsLib.getDocument({ data: response.data });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });

        // 🛡️ Wait until canvas is mounted
        if (!canvasRef.current) {
          console.warn("Canvas not mounted yet.");
          return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        setLoading(false);
      } catch (err) {
        console.error("Failed to render PDF cover:", err);
        setError(true);
        setLoading(false);
      }
    };

    renderFirstPage();
  }, [pdfUrl]);

  if (error) {
    return (
      <div style={{ 
        width, 
        height, 
        background: "#f0f0f0", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        border: "1px solid #ddd",
        borderRadius: "4px"
      }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>📄</div>
          <div style={{ fontSize: "12px" }}>Cover not available</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width, height, position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: loading ? "none" : "block" }} />
      {loading && (
        <div style={{ 
          width: "100%", 
          height: "100%", 
          background: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #ddd",
          borderRadius: "4px"
        }}>
          <div style={{ textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: "12px" }}>Loading cover...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFCoverPreview;
