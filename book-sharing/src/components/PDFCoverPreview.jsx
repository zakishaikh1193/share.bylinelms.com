import React, { useEffect, useRef, useState, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import axios from "../axiosConfig";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Global cache for rendered cover images (base64 data URLs)
const coverImageCache = new Map();

const PDFCoverPreview = React.memo(({ pdfUrl, width = 200, height = 260, bookTitle = "" }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cachedImageUrl, setCachedImageUrl] = useState(null);
  const containerRef = useRef(null);

  // Check cache first
  useEffect(() => {
    const cached = coverImageCache.get(pdfUrl);
    if (cached) {
      setCachedImageUrl(cached);
      setLoading(false);
      setError(false);
    }
  }, [pdfUrl]);

  // Lazy load: Observe when the component is in the viewport
  useEffect(() => {
    // If we have cached image, skip intersection observer
    if (cachedImageUrl) {
      setIsVisible(true);
      return;
    }

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
  }, [cachedImageUrl]);

  // Render PDF and cache the result
  useEffect(() => {
    // Skip if we have cached image or not visible yet
    if (cachedImageUrl || !isVisible) return;

    let cancelled = false;
    const renderFirstPage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Check cache again (in case it was added by another instance)
        const cached = coverImageCache.get(pdfUrl);
        if (cached) {
          if (!cancelled) {
            setCachedImageUrl(cached);
            setLoading(false);
          }
          return;
        }

        const token = localStorage.getItem("token");
        const response = await axios.get(pdfUrl, {
          responseType: "arraybuffer",
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Check if response is an image (from Heyzine API)
        const contentType = response.headers['content-type'] || '';
        if (contentType.startsWith('image/')) {
          // Convert arraybuffer to blob and create object URL
          const blob = new Blob([response.data], { type: contentType });
          const imageUrl = URL.createObjectURL(blob);
          
          // Also convert to data URL for caching
          const reader = new FileReader();
          reader.onloadend = () => {
            const imageDataUrl = reader.result;
            coverImageCache.set(pdfUrl, imageDataUrl);
            if (!cancelled) {
              setCachedImageUrl(imageDataUrl);
              setLoading(false);
            }
            URL.revokeObjectURL(imageUrl);
          };
          reader.readAsDataURL(blob);
          return;
        }
        
        // Otherwise, treat as PDF and render first page
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
        
        // Convert canvas to image and cache it
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        coverImageCache.set(pdfUrl, imageDataUrl);
        
        if (!cancelled) {
          setCachedImageUrl(imageDataUrl);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };
    
    renderFirstPage();
    return () => { cancelled = true; };
  }, [pdfUrl, isVisible, cachedImageUrl]);

  if (error) {
    return (
      <div ref={containerRef} style={{ 
        width, 
        height, 
        background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 50%, #f0f4f8 100%)",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        border: "1px solid rgba(226, 232, 240, 0.8)"
      }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.7 }}>📄</div>
          <div style={{ 
            fontSize: "18px", 
            fontWeight: 400,
            fontFamily: "Georgia, serif",
            color: "#475569"
          }}>
            {bookTitle || "Cover not available"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width, height, position: "relative" }}>
      {/* Use cached image if available, otherwise use canvas */}
      {cachedImageUrl ? (
        <img 
          ref={imgRef}
          src={cachedImageUrl} 
          alt="Book cover"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      ) : (
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: loading ? "none" : "block" }} />
      )}
      {(!isVisible || (loading && !cachedImageUrl)) && (
        <div style={{ 
          width: "100%", 
          height: "100%", 
          background: "linear-gradient(135deg, #f5f7fa 0%,rgb(221, 224, 226) 50%, #f0f4f8 100%)",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          borderRadius: "8px", 
          position: "absolute", 
          top: 0, 
          left: 0,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(226, 232, 240, 0.8)"
        }}>
          <div style={{ 
            textAlign: "center", 
            color: "#475569", 
            padding: "2rem 1.5rem",
            maxWidth: "90%"
          }}>
            {bookTitle ? (
              <div style={{ 
                fontSize: "22px", 
                fontWeight: 400, 
                lineHeight: "1.5",
                fontFamily: "Georgia, serif",
                color: "#334155",
                letterSpacing: "0.5px"
              }}>
                {bookTitle.length > 35 ? bookTitle.substring(0, 35) + "..." : bookTitle}
              </div>
            ) : (
              <div style={{ 
                fontSize: "14px", 
                fontWeight: 500,
                fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                color: "#64748b",
                opacity: 0.8
              }}>
                {isVisible ? "Loading cover..." : "Loading..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if pdfUrl or bookTitle changes
  return prevProps.pdfUrl === nextProps.pdfUrl && prevProps.bookTitle === nextProps.bookTitle;
});

PDFCoverPreview.displayName = 'PDFCoverPreview';

export default PDFCoverPreview;
