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
        <p className="book-card-issued-subtitle">{group.description?.substring(0, 40) + '...'}</p>
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
          {digital && (
            <button onClick={() => onReadBook(digital.book_id)} className="book-card-issued-button">Read Book</button>
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
        <div className="book-content-layout">
          <div className="book-text-content">
            <h1 className="book-title">{group.title}</h1>
            <p className="book-description-long">{group.description}</p>
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
          <div className="book-image-container">
            <PDFCoverPreview
              pdfUrl={`/api/books/${main.book_id}/stream-cover`}
              width={300}
              height={360}
            />
          </div>
        </div>
        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={onGoBack} className="btn-go-back" type="button">Go Back</button>
          {digital && (
            <button onClick={() => onReadBook(digital.book_id)} className="btn-learn-more">Read Book</button>
          )}
          {digital && (
            <button onClick={() => handleDownload(digital.book_id, digital.version_label)} className="btn-learn-more">Download Digital PDF</button>
          )}
          {digital && (
            <button onClick={() => handleDownloadCover(digital.book_id)} className="btn-learn-more">Download Digital Cover</button>
          )}
          {print && (
            <button onClick={() => handleDownload(print.book_id, print.version_label)} className="btn-learn-more">Download Print PDF</button>
          )}
          {print && (
            <button onClick={() => handleDownloadCover(print.book_id)} className="btn-learn-more">Download Print Cover</button>
          )}
          {zipLink ? (
            <button onClick={handleDownloadZip} className="btn-learn-more">Download ZIP</button>
          ) : (
            <button className="btn-learn-more disabled">ZIP Not Available</button>
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
                    style={{ cursor: "pointer", minHeight: 480, maxHeight: 1000, width: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', borderRadius: 18, boxShadow: '0 2px 12px rgba(30,58,138,0.07)', background: '#fff', margin: '0.5rem', padding: '1.2rem 1.2rem 1.2rem 1.2rem', transition: 'box-shadow 0.2s', height: '100%' }}
                  >
                    <PDFCoverPreview
                      pdfUrl={`/api/books/${(group.digital || group.print).book_id}/stream-cover`}
                      width={320}
                      height={420}
                    />
                    <div className="book-card-issued-content" style={{ width: '100%', marginTop: 18 }}>
                      <h3 className="book-card-issued-title" style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: 6 }}>{group.title}</h3>
                      <p className="book-card-issued-subtitle" style={{ fontSize: '0.98rem', color: '#64748b', marginBottom: 10 }}>{group.description?.substring(0, 40) + '...'}</p>
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