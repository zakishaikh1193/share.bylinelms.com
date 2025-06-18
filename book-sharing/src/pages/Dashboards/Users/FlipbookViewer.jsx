import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import axios from "../../../axiosConfig";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import HTMLFlipBook from "react-pageflip";
import { useParams } from "react-router-dom";
import "./FlipbookViewer.css";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function FlipbookViewer() {
  const { bookId } = useParams();
  const [pages, setPages] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const flipBookRef = useRef();
  const totalPagesRef = useRef(0);
  const [bookDimensions, setBookDimensions] = useState({ width: 0, height: 0 });
  const wrapperRef = useRef();
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/books/${bookId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const language =
          res.data.book?.language || res.data.book?.language_name;
        if (language?.toLowerCase().startsWith("ar")) {
          setIsRtl(true);
        }
      } catch (err) {
        console.error("Failed to fetch language:", err);
      }
    };

    fetchLanguage();
  }, [bookId]);

  useLayoutEffect(() => {
    const updateSize = () => {
      if (!wrapperRef.current || pages.length === 0) return;

      const wrapperWidth = wrapperRef.current.clientWidth;
      const wrapperHeight = wrapperRef.current.clientHeight;

      const tempImg = document.createElement("img");
      tempImg.src = pages[0];
      tempImg.onload = () => {
        const aspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
        const doublePageAspectRatio = aspectRatio * 2;
        const containerAspectRatio = wrapperWidth / wrapperHeight;

        let newWidth, newHeight;

        if (containerAspectRatio > doublePageAspectRatio) {
          newHeight = wrapperHeight;
          newWidth = (newHeight * doublePageAspectRatio) / 2;
        } else {
          newWidth = wrapperWidth / 2;
          newHeight = newWidth / aspectRatio;
        }

        setBookDimensions({
          width: Math.floor(newWidth),
          height: Math.floor(newHeight),
        });
      };
    };

    const observer = new ResizeObserver(updateSize);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    updateSize();

    return () => observer.disconnect();
  }, [pages]);

  const CircularProgress = ({ progress }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="progress-container">
        <svg className="progress-circle" width="100" height="100">
          <circle
            className="progress-circle-bg"
            cx="50"
            cy="50"
            r={radius}
            strokeWidth="8"
          />
          <circle
            className="progress-circle-fill"
            cx="50"
            cy="50"
            r={radius}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="progress-text">{progress}%</div>
      </div>
    );
  };

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        const token = localStorage.getItem("token");

        await axios.get(`/api/books/${bookId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const pdfRes = await axios.get(`/api/books/${bookId}/stream-version`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        });

        const loadingTask = pdfjsLib.getDocument({ data: pdfRes.data });
        const pdf = await loadingTask.promise;
        totalPagesRef.current = pdf.numPages;

        const imagePages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;
          imagePages.push(canvas.toDataURL());

          setLoadingProgress(Math.round((i / pdf.numPages) * 100));
        }

        // Ensure even pages count
        if ((imagePages.length - 2) % 2 !== 0) {
          const blankCanvas = document.createElement("canvas");
          blankCanvas.width = 800;
          blankCanvas.height = 1100;
          const blankCtx = blankCanvas.getContext("2d");
          blankCtx.fillStyle = "#ffffff";
          blankCtx.fillRect(0, 0, blankCanvas.width, blankCanvas.height);
          const blankPage = blankCanvas.toDataURL();
          imagePages.splice(imagePages.length - 1, 0, blankPage);
        }

        setPages(imagePages);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    fetchPDF();
  }, [bookId]);

  // ✅ Reliable flipping for RTL after pages are ready
  useEffect(() => {
    if (flipBookRef.current && isRtl && pages.length > 0) {
      const maxRetries = 20;
      let tries = 0;

      const interval = setInterval(() => {
        try {
          if (
            flipBookRef.current.pageFlip()?.getCurrentPageIndex !== undefined
          ) {
            flipBookRef.current.pageFlip().flip(pages.length - 1);
            clearInterval(interval);
          }
        } catch (err) {
          if (++tries > maxRetries) clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [pages, isRtl]);

  const orderedPages = isRtl ? [...pages].reverse() : pages;

  return (
    <div className="flipbook-wrapper" ref={wrapperRef}>
      {loadingProgress < 100 ? (
        <div className="loading-overlay">
          <CircularProgress progress={loadingProgress} />
          <p>Loading your flipbook...</p>
        </div>
      ) : (
        <>
          <HTMLFlipBook
            width={bookDimensions.width}
            height={bookDimensions.height}
            size="stretch"
            minWidth={200}
            maxWidth={600}
            minHeight={280}
            maxHeight={840}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            className="flipbook-responsive"
            onFlip={(e) => setCurrentPage(e.data)}
            ref={flipBookRef}
            rtl={isRtl}
          >
            {orderedPages.map((page, index) => (
              <div key={index} className="page">
                <img
                  src={page}
                  alt={`Page ${index + 1}`}
                  className="page-image"
                />
              </div>
            ))}
          </HTMLFlipBook>

          <button
            className="nav-button left"
            onClick={() => flipBookRef.current?.pageFlip().flipPrev()}
          >
            ◀
          </button>

          <button
            className="nav-button right"
            onClick={() => flipBookRef.current?.pageFlip().flipNext()}
          >
            ▶
          </button>

          <div className="page-info">
            Page {isRtl ? pages.length - currentPage : currentPage + 1} of{" "}
            {pages.length} (
            {isRtl ? currentPage : pages.length - (currentPage + 1)} remaining)
          </div>
        </>
      )}
    </div>
  );
}

export default FlipbookViewer;
