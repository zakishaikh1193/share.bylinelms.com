import React, { useEffect, useState } from "react";
import axios from "axios";
import pdfjsLib from "pdfjs-dist";

const handleNext = () => {
  if (isRtl) {
    flipBookRef.current?.pageFlip().flipPrev();
  } else {
    flipBookRef.current?.pageFlip().flipNext();
  }
};

const handlePrev = () => {
  if (isRtl) {
    flipBookRef.current?.pageFlip().flipNext();
  } else {
    flipBookRef.current?.pageFlip().flipPrev();
  }
};

// Adjust page number display for RTL
const getDisplayedPage = () => {
  if (isRtl) {
    return totalPages - currentPage;
  }
  return currentPage + 1;
};

const CircularProgress = ({ progress }) => (
  <div className="loading-container">
    <div className="progress-text">
      {isNaN(progress) ? 0 : Math.floor(progress)}%
    </div>
    <p>Loading your book, please wait...</p>
  </div>
);

const FlipbookViewer = ({ bookId }) => {
  const [isRtl, setIsRtl] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [bookDimensions, setBookDimensions] = useState({ width: 0, height: 0 });
  const wrapperRef = React.useRef(null);
  const flipBookRef = React.useRef(null);

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        const token = localStorage.getItem("token");
        setLoadingProgress(0); // Reset progress at start

        // Fetch book details to check language
        const detailsRes = await axios.get(`/api/books/${bookId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch PDF data
        const pdfRes = await axios.get(`/api/books/${bookId}/stream-version`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded)
            );
            setLoadingProgress(percentCompleted / 2); // Download is first 50%
          },
        });

        const loadingTask = pdfjsLib.getDocument({ data: pdfRes.data });
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);

        const imagePages = [];
        const desiredWidth = 1200; // Reduced from 1500 for better performance
        const batchSize = 5; // Process pages in batches

        for (let i = 1; i <= pdf.numPages; i += batchSize) {
          const batchPromises = [];
          for (let j = 0; j < batchSize && i + j <= pdf.numPages; j++) {
            const pageNum = i + j;
            batchPromises.push(
              (async () => {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.0 });
                const scale = desiredWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;

                await page.render({
                  canvasContext: context,
                  viewport: scaledViewport,
                }).promise;

                return canvas.toDataURL("image/jpeg", 0.85); // Slightly reduced quality for better performance
              })()
            );
          }

          const batchResults = await Promise.all(batchPromises);
          imagePages.push(...batchResults);

          // Update progress
          const progress = 50 + Math.round((i / pdf.numPages) * 50);
          setLoadingProgress(progress);
        }

        // Add a blank page at the end if needed
        if (imagePages.length % 2 !== 0) {
          const lastPageCanvas = document.createElement("canvas");
          const firstPage = await pdf.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1.0 });
          lastPageCanvas.width = viewport.width;
          lastPageCanvas.height = viewport.height;
          const blankCtx = lastPageCanvas.getContext("2d");
          blankCtx.fillStyle = "#fdfdfd";
          blankCtx.fillRect(0, 0, lastPageCanvas.width, lastPageCanvas.height);
          imagePages.push(lastPageCanvas.toDataURL());
        }

        const language = detailsRes.data.book?.language || detailsRes.data.book?.language_name;
        const reversedPages = language?.toLowerCase().startsWith("ar")
          ? [...imagePages].reverse()
          : imagePages;
        setIsRtl(language?.toLowerCase().startsWith("ar"));
        setPages(reversedPages);
        setLoadingProgress(100); // Ensure we reach 100% when done
      } catch (error) {
        console.error("Error loading PDF:", error);
        setLoadingProgress(0); // Reset progress on error
      }
    };

    fetchPDF();
  }, [bookId]);

  return (
    <div className="flipbook-wrapper" ref={wrapperRef}>
      {pages.length === 0 ? (
        <div className="loading-overlay">
          <CircularProgress progress={loadingProgress} />
        </div>
      ) : (
        <>
          <HTMLFlipBook
            width={bookDimensions.width}
            height={bookDimensions.height}
            size="stretch"
            minWidth={150}
            maxWidth={1000}
            minHeight={210}
            maxHeight={1400}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            className="flipbook-container"
            onFlip={(e) => setCurrentPage(e.data)}
            ref={flipBookRef}
            startPage={isRtl ? Math.floor(pages.length / 2) - 1 : 0}
            flippingTime={1000}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
          >
            {pages.map((page, index) => (
              <Page key={index} pageNumber={index + 1} image={page} />
            ))}
          </HTMLFlipBook>
          <div className="flipbook-navigation">
            <button onClick={handlePrev} className="nav-button">
              {isRtl ? "Next" : "Previous"}
            </button>
            <div className="page-info">
              Page {getDisplayedPage()} of {totalPages}
            </div>
            <button onClick={handleNext} className="nav-button">
              {isRtl ? "Previous" : "Next"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FlipbookViewer; 