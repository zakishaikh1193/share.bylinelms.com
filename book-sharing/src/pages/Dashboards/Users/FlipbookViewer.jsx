import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import axios from "../../../axiosConfig";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import HTMLFlipBook from "react-pageflip";
import "./FlipbookViewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;   

const Page = React.forwardRef(({ pageImage, pageNumber }, ref) => {
  return (
    <div className="page" ref={ref}>
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

  // Fetch book language for RTL (No changes here)
  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/books/${bookId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const language =
          res.data.book?.language || res.data.book?.language_name;
        // Check if the language is Arabic
        if (language?.toLowerCase().startsWith("ar")) {
          setIsRtl(true);
        }
      } catch (err) {
        console.error("Failed to fetch language for RTL check:", err);
      }
    };

    fetchLanguage();
  }, [bookId]);

  // *** MODIFICATION IS INSIDE THIS useEffect BLOCK ***
  useEffect(() => {
    const fetchPdfAndLanguage = async () => {
      try {
        setLoadingProgress(0);
        const token = localStorage.getItem("token");

        // First, get the language to determine if we need special handling
        const langRes = await axios.get(`/api/books/${bookId}/details`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const language = langRes.data.book?.language || langRes.data.book?.language_name;
        const isBookRtl = language?.toLowerCase().startsWith("ar");
        setIsRtl(isBookRtl); // Set the state for the whole component

        // Now, fetch the PDF data
        const pdfRes = await axios.get(`/api/books/${bookId}/stream-version`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        });
        const loadingTask = pdfjsLib.getDocument({ data: pdfRes.data });
        const pdf = await loadingTask.promise;
        
        let imagePages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext("2d");
          await page.render({ canvasContext: context, viewport }).promise;
          imagePages.push(canvas.toDataURL("image/jpeg", 0.9));
          setLoadingProgress(Math.round((i / pdf.numPages) * 100));
        }

        // // *** NEW LOGIC: Duplicate the cover for RTL books ***
        //         if (isBookRtl && imagePages.length > 0) {
        //   // The first image in the array is the cover.
        //   const coverPage = imagePages[0];
        //   // We insert this duplicate at the beginning.
        //   // Array becomes: [cover, cover, page2, page3, ...]
        //   imagePages.unshift(coverPage);
        // }

        setPages(imagePages);
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Could not load the book.");
        onClose();
      }
    };
    fetchPdfAndLanguage();
  }, [bookId, onClose]);

 

  // Sizing Logic for "Zoomed-In" View (No changes here)
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

  // RTL and Page Input handlers (No changes here)
  useEffect(() => {
    if (flipBookRef.current && isRtl && pages.length > 0 && bookDimensions.width > 0) {
      setTimeout(() => flipBookRef.current.pageFlip().flip(pages.length - 1, ''), 100);
    }
  }, [pages, isRtl, bookDimensions]);
  
  useEffect(() => {
    if (pages.length > 0) {
        let displayPage;
        if (isRtl) {
            // Total "real" pages is length - 1.
            // Map the library's index to the real page number.
            displayPage = (pages.length - 1) - currentPage;
        } else {
            displayPage = currentPage + 1;
        }
        setPageInput(String(Math.max(1, displayPage)));
    }
  }, [currentPage, isRtl, pages]);

  // Control handlers
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const handleGoToPage = (e) => {
    e.preventDefault();
    let pageNumber = parseInt(pageInput, 10);
    if (isNaN(pageNumber)) return;
  
    const totalRealPages = isRtl ? pages.length - 1 : pages.length;
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalRealPages) pageNumber = totalRealPages;
  
    let targetIndex;
    if (isRtl) {
      // Mapping real RTL page number to the library's 0-based index
      targetIndex = (pages.length - 1) - pageNumber;
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
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this book',
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };
 

  const orderedPages = isRtl ? [...pages].reverse() : pages;

  return (
    <div className="flipbook-modal-overlay">
      <div className="flipbook-modal-content" ref={modalContentRef}>
        <button onClick={onClose} className="modal-close-button" title="Close">✕</button>
        
        {loadingProgress < 100 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your book... {loadingProgress}%</p>
          </div>
        ) : (
          <div 
            className={`flipbook-wrapper ${isRtl ? 'rtl-book' : ''}`} 
            style={{
              width: bookDimensions.width * 2,
              height: bookDimensions.height,
              transform: `scale(${scale})`
            }}
          >
            {bookDimensions.width > 0 && (
             <HTMLFlipBook
             key={`${bookDimensions.width}-${bookDimensions.height}`}
             width={bookDimensions.width}
             height={bookDimensions.height}
             size="stretch"
             maxShadowOpacity={0.95} // <-- UPDATED: Makes the turning page shadow much darker
             showCover={true}
             mobileScrollSupport={true}
             className="flipbook-component"
             onFlip={(e) => setCurrentPage(e.data)}
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
        {/* ...zoom, bookmark buttons... */}
        <button onClick={handleZoomOut} title="Zoom Out"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM8 9h3v1H8z"/></svg></button>
        <button onClick={handleZoomIn} title="Zoom In"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 9H8v1h2v2h1v-2h2V9h-2V7h-1v2z"/></svg></button>
             
        <div className="separator"></div>
        <div className="page-nav-controls">
          <button onClick={() => flipBookRef.current?.pageFlip().flip(0)} title="First Page"><svg viewBox="0 0 24 24"><path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"/></svg></button>
          <button onClick={() => flipBookRef.current?.pageFlip().flipPrev()} title="Previous Page"><svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg></button>
          <form onSubmit={handleGoToPage} className="page-number-form">
            <input type="text" className="page-number-input" value={pageInput} onChange={(e) => setPageInput(e.target.value)} onBlur={handleGoToPage} />
          </form>
          {/* Modified Page Total Display */}
          <span className="page-total">
            / {isRtl ? pages.length - 1 : pages.length}
          </span>
          <button onClick={() => flipBookRef.current?.pageFlip().flipNext()} title="Next Page"><svg viewBox="0 0 24 24"><path d="M8.59 7.41L13.17 12l-4.58 4.59L10 18l6-6-6-6-1.41 1.41z"/></svg></button>
          <button onClick={() => flipBookRef.current?.pageFlip().flip(pages.length - 1)} title="Last Page"><svg viewBox="0 0 24 24"><path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/></svg></button>
        </div>
        <div className="separator"></div>
        <button onClick={handleShare} title="Share"><svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg></button>
        <button onClick={handleToggleFullscreen} title="Toggle Fullscreen"><svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
      </div>
    </div>
  );
}

export default FlipbookViewer;