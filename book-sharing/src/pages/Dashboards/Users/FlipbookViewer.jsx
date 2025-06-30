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
 
  const flipBookRef = useRef();
  const modalContentRef = useRef();
  const flipSoundRef = useRef(null); // <-- ADD THIS
 
  useEffect(() => {
    flipSoundRef.current = new Audio('/sounds/paper-flip.mp3');
    flipSoundRef.current.volume = 1; // Set a subtle volume
}, []);
 
const playFlipSound = () => {
    if (flipSoundRef.current) {
        // Rewind to start and play, allowing rapid flips
        flipSoundRef.current.currentTime = 0;
        flipSoundRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
};
 
 
  // Fetches PDF and prepares pages
  useEffect(() => {
    const fetchPdfAndLanguage = async () => {
      try {
        setLoadingProgress(0);
        const token = localStorage.getItem("token");
 
        const langRes = await axios.get(`/api/books/${bookId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const language = langRes.data.book?.language || langRes.data.book?.language_name;
        const isBookRtl = language?.toLowerCase().startsWith("ar");
        setIsRtl(isBookRtl);
 
        const pdfRes = await axios.get(`/api/books/${bookId}/stream-version`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        });
        const loadingTask = pdfjsLib.getDocument({ data: pdfRes.data });
        const pdf = await loadingTask.promise;
 
        let imagePages = [];
        const numPages = pdf.numPages;
 
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          await page.render({ canvasContext: context, viewport }).promise;
          imagePages.push(canvas.toDataURL("image/jpeg", 0.9));
          setLoadingProgress(Math.round((i / numPages) * 100));
        }
 
        // *** FIX #1: Insert blank page after cover for RTL books ***
        if (isBookRtl) {
          const blankPage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
          // Insert blank page at index 1 (after the cover)
          if (imagePages.length > 0 && imagePages.length % 2 != 0) {
            imagePages.splice(imagePages.length - 1, 0, blankPage);
          }
          else if (imagePages.length > 0) {
            imagePages.splice(imagePages.length - 1, 0);
          }
        }
 
        setPages(imagePages);
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Could not load the book.");
        onClose();
      }
    };
    fetchPdfAndLanguage();
  }, [bookId, onClose]);
 
  // Sizing Logic (No changes)
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
 
  // RTL initial flip (No changes)
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
 
  // *** FIX #3a: Updated page number display logic ***
  useEffect(() => {
    if (pages.length === 0) return;
 
    const totalRealPages = isRtl ? pages.length - 1 : pages.length;
    let displayPage;
 
    if (isRtl) {
      // `currentPage` is the index in the *reversed* array
      if (currentPage === pages.length - 1) { // Cover page
        displayPage = 1;
      } else if (currentPage === pages.length - 2) { // Blank page
        displayPage = 2; // Show the number of the facing page
      } else {
        // Map the reversed index back to the original page number
        displayPage = totalRealPages - currentPage;
      }
    } else {
      displayPage = currentPage + 1;
    }
 
    setPageInput(String(Math.max(1, Math.min(displayPage, totalRealPages))));
 
  }, [currentPage, isRtl, pages]);
 
  // Control handlers
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
 
  // *** FIX #3b: Updated Go To Page logic ***
  const handleGoToPage = (e) => {
    e.preventDefault();
    let pageNumber = parseInt(pageInput, 10);
    if (isNaN(pageNumber)) return;
 
    const totalRealPages = isRtl ? pages.length - 1 : pages.length;
    pageNumber = Math.max(1, Math.min(pageNumber, totalRealPages));
 
    let targetIndex;
    if (isRtl) {
      if (pageNumber === 1) { // Go to Cover
        targetIndex = pages.length - 1;
      } else {
        // Map user page number to reversed array index, accounting for the blank page
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
 
        {loadingProgress < 100 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your book... {loadingProgress}%</p>
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
                  playFlipSound(); // <-- CALL THE SOUND FUNCTION
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
        {/* Zoom Controls */}
        <button onClick={handleZoomOut} title="Zoom Out"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM8 9h3v1H8z" /></svg></button>
        <button onClick={handleZoomIn} title="Zoom In"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 9H8v1h2v2h1v-2h2V9h-2V7h-1v2z" /></svg></button>
        <div className="separator"></div>
 
        <div className="page-nav-controls">
          {/* *** FIX #2: Simplified Navigation Buttons *** */}
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