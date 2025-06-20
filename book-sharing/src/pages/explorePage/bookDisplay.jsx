import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/explorePageCss/bookDisplay.css';
import PDFCoverPreview from '../../components/PDFCoverPreview';
// Import the FlipbookViewer to use it as a modal
import FlipbookViewer from '../Dashboards/Users/FlipbookViewer';

const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=60';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [standards, setStandards] = useState([]);
  const [formats, setFormats] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const initialFilters = { subject: [], grade: [], bookType: [], version: [], language: [], country: [], standards: [], isbn: [], format: [] };
  const [filters, setFilters] = useState(initialFilters);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- NEW: State to manage the Flipbook modal ---
  const [flipbookBookId, setFlipbookBookId] = useState(null);
  
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
        case 'isbn': return b.isbn_code; // Changed from isbn_number
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
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // --- IMPROVED: Fetching and processing data like in issuedBook.jsx ---
        const [booksRes, gradesRes, subjectsRes, languagesRes, standardsRes, bookTypesRes, formatsRes] = await Promise.all([
          axios.get('/api/books', { headers }),
          axios.get('/api/grades', { headers }),
          axios.get('/api/subjects', { headers }),
          axios.get('/api/languages', { headers }),
          axios.get('/api/standards', { headers }),
          axios.get('/api/booktypes', { headers }),
          axios.get('/api/book-formats', { headers }),
        ]);

        const gradeMap = new Map(gradesRes.data.map((g) => [g.grade_id, g.grade_level]));
        const subjectMap = new Map(subjectsRes.data.map((s) => [s.subject_id, s.subject_name]));
        const languageMap = new Map(languagesRes.data.map((l) => [l.language_id, l.language_name]));
        const bookTypeMap = new Map(bookTypesRes.data.map((bt) => [bt.book_type_id, bt.book_type_title]));
        const formatMap = new Map(formatsRes.data.map((f) => [f.format_id, f.format_name]));

        const booksWithExtras = booksRes.data.books.map((book) => ({
          ...book,
          grade_name: gradeMap.get(book.grade_id) || 'N/A',
          subject_name: subjectMap.get(book.subject_id) || 'N/A',
          language_name: languageMap.get(book.language_id) || 'N/A',
          book_type_title: bookTypeMap.get(book.booktype_id) || 'N/A',
          format_name: formatMap.get(book.format_id) || 'N/A',
          version_label: book.version_label || 'N/A',
          isbn_code: book.isbn_code || 'N/A',
          file_size: book.file_size || book.versions?.[0]?.file_size || null,
        }));

        setBooks(booksWithExtras);
        setFilteredBooks(booksWithExtras);
        setGrades(gradesRes.data);
        setSubjects(subjectsRes.data);
        setLanguages(languagesRes.data);
        setStandards(standardsRes.data);
        setFormats(formatsRes.data);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = books.filter((book) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const searchMatch = !searchTerm || 
        (book.title?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.description?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.grade_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.subject_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.language_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.format_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.country_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.isbn_code?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        book.tags?.some(tag => tag.tag_name.toLowerCase().includes(lowerCaseSearchTerm));
      
      if (!searchMatch) return false;

      const match = (list, val) => list.length === 0 || list.includes(String(val));
      return match(filters.grade, book.grade_id) && match(filters.subject, book.subject_id) &&
             match(filters.bookType, book.book_type_title) && match(filters.version, book.version_label) &&
             match(filters.country, book.country_name) && match(filters.language, book.language_id) &&
             match(filters.standards, book.standard_id) && match(filters.isbn, book.isbn_code) &&
             match(filters.format, book.format_id);
    });
    setFilteredBooks(filtered);
  }, [filters, books, searchTerm]);

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
        {['subject', 'grade', 'bookType', 'version', 'language', 'country', 'format'].map((cat) => (
          <div key={cat} className="bookx-filter-group">
            <div className={`bookx-filter-header ${activeDropdown === cat ? 'open' : ''}`} onClick={() => toggleDropdown(cat)}>
              <div className="filter-header-title">
                <strong>{cat.charAt(0).toUpperCase() + cat.slice(1)}</strong>
                {filters[cat].length > 0 && <span className="filter-count">{filters[cat].length}</span>}
              </div>
              <span className={`chevron ${activeDropdown === cat ? 'open' : ''}`}>▼</span>
            </div>
            <ul className={`bookx-options-list ${activeDropdown === cat ? 'open' : ''}`}>
              {(cat === 'subject' ? subjects : cat === 'grade' ? grades : cat === 'language' ? languages : cat === 'format' ? formats : unique(cat))
                .map((option) => {
                  let value, label;
                  if (typeof option === 'object') {
                    if (cat === 'grade') { value = String(option.grade_id); label = option.grade_level; }
                    else if (cat === 'subject') { value = String(option.subject_id); label = option.subject_name; }
                    else if (cat === 'language') { value = String(option.language_id); label = option.language_name; }
                    else if (cat === 'format') { value = String(option.format_id); label = option.format_name; }
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
        <div className="bookx-content-header">
          <h2 className="bookx-content-heading">Books Available</h2>
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
        <div className="bookx-grid">
          {filteredBooks.length === 0 ? (<p className="bookx-no-books">No books match selected filters.</p>) : (
            filteredBooks.map((book) => (
              <div key={book.book_id} className="bookx-card" onClick={() => setSelectedBook(book)}>
                <div className="bookx-card-image-container">
                  <PDFCoverPreview 
                    pdfUrl={`/api/books/${book.book_id}/stream-cover`} 
                    width={400} 
                    height={460} 
                    className="bookx-card-image"
                  />
                  <div className="bookx-card-hover-overlay">
                    <button 
                      className="bookx-card-hover-button" 
                      onClick={(e) => { e.stopPropagation(); setSelectedBook(book); }}>
                      View Details
                    </button>
                  </div>
                </div>

                <div className="bookx-card-info">
                  <h4 className="bookx-card-title">{book.title}</h4>
                  <p className="bookx-card-description">
                    {book.description ? book.description.substring(0, 80) + (book.description.length > 80 ? '...' : '') : 'Click to learn more about this book.'}
                  </p>

                  <div className="bookx-card-tags-container">
                    {book.grade_name && book.grade_name !== 'N/A' && 
                      <span className="bookx-card-tag">{book.grade_name}</span>
                    }
                    {book.subject_name && book.subject_name !== 'N/A' && 
                      <span className="bookx-card-tag">Subject: {book.subject_name}</span>
                    }
                    {book.format_name && book.format_name !== 'N/A' && 
                      <span className="bookx-card-tag">Format: {book.format_name}</span>
                    }
                    {book.language_name && book.language_name !== 'N/A' && 
                      <span className="bookx-card-tag">Language: {book.language_name}</span>
                    }
                    {book.book_type_title && book.book_type_title !== 'N/A' && 
                      <span className="bookx-card-tag">{book.book_type_title}</span>
                    }
                    {book.version_label && book.version_label !== 'N/A' && 
                      <span className="bookx-card-tag">{book.version_label}</span>
                    }
                    {book.country_name && book.country_name !== 'N/A' && 
                      <span className="bookx-card-tag">{book.country_name}</span>
                    }
                     {book.isbn_code && book.isbn_code !== 'N/A' && 
                      <span className="bookx-card-tag">ISBN: {book.isbn_code}</span>
                    }
                    {book.tags?.map(tag => (
                      <span key={tag.tag_id} className="bookx-card-tag tag-specific">{tag.tag_name}</span>
                    ))}
                  </div>
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
            </div>
            <div className="bookx-details-content">
              <h2 className="bookx-details-title">{selectedBook.title}</h2>
              <p className="bookx-details-description">{selectedBook.description || 'No description available.'}</p>
              <div className="bookx-details-meta-grid">
                <div><strong>Subject</strong><span>{getName(subjects, selectedBook.subject_id, 'subject_id')}</span></div>
                <div><strong>Grade</strong><span>{getGradeName(selectedBook.grade_id)}</span></div>
                <div><strong>Language</strong><span>{getName(languages, selectedBook.language_id, 'language_id')}</span></div>
                <div><strong>Type</strong><span>{selectedBook.book_type_title || 'N/A'}</span></div>
                <div><strong>Format</strong><span>{selectedBook.format_name || 'N/A'}</span></div>
                <div><strong>Country</strong><span>{selectedBook.country_name || 'N/A'}</span></div>
                <div><strong>ISBN</strong><span>{selectedBook.isbn_code || 'N/A'}</span></div>
              </div>
              <div className="bookx-details-tags">
                <strong>Tags: </strong>
                {selectedBook.tags?.length > 0 ? selectedBook.tags.map(tag => (
                  <span key={tag.tag_id} className="bookx-card-tag tag-specific">{tag.tag_name}</span>
                )) : 'None'}
              </div>
              <div className="bookx-details-buttons">
                <button className="btn btn-secondary" onClick={() => setSelectedBook(null)}>Back</button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.open(`/api/books/${selectedBook.book_id}/stream-cover`, '_blank')}
                >
                  View Cover
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setFlipbookBookId(selectedBook.book_id);
                    setSelectedBook(null);
                  }}
                >
                  View Book
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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