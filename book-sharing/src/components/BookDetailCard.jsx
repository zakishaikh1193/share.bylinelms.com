import React from "react";
import PDFCoverPreview from "./PDFCoverPreview";

function BookDetailCard({
  book,
  countryName = "N/A",
  fileSize,
  onGoBack,
  onReadBook,
  onDownload,
  onDownloadZip,
  onDownloadCover,
  onRequestAccess,
  loading = false,
  latestVersion,
  downloadUrl,
  isDescriptionExpanded,
  onToggleDescription,
  wordLimit = 50,
}) {
  if (loading) return <div className="loading-message">Loading book...</div>;
  if (!book) return <div className="error-message">Book not found.</div>;

  const fullDescription = book.descriptionLong || book.description || "";
  const words = fullDescription.split(/\s+/);
  const isLongDescription = words.length > wordLimit;
  const getTruncatedDescription = () => {
    if (!isLongDescription) return fullDescription;
    return isDescriptionExpanded
      ? fullDescription
      : `${words.slice(0, wordLimit).join(" ")}...`;
  };

  return (
    <div className="book-detail-card">
      <div className="breadcrumb">
        <span className="breadcrumb-link" style={{ cursor: "default" }}>Dashboard</span>{" "}
        <span className="breadcrumb-link" style={{ cursor: "default" }}>Course Detail</span>
      </div>
      <div className="book-table-cover-row">
        <div className="book-table-cover-row-inner">
          <div className="book-details-table-container">
            <h3 className="section-heading">Book Specifications</h3>
            <table className="book-details-table">
              <tbody>
                <tr><td><strong>Grade:</strong></td><td>{book.grade || "N/A"}</td></tr>
                <tr><td><strong>Version:</strong></td><td>{latestVersion?.version_label || "N/A"}</td></tr>
                <tr><td><strong>Language:</strong></td><td>{book.language || "N/A"}</td></tr>
                <tr><td><strong>Subject:</strong></td><td>{book.subject || "N/A"}</td></tr>
                <tr><td><strong>Country:</strong></td><td>{countryName}</td></tr>
                <tr><td><strong>Book Type:</strong></td><td>{book.book_type_title || book.type || "N/A"}</td></tr>
                <tr><td><strong>ISBN:</strong></td><td>{latestVersion?.isbn_code || book.isbn || "N/A"}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="book-image-container">
            <PDFCoverPreview
              pdfUrl={`/api/books/${book.book_id}/stream-cover`}
              width={300}
              height={360}
            />
            {fileSize && (
              <div className="book-size-info">
                <span className="size-label">File Size:</span>
                <span className="size-value">{loading ? "Loading..." : fileSize}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="book-details-tags-container">
        <span className="tags-label">Popular Tags</span>
        <div className="book-details-tags">
          {book.tags && book.tags.length > 0 ? (
            book.tags.map(tag => (
              <span key={tag.tag_id} className="book-detail-tag">{tag.tag_name}</span>
            ))
          ) : null}
        </div>
      </div>
      <div className="book-description-section">
        <h1 className="book-title">{book.title}</h1>
        <p className="book-description-long">{getTruncatedDescription()}</p>
        {isLongDescription && (
          <button
            onClick={onToggleDescription}
            className="btn-read-more"
          >
            {isDescriptionExpanded ? "Read Less" : "Read More"}
          </button>
        )}
      </div>
      <div className="action-buttons">
        <button onClick={onGoBack} className="btn-go-back" type="button">
          <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Go Back
        </button>
        <button onClick={onReadBook} className="btn-learn-more" style={{ marginLeft: "10px" }}>
          Read Book
        </button>
        {downloadUrl ? (
          <>
            <button className="btn-learn-more" onClick={onDownload}>Download PDF</button>
            <button className="btn-learn-more" onClick={onDownloadCover}>Download Cover</button>
            {latestVersion?.zip_link ? (
              <button className="btn-learn-more" onClick={onDownloadZip}>Download ZIP File</button>
            ) : (
              <button className="btn-learn-more disabled" onClick={() => alert("ZIP file not available for this book.")}>ZIP Not Available</button>
            )}
          </>
        ) : (
          <button className="btn-learn-more" onClick={() => onRequestAccess(book.book_id || book.id)}>Request Access</button>
        )}
      </div>
      <div className="footer-text">© 2025 Byline Learning Solutions LLP</div>
    </div>
  );
}

export default BookDetailCard; 