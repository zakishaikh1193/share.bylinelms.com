import React, { useEffect, useState } from "react";
import axios from "../../../axiosConfig";
import "./issuedBook.css";
// No longer need Link for the flipbook
import { Link } from "react-router-dom"; 
import PDFCoverPreview from "../../../components/PDFCoverPreview";
// Import the updated FlipbookViewer
import FlipbookViewer from "./FlipbookViewer";

// --- FilterCategory Component (No Changes) ---
function FilterCategory({ title, options, selectedOptions, onChange }) {
  const [open, setOpen] = useState(true);

  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      onChange(selectedOptions.filter((o) => o !== option));
    } else {
      onChange([...selectedOptions, option]);
    }
  };

  return (
    <div className="filter-category issued-books">
      <div
        className="filter-title"
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer" }}
      >
        <strong>{title}</strong>
        <span className="toggle-icon">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <ul className="filter-options">
          {options.map((opt, i) => (
            <li key={i}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
                <span>{opt}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


// --- BookDetail Component (Modified) ---
// Now accepts `onReadBook` prop to trigger the modal
function BookDetail({ bookId, onGoBack, onReadBook }) {
  const [book, setBook] = useState(null);
  const [latestVersion, setLatestVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [countryName, setCountryName] = useState("N/A");
  // NEW: State to manage the description's expanded/collapsed view
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);


  const getFileSize = async (versionLabel) => {
    // ... (your existing getFileSize function, no changes needed here)
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/books/${bookId}/file-size/${encodeURIComponent(versionLabel)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { pdf_size, zip_size } = response.data;
      const formatted = [];
      if (pdf_size)
        formatted.push(`PDF: ${(pdf_size / (1024 * 1024)).toFixed(2)} MB`);
      if (zip_size)
        formatted.push(`ZIP: ${(zip_size / (1024 * 1024)).toFixed(2)} MB`);
      setFileSize(
        formatted.length > 0 ? formatted.join(" | ") : null
      );
    } catch (error) {
      console.error( "Error fetching file size:", error.response?.data || error.message);
      setFileSize(null);
    }
  };

  useEffect(() => {
    // ... (your existing useEffect, no changes needed here)
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`/api/books/${bookId}/details`, { headers })
      .then((res) => {
        const processedBook = {
          ...res.data.book,
          country: res.data.book.country || res.data.book.country_name,
          grade: res.data.book.grade || "N/A",
          language: res.data.book.language || "N/A",
          subject: res.data.book.subject || "N/A",
        };

        setBook(processedBook);
        setLatestVersion(res.data.latest_version);

        axios.get("/api/countries", { headers }).then((res2) => {
          const country = res2.data.find(
            (c) => c.country_id === processedBook.country_id
          );
          setCountryName(country ? country.country_name : "N/A");
        });

        if (res.data.canDownload === 1) {
          setDownloadUrl(res.data.latest_version?.uploaded_link || null);
          const version = res.data.latest_version;
          if (version?.version_label) {
            getFileSize(version.version_label);
          } else {
            setFileSize(null);
          }
        } else {
          setDownloadUrl(null);
          setFileSize(null);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching book details:", err);
        setLoading(false);
        setFileSize(null);
      });
  }, [bookId]);

  // ... (your existing download handlers, no changes needed)
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("token");
      const versionLabel = latestVersion?.version_label;
      if (!versionLabel) {
        alert("Version info missing. Cannot download.");
        return;
      }
      const blobRes = await axios.get(
        `/api/books/${book.book_id}/download/${encodeURIComponent(versionLabel)}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([blobRes.data], { type: blobRes.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = book.title || "Book.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      alert("Download not permitted or failed.");
    }
  };
  const handleDownloadZip = async () => {
    try {
      const token = localStorage.getItem("token");
      const versionLabel = latestVersion?.version_label;
      if (!versionLabel) {
        alert("Version info missing. Cannot download ZIP.");
        return;
      }
      const res = await axios.get(
        `/api/books/${book.book_id}/download-zip/${encodeURIComponent(versionLabel)}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${book.title || "Book"}_${versionLabel}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP download failed", err);
      alert("ZIP download not permitted or failed.");
    }
  };
  const handleDownloadCover = async () => {
    try {
      const token = localStorage.getItem("token");
      const blobRes = await axios.get(
        `/api/books/${book.book_id}/download-cover`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([blobRes.data], { type: blobRes.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${book.title || "Book"}_Cover.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Cover download failed", err);
      alert("Download not permitted or failed.");
    }
  };
  const handleRequestAccess = async (bookId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/books/book-control/request",
        { book_id: bookId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert("Access request sent successfully!");
      } else {
        alert("Failed to request access.");
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      alert("Something went wrong while requesting access.");
    }
  };

  if (loading) return <div className="loading-message">Loading book...</div>;
  if (!book) return <div className="error-message">Book not found.</div>;

  // NEW: Logic for truncating the description
  const wordLimit = 50;
  const fullDescription = book.descriptionLong || book.description || "";
  // Use regex \s+ to split by any whitespace, which is more robust
  const words = fullDescription.split(/\s+/);
  const isLongDescription = words.length > wordLimit;

  const getTruncatedDescription = () => {
    if (!isLongDescription) {
      return fullDescription;
    }
    return isDescriptionExpanded 
      ? fullDescription 
      : `${words.slice(0, wordLimit).join(" ")}...`;
  };


  return (
    <div className="book-detail-page issued-books">
      <div className="book-detail-card">
        {/* ... (Your breadcrumb, table, and cover JSX remains the same) ... */}
        <div className="breadcrumb">
          <span className="breadcrumb-link" style={{ cursor: "default" }}>Dashboard</span>{" "}
          {" "}
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
            ) : (
              <></>
            )}
          </div>
        </div>
        
        {/* NEW: Updated Description Section */}
        <div className="book-description-section">
          <h1 className="book-title">{book.title}</h1>
          <p className="book-description-long">{getTruncatedDescription()}</p>
          {isLongDescription && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="btn-read-more"
            >
              {isDescriptionExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
            {/* ... (Your action buttons JSX remains the same) ... */}
            <button onClick={onGoBack} className="btn-go-back" type="button">
                <svg className="btn-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Go Back
            </button>
            <button onClick={onReadBook} className="btn-learn-more" style={{ marginLeft: "10px" }} >
                Read Book
            </button>
            {downloadUrl ? (
                <>
                <button className="btn-learn-more" onClick={handleDownload}>Download PDF</button>
                <button className="btn-learn-more" onClick={handleDownloadCover}>Download Cover</button>
                {latestVersion?.zip_link ? (
                    <button className="btn-learn-more" onClick={handleDownloadZip}>Download ZIP File</button>
                ) : (
                    <button className="btn-learn-more disabled" onClick={() => alert("ZIP file not available for this book.")}>ZIP Not Available</button>
                )}
                </>
            ) : (
                <button className="btn-learn-more" onClick={() => handleRequestAccess(book.book_id || book.id)}>Request Access</button>
            )}
        </div>
        <div className="footer-text">© 2025 Byline Learning Solutions LLP</div>
      </div>
    </div>
  );
}

// --- BooksList Component (Modified) ---
function BooksList({ books, onReadMore, filterOptions }) {
  const [filters, setFilters] = useState({
    subject: [],
    grade: [],
    type: [],
    version: [],
    country: [],
    language: [],
    format: [],
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBooks = books.filter((book) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const searchMatch = !searchTerm ||
      (book.title?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (book.description?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (book.grade?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (book.subject?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (book.language?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (book.format_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (book.country?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (book.isbn?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      book.tags?.some(tag => tag.tag_name.toLowerCase().includes(lowerCaseSearchTerm));
    
    if (!searchMatch) return false;

    const subjectMatch = filters.subject.length === 0 || filters.subject.includes(book.subject);
    const gradeMatch = filters.grade.length === 0 || filters.grade.includes(book.grade);
    const typeMatch = filters.type.length === 0 || filters.type.includes(book.type);
    const versionMatch = filters.version.length === 0 || filters.version.includes(book.version);
    const countryMatch = filters.country.length === 0 || filters.country.includes(book.country);
    const languageMatch = filters.language.length === 0 || filters.language.includes(book.language);
    const formatMatch = filters.format.length === 0 || filters.format.includes(book.format_name);
    return subjectMatch && gradeMatch && typeMatch && versionMatch && countryMatch && languageMatch && formatMatch;
  });

  return (
    <div className="books-list-container issued-books">
      <aside className="filter-sidebar">
        <h3 className="sidebar-heading">Filters</h3>
        <FilterCategory title="Subject" options={filterOptions.subjects} selectedOptions={filters.subject} onChange={(s) => setFilters((f) => ({ ...f, subject: s }))}/>
        <FilterCategory title="Grade" options={filterOptions.grades} selectedOptions={filters.grade} onChange={(s) => setFilters((f) => ({ ...f, grade: s }))}/>
        <FilterCategory title="Book Type" options={filterOptions.types} selectedOptions={filters.type} onChange={(s) => setFilters((f) => ({ ...f, type: s }))}/>
        <FilterCategory title="Format" options={filterOptions.formats} selectedOptions={filters.format} onChange={(s) => setFilters((f) => ({ ...f, format: s }))}/>
        <FilterCategory title="Version" options={filterOptions.versions} selectedOptions={filters.version} onChange={(s) => setFilters((f) => ({ ...f, version: s }))}/>
        <FilterCategory title="Country" options={filterOptions.countries} selectedOptions={filters.country} onChange={(s) => setFilters((f) => ({ ...f, country: s }))}/>
        <FilterCategory title="Language" options={filterOptions.languages} selectedOptions={filters.language} onChange={(s) => setFilters((f) => ({ ...f, language: s }))}/>
      </aside>
      <main className="books-content-main">
        <div className="content-header-with-search">
          <h2 className="content-heading">Books Available</h2>
          <div className="search-container">
  {/* The Search Icon (SVG) */}
<svg className="search-icon" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
<path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path>
</svg>
  
  {/* Your Input Field */}
  <input
    type="text"
    placeholder="Search by title, description, or tag..."
    className="bookx-search-bar"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
        </div>
        {filteredBooks.length === 0 ? (
          <p className="no-books-message">No books match the selected filters.</p>
        ) : (
          <div className="books-grid">
            {filteredBooks.map((book) => (
              <div key={book.book_id || book.id} className="book-card-issued">
  <div className="book-card-issued-image-wrapper">
    <PDFCoverPreview 
      pdfUrl={`/api/books/${book.book_id}/stream-cover`} 
      width={390} 
      height={500} // Adjusted for a taller book look
    />
  </div>
  <div className="book-card-issued-content">
    <h3 className="book-card-issued-title">{book.title}</h3>
    <p className="book-card-issued-subtitle">{book.description ? book.description.substring(0, 40) + '...' : book.isbn}</p>
    
    <div className="book-card-issued-tags">
      {book.grade && book.grade !== 'N/A' && 
        <span className="book-card-issued-tag">{book.grade}</span>
      }
      {book.format_name && book.format_name !== 'N/A' &&
        <span className="book-card-issued-tag">{book.format_name}</span>
      }
      {book.subject && book.subject !== 'N/A' && 
        <span className="book-card-issued-tag">{book.subject}</span>
      }
      {book.version && book.version !== 'N/A' && 
        <span className="book-card-issued-tag">{book.version}</span>
      }
      {book.type && book.type !== 'N/A' && 
        <span className="book-card-issued-tag">{book.type}</span>
      }
      {book.language && book.language !== 'N/A' && 
        <span className="book-card-issued-tag">{book.language}</span>
      }
      {book.country && book.country !== 'N/A' && 
        <span className="book-card-issued-tag">{book.country}</span>
      }
      {book.isbn && book.isbn !== 'N/A' && 
        <span className="book-card-issued-tag">{book.isbn}</span>
      }
      {book.tags?.map(tag => (
        <span key={tag.tag_id} className="book-card-issued-tag tag-specific">{tag.tag_name}</span>
      ))}
    </div>
    
    <button onClick={() => onReadMore(book)} className="book-card-issued-button" type="button">
      Read More
    </button>
  </div>
</div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// --- Root Component (Modified) ---
const Books = () => {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  // NEW STATE: To control the flipbook modal
  const [flipbookBookId, setFlipbookBookId] = useState(null);
  
  const [filterOptions, setFilterOptions] = useState({
    subjects: [], grades: [], types: [], versions: [], countries: [], languages: [], formats: []
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get("/api/books", { headers }),
      axios.get("/api/grades", { headers }),
      axios.get("/api/languages", { headers }),
      axios.get("/api/subjects", { headers }),
      axios.get("/api/booktypes", { headers }),
      axios.get("/api/book-formats", { headers }),
    ])
      .then(([booksRes, gradesRes, languagesRes, subjectsRes, bookTypesRes, formatsRes]) => {
        const gradeMap = new Map(gradesRes.data.map((g) => [g.grade_id, g.grade_level]));
        const languageMap = new Map(languagesRes.data.map((l) => [l.language_id, l.language_name || l.name || l.title,]));
        const subjectMap = new Map(subjectsRes.data.map((s) => [s.subject_id, s.subject_name || s.name || s.title,]));
        const bookTypeMap = new Map(bookTypesRes.data.map((bt) => [bt.book_type_id, bt.book_type_title]));
        const formatMap = new Map(formatsRes.data.map((f) => [f.format_id, f.format_name]));

        const apiBooks = booksRes.data.books.map((book) => ({
          id: book.book_id, book_id: book.book_id, title: book.title, description: book.description, descriptionLong: book.description,
          grade: gradeMap.get(book.grade_id) || "N/A", version: book.version_label || "N/A", type: book.book_type_title,
          country: book.country_name, language: languageMap.get(book.language_id) || "N/A", subject: subjectMap.get(book.subject_id) || "N/A",
          isbn: book.isbn_code || "N/A",
          format_name: formatMap.get(book.format_id) || "N/A",
          tags: book.tags || [],
          img: book.cover ? `${axios.defaults.baseURL}/${book.cover.replace(/\\/g, "/")}` : null,
          coverUrl: book.cover ? `${axios.defaults.baseURL}/${book.cover.replace(/\\/g, "/")}` : null,
        }));
        setBooks(apiBooks);
        setFilterOptions({
          grades: [...new Set(gradesRes.data.map((g) => g.grade_level))].filter(Boolean),
          languages: [...new Set(languagesRes.data.map((l) => l.language_name || l.name || l.title))].filter(Boolean),
          subjects: [...new Set(subjectsRes.data.map((s) => s.subject_name || s.name || s.title))].filter(Boolean),
          types: [...new Set(bookTypesRes.data.map((bt) => bt.book_type_title))].filter(Boolean),
          formats: [...new Set(formatsRes.data.map((f) => f.format_name))].filter(Boolean),
          versions: [...new Set(booksRes.data.books.map((b) => b.version_label))].filter(Boolean),
          countries: [...new Set(booksRes.data.books.map((b) => b.country_name || "N/A"))].filter(Boolean),
        });
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      });
  }, []);

  return (
    <div className="app-container issued-books">
      {selectedBook ? (
        <BookDetail
          bookId={selectedBook}
          onGoBack={() => setSelectedBook(null)}
          // Pass the function to open the modal with the current book's ID
          onReadBook={() => setFlipbookBookId(selectedBook)}
        />
      ) : (
        <BooksList
          books={books}
          onReadMore={(book) => setSelectedBook(book.book_id || book.id)}
          filterOptions={filterOptions}
        />
      )}

      {/* NEW: Conditionally render the FlipbookViewer modal */}
      {flipbookBookId && (
        <FlipbookViewer
          bookId={flipbookBookId}
          onClose={() => setFlipbookBookId(null)}
        />
      )}
    </div>
  );
};

export default Books;