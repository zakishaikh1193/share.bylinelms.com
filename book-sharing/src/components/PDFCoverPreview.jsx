import React, { useEffect, useRef, useState, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import axios from "../axiosConfig";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFCoverPreview = ({ pdfUrl, width = 200, height = 260 }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // Lazy load: Observe when the component is in the viewport
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Memoize the rendered canvas for a given pdfUrl
  const renderCanvas = useMemo(() => {
    if (!isVisible) return;
    let cancelled = false;
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
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };
    renderFirstPage();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [pdfUrl, isVisible]);

  if (error) {
    return (
      <div ref={containerRef} style={{ width, height, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ddd", borderRadius: "4px" }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>📄</div>
          <div style={{ fontSize: "12px" }}>Cover not available</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width, height, position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: loading ? "none" : "block" }} />
      {(!isVisible || loading) && (
        <div style={{ width: "100%", height: "100%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ddd", borderRadius: "4px" }}>
          <div style={{ textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: "12px" }}>{isVisible ? "Loading cover..." : "Loading..."}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFCoverPreview;
