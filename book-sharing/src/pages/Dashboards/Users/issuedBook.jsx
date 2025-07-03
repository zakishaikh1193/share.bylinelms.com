import React, { useEffect, useState, useRef } from "react";
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

// --- Grouped Book Card ---
function GroupedBookCard({ group, onReadBook }) {
  // Prefer digital for preview/read, else print
  const main = group.digital || group.print;
  const digital = group.digital;
  const print = group.print;

  // Find latest ZIP (prefer digital, else print)
  const zipLink = (digital && digital.zip_link) || (print && print.zip_link);
  const zipBookId = (digital && digital.book_id) || (print && print.book_id);
  const zipVersionLabel = (digital && digital.version_label) || (print && print.version_label);

  // Download handlers
  const handleDownload = async (bookId, versionLabel) => {
    try {
      const token = localStorage.getItem("token");
      const blobRes = await axios.get(
        `/api/books/${bookId}/download/${encodeURIComponent(versionLabel)}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([blobRes.data], { type: blobRes.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Book_${bookId}_${versionLabel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download not permitted or failed.");
    }
  };
  const handleDownloadCover = async (bookId) => {
    try {
      const token = localStorage.getItem("token");
      const blobRes = await axios.get(
        `/api/books/${bookId}/download-cover`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([blobRes.data], { type: blobRes.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BookCover_${bookId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download not permitted or failed.");
    }
  };
  const handleDownloadZip = async () => {
    if (!zipLink || !zipBookId || !zipVersionLabel) return alert("ZIP not available");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/books/${zipBookId}/download-zip/${encodeURIComponent(zipVersionLabel)}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Book_${zipBookId}_${zipVersionLabel}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("ZIP download not permitted or failed.");
    }
  };

  return (
    <div className="book-card-issued">
      <div className="book-card-issued-image-wrapper">
        <PDFCoverPreview
          pdfUrl={`/api/books/${main.book_id}/stream-cover`}
          width={390}
          height={500}
        />
      </div>
      <div className="book-card-issued-content">
        <h3 className="book-card-issued-title">{group.title}</h3>
        <div className="book-card-issued-subtitle" style={{ minHeight: 24, maxHeight: 40, overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: group.description ? (group.description.length > 40 ? group.description.substring(0, 40) + '...' : group.description) : '' }}
        />
        <div className="book-card-issued-tags">
          {group.grade_level && <span className="book-card-issued-tag">Grade: {group.grade_level}</span>}
          {group.version_label && <span className="book-card-issued-tag">{group.version_label}</span>}
          {group.book_type_title && <span className="book-card-issued-tag">{group.book_type_title}</span>}
          {group.country_name && <span className="book-card-issued-tag">{group.country_name}</span>}
          {group.subject_name && <span className="book-card-issued-tag">{group.subject_name}</span>}
          {group.language_name && <span className="book-card-issued-tag">{group.language_name}</span>}
          {group.standard_name && <span className="book-card-issued-tag">{group.standard_name}</span>}
          {group.tags?.map(tag => (
            <span key={tag.tag_id} className="book-card-issued-tag tag-specific">{tag.tag_name}</span>
          ))}
        </div>
        <div className="book-card-issued-actions">
          {/* Read Book (digital only) */}
          {(digital || print) && (
            <button onClick={() => onReadBook((digital || print).book_id)} className="book-card-issued-button">Read Book</button>
          )}
          {/* Download Digital PDF */}
          {digital && (
            <button onClick={() => handleDownload(digital.book_id, digital.version_label)} className="book-card-issued-button">Download Digital PDF</button>
          )}
          {/* Download Digital Cover */}
          {digital && (
            <button onClick={() => handleDownloadCover(digital.book_id)} className="book-card-issued-button">Download Digital Cover</button>
          )}
          {/* Download Print PDF */}
          {print && (
            <button onClick={() => handleDownload(print.book_id, print.version_label)} className="book-card-issued-button">Download Print PDF</button>
          )}
          {/* Download Print Cover */}
          {print && (
            <button onClick={() => handleDownloadCover(print.book_id)} className="book-card-issued-button">Download Print Cover</button>
          )}
          {/* Download ZIP (latest) */}
          {zipLink ? (
            <button onClick={handleDownloadZip} className="book-card-issued-button">Download ZIP</button>
          ) : (
            <button className="book-card-issued-button disabled">ZIP Not Available</button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- BookDetail Component (Grouped) ---
function BookDetail({ group, onGoBack, onReadBook }) {
  const main = group.digital || group.print;
  const digital = group.digital;
  const print = group.print;
  const zipLink = (digital && digital.zip_link) || (print && print.zip_link);
  const zipBookId = (digital && digital.book_id) || (print && print.book_id);
  const zipVersionLabel = (digital && digital.version_label) || (print && print.version_label);

  // Read More logic for description
  const [showFullDesc, setShowFullDesc] = useState(false);
  const description = group.description || '';
  const words = description.split(/\s+/);
  const isLong = words.length > 50;
  const shortDesc = isLong ? words.slice(0, 50).join(' ') + '...' : description;

  // File size state
  const [pdfSize, setPdfSize] = useState(null);
  const [zipSize, setZipSize] = useState(null);

  // Dropdown state for PDF and Cover
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const pdfBtnRef = useRef();
  const coverBtnRef = useRef();

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pdfBtnRef.current && !pdfBtnRef.current.contains(event.target)) setPdfMenuOpen(false);
      if (coverBtnRef.current && !coverBtnRef.current.contains(event.target)) setCoverMenuOpen(false);
    }
    if (pdfMenuOpen || coverMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pdfMenuOpen, coverMenuOpen]);

  useEffect(() => {
    // Fetch file sizes for digital or print (prefer digital)
    const fetchSizes = async () => {
      const bookId = digital?.book_id || print?.book_id;
      const versionLabel = digital?.version_label || print?.version_label;
      if (!bookId || !versionLabel) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/books/${bookId}/file-size/${encodeURIComponent(versionLabel)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPdfSize(res.data.pdf_size || null);
        setZipSize(res.data.zip_size || null);
      } catch (err) {
        setPdfSize(null);
        setZipSize(null);
      }
    };
    fetchSizes();
  }, [digital, print]);

  // Download handlers (same as before, but use bookId/versionLabel from digital/print)
  const handleDownload = async (bookId, versionLabel) => {
    try {
      const token = localStorage.getItem("token");
      const blobRes = await axios.get(
        `/api/books/${bookId}/download/${encodeURIComponent(versionLabel)}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([blobRes.data], { type: blobRes.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Book_${bookId}_${versionLabel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download not permitted or failed.");
    }
  };
  const handleDownloadCover = async (bookId) => {
    try {
      const token = localStorage.getItem("token");
      const blobRes = await axios.get(
        `/api/books/${bookId}/download-cover`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([blobRes.data], { type: blobRes.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BookCover_${bookId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download not permitted or failed.");
    }
  };
  const handleDownloadZip = async () => {
    if (!zipLink || !zipBookId || !zipVersionLabel) return alert("ZIP not available");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/books/${zipBookId}/download-zip/${encodeURIComponent(zipVersionLabel)}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Book_${zipBookId}_${zipVersionLabel}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("ZIP download not permitted or failed.");
    }
  };

  return (
    <div className="book-detail-page issued-books">
      <div className="book-detail-card">
        <div className="breadcrumb">
          <span className="breadcrumb-link" style={{ cursor: "default" }}>Dashboard</span>{" "}
          <span className="breadcrumb-link" style={{ cursor: "default" }}>Book Detail</span>
        </div>
        {/* New flex row for table + cover */}
        <div className="book-detail-flex-row">
          <div className="book-details-table-container">
            <h3 className="section-heading">Book Specifications</h3>
            <table className="book-details-table">
              <tbody>
                <tr><td><strong>Grade:</strong></td><td>{group.grade_level || "N/A"}</td></tr>
                <tr><td><strong>Version:</strong></td><td>{group.version_label || "N/A"}</td></tr>
                <tr><td><strong>Language:</strong></td><td>{group.language_name || "N/A"}</td></tr>
                <tr><td><strong>Subject:</strong></td><td>{group.subject_name || "N/A"}</td></tr>
                <tr><td><strong>Country:</strong></td><td>{group.country_name || "N/A"}</td></tr>
                <tr><td><strong>Book Type:</strong></td><td>{group.book_type_title || "N/A"}</td></tr>
                <tr><td><strong>ISBN:</strong></td><td>{group.isbn_code || "N/A"}</td></tr>
                <tr><td><strong>Standard:</strong></td><td>{group.standard_name || "N/A"}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="book-image-container book-image-center-vertical book-image-lower-right">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <PDFCoverPreview
                pdfUrl={`/api/books/${main.book_id}/stream-cover`}
                width={300}
                height={360}
              />
              {/* File size info */}
              <div className="book-size-info" style={{ marginTop: '1.2em', textAlign: 'center', fontSize: '0.98em', color: '#64748b' }}>
                {pdfSize !== null && (
                  <div><span className="size-label">PDF</span> <span className="size-value">{pdfSize ? (pdfSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</span></div>
                )}
                {zipSize !== null && (
                  <div><span className="size-label">ZIP</span> <span className="size-value">{zipSize ? (zipSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Description below table, full width */}
        <div className="book-description-section">
          <h2 className="book-title">{group.title}</h2>
          <div className="book-description-long" style={{ whiteSpace: 'pre-line' }}
            dangerouslySetInnerHTML={{ __html: showFullDesc || !isLong ? description : shortDesc }}
          />
          {isLong && (
            <button className="btn-read-more" onClick={() => setShowFullDesc(v => !v)}>
              {showFullDesc ? 'Read Less' : 'Read More'}
            </button>
          )}
          {/* Tags moved here */}
          <div className="book-details-tags-container">
            <span className="tags-label">Popular Tags</span>
            <div className="book-details-tags">
              {group.tags && group.tags.length > 0 ? (
                group.tags.map(tag => (
                  <span key={tag.tag_id} className="book-detail-tag">{tag.tag_name}</span>
                ))
              ) : null}
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={onGoBack} className="btn-go-back" type="button">Go Back</button>
          {(digital || print) && (
            <button onClick={() => onReadBook((digital || print).book_id)} className="btn-learn-more">Read Book</button>
          )}
          {/* Download PDF Dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }} ref={pdfBtnRef}>
            <button
              className="btn-learn-more"
              onClick={() => setPdfMenuOpen((open) => !open)}
              type="button"
              style={{ minWidth: 140 }}
            >
              Download PDF ▼
            </button>
            {pdfMenuOpen && (
              <div
                className="download-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  zIndex: 100,
                  minWidth: 210,
                  padding: '0.5em 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
                onClick={e => e.stopPropagation()}
              >
                {digital && (
                  <button
                    className="dropdown-download-btn"
                    onClick={() => { handleDownload(digital.book_id, digital.version_label); setPdfMenuOpen(false); }}
                  >
                    Digital PDF
                  </button>
                )}
                {print && (
                  <button
                    className="dropdown-download-btn"
                    onClick={() => { handleDownload(print.book_id, print.version_label); setPdfMenuOpen(false); }}
                  >
                    Print PDF
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Download Cover Dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }} ref={coverBtnRef}>
            <button
              className="btn-learn-more"
              onClick={() => setCoverMenuOpen((open) => !open)}
              type="button"
              style={{ minWidth: 140 }}
            >
              Download Cover ▼
            </button>
            {coverMenuOpen && (
              <div
                className="download-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  zIndex: 100,
                  minWidth: 210,
                  padding: '0.5em 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
                onClick={e => e.stopPropagation()}
              >
                {digital && (
                  <button
                    className="dropdown-download-btn"
                    onClick={() => { handleDownloadCover(digital.book_id); setCoverMenuOpen(false); }}
                  >
                    Digital Cover
                  </button>
                )}
                {print && (
                  <button
                    className="dropdown-download-btn"
                    onClick={() => { handleDownloadCover(print.book_id); setCoverMenuOpen(false); }}
                  >
                    Print Cover
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Download ZIP (only if available) */}
          {zipLink && (
            <button
              className="btn-learn-more"
              onClick={handleDownloadZip}
              type="button"
              style={{ minWidth: 140 }}
            >
              Download ZIP
            </button>
          )}
        </div>
        <div className="footer-text">© 2025 ByLine Learning Solutions LLP</div>
      </div>
    </div>
  );
}

const Books = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [flipbookBookId, setFlipbookBookId] = useState(null);
  const [filters, setFilters] = useState({
    subject: [],
    grade: [],
    type: [],
    version: [],
    country: [],
    language: [],
    standard: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    subjects: [], grades: [], types: [], versions: [], countries: [], languages: [], standards: []
  });

  useEffect(() => {
    const fetchGroupedBooks = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get("/api/books/grouped", { headers });
        setGroups(data.books || []);
        // Dynamically generate filter options from accessible books (use names)
        const books = data.books || [];
        setFilterOptions({
          grades: [...new Set(books.map(g => g.grade_level)).values()].filter(Boolean),
          languages: [...new Set(books.map(g => g.language_name)).values()].filter(Boolean),
          subjects: [...new Set(books.map(g => g.subject_name)).values()].filter(Boolean),
          types: [...new Set(books.map(g => g.book_type_title)).values()].filter(Boolean),
          versions: [...new Set(books.map(g => g.version_label)).values()].filter(Boolean),
          countries: [...new Set(books.map(g => g.country_name)).values()].filter(Boolean),
          standards: [...new Set(books.map(g => g.standard_name)).values()].filter(Boolean),
        });
      } catch (err) {
        setGroups([]);
      }
    };
    fetchGroupedBooks();
  }, []);

  // Filtering logic (no format, use names)
  const filteredGroups = groups.filter((group) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const searchMatch = !searchTerm ||
      (group.title?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (group.description?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (group.grade_level?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (group.subject_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (group.language_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (group.country_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (group.isbn_code?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (group.standard_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      group.tags?.some(tag => tag.tag_name.toLowerCase().includes(lowerCaseSearchTerm));
    if (!searchMatch) return false;
    const subjectMatch = filters.subject.length === 0 || filters.subject.includes(group.subject_name);
    const gradeMatch = filters.grade.length === 0 || filters.grade.includes(group.grade_level);
    const typeMatch = filters.type.length === 0 || filters.type.includes(group.book_type_title);
    const versionMatch = filters.version.length === 0 || filters.version.includes(group.version_label);
    const countryMatch = filters.country.length === 0 || filters.country.includes(group.country_name);
    const languageMatch = filters.language.length === 0 || filters.language.includes(group.language_name);
    const standardMatch = filters.standard.length === 0 || filters.standard.includes(group.standard_name);
    return subjectMatch && gradeMatch && typeMatch && versionMatch && countryMatch && languageMatch && standardMatch;
  });

  return (
    <div className="app-container issued-books">
      
      {/* Filter and Grid */}
      {!selectedGroup && !flipbookBookId && (
        <div className="issued-books-header-bar" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '2rem' }}>
          
          <aside className="filter-sidebar" style={{ flex: '0 0 270px', minWidth: 220 }}>
            <h3 className="sidebar-heading">Filters</h3>
            <FilterCategory title="Subject" options={filterOptions.subjects} selectedOptions={filters.subject} onChange={(s) => setFilters((f) => ({ ...f, subject: s }))}/>
            <FilterCategory title="Grade" options={filterOptions.grades} selectedOptions={filters.grade} onChange={(s) => setFilters((f) => ({ ...f, grade: s }))}/>
            <FilterCategory title="Book Type" options={filterOptions.types} selectedOptions={filters.type} onChange={(s) => setFilters((f) => ({ ...f, type: s }))}/>
            <FilterCategory title="Version" options={filterOptions.versions} selectedOptions={filters.version} onChange={(s) => setFilters((f) => ({ ...f, version: s }))}/>
            <FilterCategory title="Country" options={filterOptions.countries} selectedOptions={filters.country} onChange={(s) => setFilters((f) => ({ ...f, country: s }))}/>
            <FilterCategory title="Language" options={filterOptions.languages} selectedOptions={filters.language} onChange={(s) => setFilters((f) => ({ ...f, language: s }))}/>
          </aside>
          
          {/* Main content area for search bar and grid */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Search bar container */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', paddingRight: '2.2rem' }}>
              <input
                type="text"
                placeholder="Search by title, description, or tag..."
                className="bookx-search-bar"
                style={{ maxWidth: 400, width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Grid of books */}
            <div className="books-grid issued-books-grid">
              {filteredGroups.length === 0 ? (
                <p className="no-books-message">No books match the selected filters.</p>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group.title + group.isbn_code + group.grade_level + group.version_label}
                    className="book-card-issued issued-books-card"
                    onClick={() => setSelectedGroup(group)}
                    style={{ cursor: "pointer", minHeight: 480, maxHeight: 1000, width: 380, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', borderRadius: 18, boxShadow: '0 2px 12px rgba(30,58,138,0.07)', background: '#fff', margin: '0.5rem', padding: '0.2rem 0.2rem 0.2rem 0.2rem', transition: 'box-shadow 0.2s' }}
                  >
                    <PDFCoverPreview
                      pdfUrl={`/api/books/${(group.digital || group.print).book_id}/stream-cover`}
                      width={400}
                      height={420}
                    />
                    <div className="book-card-issued-content" style={{ width: '100%', marginTop: 18 }}>
                      <h3 className="book-card-issued-title" style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: 6 }}>{group.title}</h3>
                      <div className="book-card-issued-subtitle" style={{ minHeight: 24, maxHeight: 40, overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: group.description ? (group.description.length > 40 ? group.description.substring(0, 40) + '...' : group.description) : '' }}
                      />
                      <div className="book-card-issued-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {group.grade_level && <span className="book-card-issued-tag">Grade: {group.grade_level}</span>}
                        {group.version_label && <span className="book-card-issued-tag">{group.version_label}</span>}
                        {group.isbn_code && <span className="book-card-issued-tag">{group.isbn_code}</span>}
                        {group.book_type_title && <span className="book-card-issued-tag">{group.book_type_title}</span>}
                        {group.country_name && <span className="book-card-issued-tag">{group.country_name}</span>}
                        {group.subject_name && <span className="book-card-issued-tag">{group.subject_name}</span>}
                        {group.language_name && <span className="book-card-issued-tag">{group.language_name}</span>}
                        {group.standard_name && <span className="book-card-issued-tag">{group.standard_name}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      )}
      
      {flipbookBookId ? (
        <FlipbookViewer
          bookId={flipbookBookId}
          onClose={() => setFlipbookBookId(null)}
        />
      ) : selectedGroup ? (
        <BookDetail
          group={selectedGroup}
          onGoBack={() => setSelectedGroup(null)}
          onReadBook={setFlipbookBookId}
        />
      ) : null}
    </div>
  );
};

export default Books;