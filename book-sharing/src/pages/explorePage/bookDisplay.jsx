import React, { useState, useEffect } from 'react';
import axios from '../../axiosConfig';
import '../../styles/explorePageCss/bookDisplay.css';
import PDFCoverPreview from '../../components/PDFCoverPreview';
import FlipbookViewer from '../Dashboards/Users/FlipbookViewer';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [standards, setStandards] = useState([]);
  const [formats, setFormats] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const initialFilters = { subject: [], grade: [], bookType: [], version: [], language: [], country: [], standards: [], isbn: [] };
  const [filters, setFilters] = useState(initialFilters);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [flipbookBookId, setFlipbookBookId] = useState(null);

  // State for the modal's description expand/collapse feature
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // --- Filter Sidebar State ---
  // Each filter category can be open/collapsed independently. All collapsed by default.
  const filterCategories = ['subject', 'grade', 'bookType', 'version', 'language', 'country'];
  const [showFilters, setShowFilters] = useState(() =>
    filterCategories.reduce((acc, cat) => { acc[cat] = false; return acc; }, {})
  );

  const toggleFilterVisibility = (cat) => {
    setShowFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

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
        case 'isbn': return b.isbn_code;
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

  // --- Helper: Group books by logical book (digital/print) ---
  function groupBooksByLogicalBook(books) {
    const grouped = {};
    for (const book of books) {
      const key = [book.title, book.isbn_code, book.grade_id, book.version_label].join('|');
      if (!grouped[key]) {
        grouped[key] = {
          title: book.title,
          isbn_code: book.isbn_code,
          grade_id: book.grade_id,
          grade_name: book.grade_name,
          version_label: book.version_label,
          digital: null,
          print: null,
          // ...other shared fields
          description: book.description,
          subject_id: book.subject_id,
          subject_name: book.subject_name,
          language_id: book.language_id,
          language_name: book.language_name,
          book_type_title: book.book_type_title,
          country_name: book.country_name,
          tags: book.tags,
        };
      }
      const formatName = (book.format_name || '').toLowerCase();
      if (formatName.includes('digital')) grouped[key].digital = book;
      if (formatName.includes('print')) grouped[key].print = book;
    }
    return Object.values(grouped);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [booksRes, gradesRes, subjectsRes, languagesRes, standardsRes, bookTypesRes] = await Promise.all([
          axios.get('/api/books', { headers }),
          axios.get('/api/grades', { headers }),
          axios.get('/api/subjects', { headers }),
          axios.get('/api/languages', { headers }),
          axios.get('/api/standards', { headers }),
          axios.get('/api/booktypes', { headers }),
        ]);

        const gradeMap = new Map(gradesRes.data.map((g) => [g.grade_id, g.grade_level]));
        const subjectMap = new Map(subjectsRes.data.map((s) => [s.subject_id, s.subject_name]));
        const languageMap = new Map(languagesRes.data.map((l) => [l.language_id, l.language_name]));
        const bookTypeMap = new Map(bookTypesRes.data.map((bt) => [bt.book_type_id, bt.book_type_title]));

        const booksWithExtras = booksRes.data.books.map((book) => ({
          ...book,
          grade_name: gradeMap.get(book.grade_id) || 'N/A',
          subject_name: subjectMap.get(book.subject_id) || 'N/A',
          language_name: languageMap.get(book.language_id) || 'N/A',
          book_type_title: bookTypeMap.get(book.booktype_id) || 'N/A',
          version_label: book.version_label || 'N/A',
          isbn_code: book.isbn_code || 'N/A',
          file_size: book.file_size || book.versions?.[0]?.file_size || null,
        }));

        const groupedBooks = groupBooksByLogicalBook(booksWithExtras);
        setBooks(groupedBooks);
        setFilteredBooks(groupedBooks);
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
    const filtered = books.filter((group) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const searchMatch = !searchTerm || 
        (group.title?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (group.description?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (group.grade_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (group.subject_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (group.language_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (group.country_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (group.isbn_code?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        group.tags?.some(tag => tag.tag_name.toLowerCase().includes(lowerCaseSearchTerm));
      
      if (!searchMatch) return false;

      const match = (list, val) => list.length === 0 || list.includes(String(val));
      return match(filters.grade, group.grade_id) && match(filters.subject, group.subject_id) &&
             match(filters.bookType, group.book_type_title) && match(filters.version, group.version_label) &&
             match(filters.country, group.country_name) && match(filters.language, group.language_id) &&
             match(filters.standards, group.standard_id) && match(filters.isbn, group.isbn_code)
    });
    setFilteredBooks(filtered);
  }, [filters, books, searchTerm]);

  // New handler to open the modal and reset the description state
  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setIsDescriptionExpanded(false); // Always collapse description when a new book is selected
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('bookx-details-overlay')) {
      setSelectedBook(null);
    }
  };

  // Logic for "Read More" button, calculated only when a book is selected
  let truncatedDescription = '';
  let isLongDescription = false;
  if (selectedBook) {
      const wordLimit = 100; // Adjust the word limit as needed
      const fullDescription = selectedBook.description || 'No description available.';
      const words = fullDescription.split(/\s+/);
      isLongDescription = words.length > wordLimit;

      if (isLongDescription && !isDescriptionExpanded) {
          truncatedDescription = `${words.slice(0, wordLimit).join(" ")}...`;
      } else {
          truncatedDescription = fullDescription;
      }
  }

  return (
    <div className="bookx-container">
      <div className="bookx-sidebar">
        <div className="sidebar-header">
          <h3 className="bookx-sidebar-title">Filters</h3>
          <button className="clear-filters-btn" onClick={handleClearFilters}>Clear All</button>
        </div>
        {filterCategories.map((cat) => (
          <div key={cat} className="bookx-filter-group">
            <div className={`bookx-filter-header ${showFilters[cat] ? 'open' : ''}`} onClick={() => toggleFilterVisibility(cat)}>
              <div className="filter-header-title">
                <strong>{cat.charAt(0).toUpperCase() + cat.slice(1)}</strong>
                {filters[cat].length > 0 && <span className="filter-count">{filters[cat].length}</span>}
              </div>
              <span className={`chevron ${showFilters[cat] ? 'open' : ''}`}>▼</span>
            </div>
            <ul className={`bookx-options-list ${showFilters[cat] ? 'open' : ''}`}>
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
        <div className="bookx-content-header">
          <h2 className="bookx-content-heading">Books Available</h2>
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
              <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path>
            </svg>
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
            filteredBooks.map((group) => {
              const main = group.digital || group.print;
              return (
                <div key={group.title + group.isbn_code + group.grade_id + group.version_label} className="bookx-card" onClick={() => handleSelectBook(main)}>
                  <div className="bookx-card-image-container">
                    <PDFCoverPreview 
                      pdfUrl={`/api/books/${main.book_id}/stream-cover`} 
                      width={400} 
                      height={460} 
                      className="bookx-card-image"
                    />
                    <div className="bookx-card-hover-overlay">
                      <button 
                        className="bookx-card-hover-button" 
                        onClick={(e) => { e.stopPropagation(); handleSelectBook(main); }}>
                        View Details
                      </button>
                    </div>
                  </div>
                  <div className="bookx-card-info">
                    <h4 className="bookx-card-title">{group.title}</h4>
                    <div className="bookx-card-description" style={{ minHeight: 40, maxHeight: 60, overflow: 'hidden' }}
                      dangerouslySetInnerHTML={{ __html: group.description ? (group.description.length > 80 ? group.description.substring(0, 80) + '...' : group.description) : 'Click to learn more about this book.' }}
                    />
                    <div className="bookx-card-tags-container">
                      {group.grade_name && group.grade_name !== 'N/A' && <span className="bookx-card-tag">{group.grade_name}</span>}
                      {group.subject_name && group.subject_name !== 'N/A' && <span className="bookx-card-tag">Subject: {group.subject_name}</span>}
                      {group.language_name && group.language_name !== 'N/A' && <span className="bookx-card-tag">Language: {group.language_name}</span>}
                      {group.book_type_title && group.book_type_title !== 'N/A' && <span className="bookx-card-tag">{group.book_type_title}</span>}
                      {group.version_label && group.version_label !== 'N/A' && <span className="bookx-card-tag">{group.version_label}</span>}
                      {group.country_name && group.country_name !== 'N/A' && <span className="bookx-card-tag">{group.country_name}</span>}
                      {group.isbn_code && group.isbn_code !== 'N/A' && <span className="bookx-card-tag">ISBN: {group.isbn_code}</span>}
                      {group.tags?.map(tag => (
                        <span key={tag.tag_id} className="bookx-card-tag tag-specific">{tag.tag_name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
     
      {selectedBook && (
        <div className="bookx-details-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
          <div className="bookx-details-container">
            <button className="bookx-close-button" onClick={() => setSelectedBook(null)} aria-label="Close details">×</button>
            
  {/* START: This is the new structure */}
<div className="bookx-details-content">
    <div className="bookx-table-cover-row">
    {/* Left Column: Table */}
    <div className="bookx-details-table-container">
      <h3 className="section-heading">Book Specifications</h3>
      <table className="bookx-details-table">
        <tbody>
          <tr>
            <td><strong>Subject</strong></td>
            <td>{getName(subjects, selectedBook.subject_id, 'subject_id')}</td>
          </tr>
          <tr>
            <td><strong>Grade</strong></td>
            <td>{getGradeName(selectedBook.grade_id)}</td>
          </tr>
          <tr>
            <td><strong>Language</strong></td>
            <td>{getName(languages, selectedBook.language_id, 'language_id')}</td>
          </tr>
          <tr>
            <td><strong>Type</strong></td>
            <td>{selectedBook.book_type_title || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Country</strong></td>
            <td>{selectedBook.country_name || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>ISBN</strong></td>
            <td>{selectedBook.isbn_code || 'N/A'}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    {/* Right Column: Cover Image */}
    <div className="bookx-details-image-wrapper">
        <PDFCoverPreview pdfUrl={`/api/books/${selectedBook.book_id}/stream-cover`} width={250} height={300} />
    </div>
  </div>
  <h2 className="bookx-details-title">{selectedBook.title}</h2>
  <div className="bookx-details-description" style={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: truncatedDescription }} />
  {isLongDescription && (
    <button
      className="btn-read-more"
      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
    >
      {isDescriptionExpanded ? "Read Less" : "Read More"}
    </button>
  )}

  {/* New container for the side-by-side layout */}


  <div className="bookx-details-tags">
    <strong>Tags: </strong>
    {selectedBook.tags?.length > 0 ? selectedBook.tags.map(tag => (
      <span key={tag.tag_id} className="bookx-card-tag tag-specific">{tag.tag_name}</span>
    )) : 'None'}
  </div>

  <div className="bookx-details-buttons">
    <button className="btn btn-secondary" onClick={() => setSelectedBook(null)}>Back</button>
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
{/* END: This is the new structure */}
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