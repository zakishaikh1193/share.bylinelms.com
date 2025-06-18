import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/explorePageCss/bookDisplay.css';
 import PDFCoverPreview from '../../components/PDFCoverPreview';
const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=60';
 
const Books = () => {
  const [books, setBooks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [standards, setStandards] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const initialFilters = { subject: [], grade: [], bookType: [], version: [], language: [], country: [], standards: [], isbn: [] };
  const [filters, setFilters] = useState(initialFilters);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const navigate = useNavigate();
 
  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };
 
  const toggleFilter = (category, value) => {
    setFilters((prev) => {
      const current = prev[category].map(String);
      const stringValue = String(value);
      const updated = current.includes(stringValue) ? current.filter((v) => v !== stringValue) : [...current, stringValue];
      return { ...prev, [category]: updated };
    });
  };
 
  // --- NEW: Function to clear all filters ---
  const handleClearFilters = () => {
    setFilters(initialFilters);
  };
 
  const getName = (list, id, key) => list.find((item) => String(item[key]) === String(id))?.[`${key.replace('_id', '')}_name`] || '—';
  const getGradeName = (id) => grades.find((g) => String(g.grade_id) === String(id))?.grade_level || '—';
 
  const unique = (key) => {
    return [...new Set(books.map((b) => {
      switch (key) {
        case 'bookType': return b.book_type_title;
        case 'version': return b.version_label;
        case 'country': return b.country_name;
        case 'isbn': return b.isbn_number;
        default: return b[key];
      }
    }).filter((v) => v).map((v) => v.toString().trim()))];
  };
 
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };
 
  useEffect(() => {
    // ... Fetching logic remains the same ...
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [booksRes, gradesRes, subjectsRes, languagesRes, standardsRes] = await Promise.all([
          axios.get('/api/books', { headers }),
          axios.get('/api/grades', { headers }),
          axios.get('/api/subjects', { headers }),
          axios.get('/api/languages', { headers }),
          axios.get('/api/standards', { headers }),
        ]);
        console.log('Raw book data:', booksRes.data.books[0]); // Log first book's data
        const booksWithExtras = booksRes.data.books.map((book) => {
          const isbn = book.isbn_code || (book.versions?.[0]?.isbn_code ?? 'N/A');
          console.log(`Book ${book.title} ISBN:`, isbn);
          return {
            ...book,
            version_label: book.version_label || (book.versions?.[0]?.version_label ?? 'N/A'),
            isbn_number: isbn,
            file_size: book.file_size || book.versions?.[0]?.file_size || null,
          };
        });
        setBooks(booksWithExtras);
        setFilteredBooks(booksWithExtras);
        setGrades(gradesRes.data);
        setSubjects(subjectsRes.data);
        setLanguages(languagesRes.data);
        setStandards(standardsRes.data);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);
 
  useEffect(() => {
    const filtered = books.filter((book) => {
      const match = (list, val) => list.length === 0 || list.includes(String(val));
      return match(filters.grade, book.grade_id) && match(filters.subject, book.subject_id) &&
             match(filters.bookType, book.book_type_title) && match(filters.version, book.version_label) &&
             match(filters.country, book.country_name) && match(filters.language, book.language_id) &&
             match(filters.standards, book.standard_id) && match(filters.isbn, book.isbn_number);
    });
    setFilteredBooks(filtered);
  }, [filters, books]);
 
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('bookx-details-overlay')) {
      setSelectedBook(null);
    }
  };
 
  return (
    <div className="bookx-container">
      <div className="bookx-sidebar">
        <div className="sidebar-header">
          <h3 className="bookx-sidebar-title">Filters</h3>
          <button className="clear-filters-btn" onClick={handleClearFilters}>Clear All</button>
        </div>
        {['subject', 'grade', 'bookType', 'version', 'language', 'country'].map((cat) => (
          <div key={cat} className="bookx-filter-group">
            <div className={`bookx-filter-header ${activeDropdown === cat ? 'open' : ''}`} onClick={() => toggleDropdown(cat)}>
              <div className="filter-header-title">
                <strong>{cat.charAt(0).toUpperCase() + cat.slice(1)}</strong>
                {/* --- NEW: Active filter count --- */}
                {filters[cat].length > 0 && <span className="filter-count">{filters[cat].length}</span>}
              </div>
              <span className={`chevron ${activeDropdown === cat ? 'open' : ''}`}>▼</span>
            </div>
            <ul className={`bookx-options-list ${activeDropdown === cat ? 'open' : ''}`}>
              {(cat === 'subject' ? subjects : cat === 'grade' ? grades : cat === 'language' ? languages : unique(cat))
                .map((option) => {
                  let value, label;
                  if (typeof option === 'object') {
                    if (cat === 'grade') { value = String(option.grade_id); label = option.grade_level; }
                    else if (cat === 'subject') { value = String(option.subject_id); label = option.subject_name; }
                    else if (cat === 'language') { value = String(option.language_id); label = option.language_name; }
                  } else { value = String(option); label = option; }
                  return (
                    <li key={value}>
                      <label>
                        <input type="checkbox" onChange={() => toggleFilter(cat, value)} checked={filters[cat].includes(value)} />
                        <span className="custom-checkbox"></span>
                        <span className="checkbox-label">{label}</span>
                      </label>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
 
      <div className="bookx-content">
        <h2 className="bookx-content-heading">Books Available</h2>
        <div className="bookx-grid">
          {filteredBooks.length === 0 ? (<p className="bookx-no-books">No books match selected filters.</p>) : (
            filteredBooks.map((book) => (
              <div key={book.book_id} className="bookx-card" onClick={() => setSelectedBook(book)}>
                <div>
                  <PDFCoverPreview pdfUrl={`/api/books/${book.book_id}/stream-cover`} width={400} height={460} className="bookx-card-image" />
                  <button className="bookx-card-hover-button" onClick={(e) => { e.stopPropagation(); setSelectedBook(book); }}>
                    View Details
                  </button>
                </div>
                <div className="bookx-card-info">
                  <h4 className="bookx-card-title">{book.title}</h4>
                  <p className="bookx-card-description">{book.description ? book.description.substring(0, 80) + (book.description.length > 80 ? '...' : '') : 'Click to learn more about this book.'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
     
      {selectedBook && (
        <div className="bookx-details-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
          <div className="bookx-details-container">
            <button className="bookx-close-button" onClick={() => setSelectedBook(null)} aria-label="Close details">×</button>
           
            <div className="bookx-details-image-wrapper">
              <PDFCoverPreview pdfUrl={`/api/books/${selectedBook.book_id}/stream-cover`} width={300} height={360} />
              <p className="bookx-file-size">
                File Size: {formatFileSize(selectedBook.file_size)}
              </p>
            </div>
 
            <div className="bookx-details-content">
              <h2 className="bookx-details-title">{selectedBook.title}</h2>
              <p className="bookx-details-description">{selectedBook.description || 'No description available.'}</p>
             
              <div className="bookx-details-meta-grid">
                <div><strong>Subject</strong><span>{getName(subjects, selectedBook.subject_id, 'subject_id')}</span></div>
                <div><strong>Grade</strong><span>{getGradeName(selectedBook.grade_id)}</span></div>
                <div><strong>Language</strong><span>{getName(languages, selectedBook.language_id, 'language_id')}</span></div>
                <div><strong>Type</strong><span>{selectedBook.book_type_title || 'N/A'}</span></div>
                <div><strong>Country</strong><span>{selectedBook.country_name || 'N/A'}</span></div>
                <div><strong>ISBN</strong><span>{selectedBook.isbn_number || 'N/A'}</span></div>
              </div>
 
              <div className="bookx-details-buttons">
                <button className="btn btn-secondary" onClick={() => setSelectedBook(null)}>Back</button>
                {/* --- RESTORED: 'View Cover' button --- */}
                <button className="btn btn-secondary">View Cover</button>
                <button className="btn btn-primary" onClick={() => { navigate(`/books/${selectedBook.book_id}/flipbook`); }}>
                  View Book
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Books;