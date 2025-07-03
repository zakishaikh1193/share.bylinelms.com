import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import axios from "../../../axiosConfig";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import HTMLFlipBook from "react-pageflip";
import "./FlipbookViewer.css";
 
 
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
 
const Page = React.forwardRef(({ pageImage, pageNumber }, ref) => {
  return (
    <div className="page realistic-page" ref={ref}>
      <img src={pageImage} alt={`Page ${pageNumber}`} className="page-image" />
    </div>
  );
});
 
function FlipbookViewer({ bookId, onClose }) {
  const [pages, setPages] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isRtl, setIsRtl] = useState(false);
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [bookDimensions, setBookDimensions] = useState({ width: 0, height: 0 });
  const [numPages, setNumPages] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [initialBatchLoaded, setInitialBatchLoaded] = useState(false);
 
  const BATCH_SIZE = 7;
 
  const flipBookRef = useRef();
  const modalContentRef = useRef();
  const flipSoundRef = useRef(null);
 
  useEffect(() => {
    flipSoundRef.current = new Audio('/sounds/paper-flip.mp3');
    flipSoundRef.current.volume = 1;
  }, []);
 
  const playFlipSound = () => {
    if (flipSoundRef.current) {
      flipSoundRef.current.currentTime = 0;
      flipSoundRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  };
 
  useEffect(() => {
    let isMounted = true;
    const fetchPdfAndLanguage = async () => {
      try {
        setLoadingProgress(0);
        setPages([]);
        setLoadingBatch(0);
        setNumPages(null);
        setPdfDoc(null);
        const token = localStorage.getItem("token");
        const langRes = await axios.get(`/api/books/${bookId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const language = langRes.data.book?.language || langRes.data.book?.language_name;
        const isBookRtl = language?.toLowerCase().startsWith("ar");
        setIsRtl(isBookRtl);
        const baseURL = axios.defaults.baseURL;
const pdfUrl = `${baseURL}/api/books/${bookId}/stream-version`;
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl, httpHeaders: { Authorization: `Bearer ${token}` } });
        const pdf = await loadingTask.promise;
        if (!isMounted) return;
        setNumPages(pdf.numPages);
        setPdfDoc(pdf);
        loadBatch(pdf, 0, isBookRtl);
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Could not load the book.");
        onClose();
      }
    };
    fetchPdfAndLanguage();
    return () => { isMounted = false; };
  }, [bookId, onClose]);
 
  const loadBatch = async (pdf, batchIndex, isBookRtl) => {
    if (!pdf) return;
    const start = batchIndex * BATCH_SIZE + 1;
    const end = Math.min((batchIndex + 1) * BATCH_SIZE, pdf.numPages);
    let newPages = [];
    for (let i = start; i <= end; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;
      newPages.push(canvas.toDataURL("image/webp", 0.8));
      setLoadingProgress(Math.round((i / pdf.numPages) * 100));
    }
    if (isBookRtl && batchIndex === 0) {
      const blankPage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      if (newPages.length > 0 && newPages.length % 2 !== 0) {
        newPages.splice(newPages.length - 1, 0, blankPage);
      } else if (newPages.length > 0) {
        newPages.splice(newPages.length - 1, 0);
      }
    }
    setPages(prev => {
      if (prev.length >= end) return prev;
      const combined = [...prev];
      for (let i = 0; i < newPages.length; i++) {
        if (!combined[start - 1 + i]) {
          combined[start - 1 + i] = newPages[i];
        }
      }
      return combined;
    });
    if (batchIndex === 0) {
      setInitialBatchLoaded(true);
    }
    if (end < pdf.numPages) {
      setTimeout(() => {
        setLoadingBatch(batchIndex + 1);
      }, 0);
    }
  };
 
  useEffect(() => {
    if (pdfDoc && numPages && loadingBatch * BATCH_SIZE < numPages) {
      loadBatch(pdfDoc, loadingBatch, isRtl);
    }
  }, [loadingBatch, pdfDoc, numPages, isRtl]);
 
  useLayoutEffect(() => {
    const updateSize = () => {
      if (!modalContentRef.current || pages.length === 0) return;
      const verticalPadding = 120;
      const horizontalPadding = 80;
      const availableWidth = modalContentRef.current.clientWidth - horizontalPadding;
      const availableHeight = modalContentRef.current.clientHeight - verticalPadding;
      const tempImg = new Image();
      tempImg.src = pages[0];
      tempImg.onload = () => {
        const pageAspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
        let bookWidth = availableWidth;
        let singlePageWidth = bookWidth / 2;
        let bookHeight = singlePageWidth / pageAspectRatio;
        if (bookHeight > availableHeight) {
          bookHeight = availableHeight;
          singlePageWidth = bookHeight * pageAspectRatio;
          bookWidth = singlePageWidth * 2;
        }
        setBookDimensions({
          width: Math.floor(singlePageWidth),
          height: Math.floor(bookHeight),
        });
      };
    };
    if (pages.length > 0) {
      const observer = new ResizeObserver(updateSize);
      if (modalContentRef.current) observer.observe(modalContentRef.current);
      updateSize();
      return () => observer.disconnect();
    }
  }, [pages]);
 
  useEffect(() => {
    let timeoutId;
    if (isRtl && pages.length > 0 && bookDimensions.width > 0) {
      timeoutId = setTimeout(() => {
        flipBookRef.current?.pageFlip().flip(pages.length - 1, '');
      }, 100);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pages, isRtl, bookDimensions]);
 
  useEffect(() => {
    if (pages.length === 0) return;
 
    const totalRealPages = isRtl ? pages.length - 1 : pages.length;
    let displayPage;
 
    if (isRtl) {
      if (currentPage === pages.length - 1) {
        displayPage = 1;
      } else if (currentPage === pages.length - 2) {
        displayPage = 2;
      } else {
        displayPage = totalRealPages - currentPage;
      }
    } else {
      displayPage = currentPage + 1;
    }
 
    setPageInput(String(Math.max(1, Math.min(displayPage, totalRealPages))));
 
  }, [currentPage, isRtl, pages]);
 
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
 
  const handleGoToPage = (e) => {
    e.preventDefault();
    let pageNumber = parseInt(pageInput, 10);
    if (isNaN(pageNumber)) return;
 
    const totalRealPages = isRtl ? pages.length - 1 : pages.length;
    pageNumber = Math.max(1, Math.min(pageNumber, totalRealPages));
 
    let targetIndex;
    if (isRtl) {
      if (pageNumber === 1) {
        targetIndex = pages.length - 1;
      } else {
        targetIndex = totalRealPages - pageNumber;
      }
    } else {
      targetIndex = pageNumber - 1;
    }
    flipBookRef.current?.pageFlip().flip(targetIndex);
  };
 
  const handleToggleFullscreen = () => {
    const elem = document.querySelector(".flipbook-modal-overlay");
    if (!document.fullscreenElement) {
      elem?.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };
 
  const orderedPages = isRtl ? [...pages].reverse() : pages;
 
  return (
    <div className="flipbook-modal-overlay" onContextMenu={e => e.preventDefault()}>
      <div className="flipbook-modal-content" ref={modalContentRef}>
        <button onClick={onClose} className="modal-close-button" title="Close">✕</button>
 
        {!initialBatchLoaded ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading first pages... {loadingProgress}%</p>
          </div>
        ) : (
          <div
            className={`flipbook-wrapper ${isRtl ? 'rtl-book' : ''} ${pages.length > 2 ? 'realistic-thickness' : ''}`}
            style={{
              width: bookDimensions.width > 0 ? bookDimensions.width * 2 : 'auto',
              height: bookDimensions.height > 0 ? bookDimensions.height : 'auto',
              transform: `scale(${scale})`
            }}
          >
            {bookDimensions.width > 0 && (
              <HTMLFlipBook
                key={`${bookDimensions.width}-${bookDimensions.height}-${isRtl}`}
                width={bookDimensions.width}
                height={bookDimensions.height}
                size="stretch"
                flippingTime={300}        
                maxShadowOpacity={1}      
                drawShadow={true}
 
                showCover={true}
                mobileScrollSupport={true}
                className="flipbook-component"
                onFlip={(e) => {
                  setCurrentPage(e.data);
                  playFlipSound();
              }}
                ref={flipBookRef}
                rtl={isRtl}
              >
                {orderedPages.map((page, index) => (
                  <Page key={index} pageImage={page} pageNumber={index + 1} />
                ))}
              </HTMLFlipBook>
            )}
          </div>
        )}
      </div>
 
      <div className="flipbook-bottom-bar">
        <button onClick={handleZoomOut} title="Zoom Out"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM8 9h3v1H8z" /></svg></button>
        <button onClick={handleZoomIn} title="Zoom In"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 9H8v1h2v2h1v-2h2V9h-2V7h-1v2z" /></svg></button>
        <div className="separator"></div>
 
        <div className="page-nav-controls">
          <button onClick={() => flipBookRef.current?.pageFlip().flip(0)} title="Go to Beginning"><svg viewBox="0 0 24 24"><path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" /></svg></button>
          <button onClick={() => flipBookRef.current?.pageFlip().flipPrev()} title="Previous Page"><svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg></button>
 
          <form onSubmit={handleGoToPage} className="page-number-form">
            <input type="text" className="page-number-input" value={pageInput} onChange={(e) => setPageInput(e.target.value)} onBlur={handleGoToPage} />
          </form>
 
          <span className="page-total">
            / {isRtl ? pages.length - 1 : pages.length}
          </span>
 
          <button onClick={() => flipBookRef.current?.pageFlip().flipNext()} title="Next Page"><svg viewBox="0 0 24 24"><path d="M8.59 7.41L13.17 12l-4.58 4.59L10 18l6-6-6-6-1.41 1.41z" /></svg></button>
          <button onClick={() => flipBookRef.current?.pageFlip().flip(pages.length - 1)} title="Go to End"><svg viewBox="0 0 24 24"><path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" /></svg></button>
        </div>
 
        <div className="separator"></div>
        <button onClick={handleToggleFullscreen} title="Toggle Fullscreen"><svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg></button>
      </div>
    </div>
  );
}
 
export default FlipbookViewer;