import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import UserSelect from "./components/UserSelect";
import '../../styles/manage-user-css/ManageAccess.css';
import PDFCoverPreview from "../../components/PDFCoverPreview";

// --- Success Popup Component ---
const SuccessPopup = ({ message, onClose }) => (
  <div className="success-popup-overlay">
    <div className="success-popup">
      <div className="popup-icon">✓</div>
      <div className="popup-message">{message}</div>
      <button className="popup-close" onClick={onClose}>×</button>
    </div>
  </div>
);

// --- Assigned Books Table ---
const AssignedBooksTable = ({ assignedBooks, edits, onEditChange, onSaveAll }) => {
  const [editStates, setEditStates] = useState({});

  useEffect(() => {
    const initial = {};
    assignedBooks.forEach(book => {
      initial[book.book_id] = {
        permission: "viewer",
        can_download: !!book.can_download,
        expiry: book.expiry?.split("T")[0] || ""
      };
    });
    setEditStates(initial);
  }, [assignedBooks]);

  return (
    <div className="assigned-books-section">
      <div className="assigned-books-header">
        <h2>Assigned Books</h2>
        
        <button className="btn-save-all" onClick={onSaveAll}>
          Save All Changes
        </button>
      </div>
      <table className="assigned-books-table">
        <thead>
          <tr>
            <th>Book Title</th>
            <th>Version</th>
            <th>ISBN</th>
            <th>Download</th>
            <th>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {assignedBooks.map(book => {
            // Get the edit state for this specific book from props
            const edit = edits[book.book_id] || {};

            return (
              <tr key={book.book_id}>
                <td>{book.title}</td>
                <td>{book.version_label}</td>
                <td>{book.isbn_code}</td>
                <td className="center-text">
                  <input
                    type="checkbox"
                    checked={!!edit.can_download} // Ensure it's a boolean
                    onChange={e => {
                      const newEdits = { ...edits };
                      newEdits[book.book_id] = { ...edit, can_download: e.target.checked };
                      onEditChange(newEdits);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={edit.expiry || ''} // Handle potential null value
                    onChange={e => {
                      const newEdits = { ...edits };
                      newEdits[book.book_id] = { ...edit, expiry: e.target.value };
                      onEditChange(newEdits);
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// --- Unassigned Book Cards with Filter Sidebar ---
const UnassignedBooksList = ({
  unassignedBooks,
  onAssign,
  filters,
  setFilters,
  metadata,
  searchTerm,
  setSearchTerm
}) => {
  const {
    grades,
    subjects,
    languages,
    standards,
    bookTypes,
    versions,
    countries
  } = metadata;

  // Toggle filter selection helper
  const toggleSelection = (key, id) => {
    setFilters(prev => {
      const newSet = new Set(prev[key]);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return { ...prev, [key]: newSet };
    });
  };

  // Show/hide filter sections state
  const [showFilters, setShowFilters] = useState({
    grades: true,
    subjects: true,
    languages: true,
    standards: true,
    bookTypes: true,
    versions: true,
    countries: true
  });

const lowerCaseSearchTerm = (searchTerm || '').toLowerCase();

  const filteredBooks = unassignedBooks
    .filter(book => {
      const matchGrade = filters.grades.size === 0 || filters.grades.has(book.grade_id);
      const matchSubject = filters.subjects.size === 0 || filters.subjects.has(book.subject_id);
      const matchLanguage = filters.languages.size === 0 || filters.languages.has(book.language_id);
      const matchStandard = filters.standards.size === 0 || filters.standards.has(book.standard_id);
      const matchBookType = filters.bookTypes.size === 0 || (book.booktype_id && filters.bookTypes.has(book.booktype_id));
      const matchVersion = filters.versions.size === 0 || (book.version_id && filters.versions.has(book.version_id));
      const matchCountry = filters.countries.size === 0 || (book.country_id && filters.countries.has(book.country_id));
      return (
        matchGrade &&
        matchSubject &&
        matchLanguage &&
        matchStandard &&
        matchBookType &&
        matchVersion &&
        matchCountry
      );
    })
    .filter(book => {
      if (!lowerCaseSearchTerm) return true; // Show all if search is empty
      // Check if search term exists in any of the book's properties
      return (
        (book.title?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.grade_level?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.language_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.subject_name?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.version_label?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
        (book.book_type_title || '').toLowerCase().includes(lowerCaseSearchTerm) ||
        (book.country_name || '').toLowerCase().includes(lowerCaseSearchTerm) ||
        (book.isbn_code || '').toLowerCase().includes(lowerCaseSearchTerm)
      );
    });

  const toggleFilterVisibility = (key) => {
    setShowFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState([]);

  const toggle = id => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const assign = () => {
    selected.forEach(id => onAssign(id));
    setSelected([]);
  };

  return (
    <div className="unassigned-books-with-filters">
      <aside className="custom-filter-sidebar">
        <h3>Filters</h3>
        {[
          { key: "subjects", label: "Subjects", items: subjects, idKey: "subject_id", nameKey: "subject_name" },
          { key: "grades", label: "Grades", items: grades, idKey: "grade_id", nameKey: "grade_level" },
          { key: "bookTypes", label: "Book Types", items: bookTypes, idKey: "book_type_id", nameKey: "book_type_title" },
          { key: "languages", label: "Languages", items: languages, idKey: "language_id", nameKey: "language_name" },
          { key: "standards", label: "Standards", items: standards, idKey: "standard_id", nameKey: "standard_name" },
          { key: "countries", label: "Countries", items: countries, idKey: "country_id", nameKey: "country_name" }
        ].map(({ key, label, items, idKey, nameKey }) => (
          <div key={key} className="filter-box" aria-expanded={showFilters[key]}>
            <div className="filter-title" onClick={() => toggleFilterVisibility(key)}>
              {label}
              <span className={`arrow ${showFilters[key] ? "open" : ""}`}>▼</span>
            </div>
            {showFilters[key] && (
              <div className="filter-options">
                {items.map(item => (
                  <label
                    key={item[idKey]}
                    className={filters[key].has(item[idKey]) ? "selected" : ""}
                  >
                    <input
                      type="checkbox"
                      checked={filters[key].has(item[idKey])}
                      onChange={() => toggleSelection(key, item[idKey])}
                    />
                    {item[nameKey]}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>

      <div className="unassigned-books-container">
        <div className="unassigned-books-header">
          <h2>Assign New Books</h2>
           <input
            type="search"
            placeholder="Search by title, grade, isbn, version, subject, language, book type, country..."
            className="book-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-assign" onClick={assign} disabled={!selected.length}>
            Assign Selected
          </button>
        </div>

        {!filteredBooks.length ? (
          <p>No unassigned books available for selected filters.</p>
        ) : (
          <div className="book-cards-container">
            {filteredBooks.map(book => {
              const {
                title,
                grade_level,
                version_label,
                language_name,
                subject_name,
                book_type_title,
                country_name,
                isbn_code
              } = book;

              return (
                <div
                  key={book.book_id}
                  className={`book-card ${selected.includes(book.book_id) ? "selected" : ""}`}
                  onClick={() => toggle(book.book_id)}
                >
                  <PDFCoverPreview
                pdfUrl={`/api/books/${book.book_id}/stream-cover`}
                width={250}
                height={260}
              />
                  <div className="book-card-header">
                    <h3>{title}</h3>
                    <button
                      className={`select-btn ${selected.includes(book.book_id) ? "selected" : ""}`}
                      onClick={e => {
                        e.stopPropagation();
                        toggle(book.book_id);
                      }}
                    >
                      {selected.includes(book.book_id) ? "✓" : "+"}
                    </button>
                  </div>
                  <div className="book-card-body">
                    <div className="book-meta"><span>Grade:</span> {grade_level || "N/A"}</div>
                    <div className="book-meta"><span>Version:</span> {version_label || "N/A"}</div>
                    <div className="book-meta"><span>Language:</span> {language_name || "N/A"}</div>
                    <div className="book-meta"><span>Subject:</span> {subject_name || "N/A"}</div>
                    <div className="book-meta"><span>Book Type:</span> {book_type_title || "N/A"}</div>
                    <div className="book-meta"><span>Country:</span> {country_name || "N/A"}</div>
                    <div className="book-meta"><span>ISBN:</span> {isbn_code || "N/A"}</div>
                  </div>
                </div>
              );
            })}
          </div>

        )}
      </div>
    </div>
  );
};

// --- Main Component ---
const ManageAccess = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignedBooks, setAssignedBooks] = useState([]);
  const [unassignedBooks, setUnassignedBooks] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [assignedBookEdits, setAssignedBookEdits] = useState({});

  // Filters state: sets of selected ids for each filter
  const [filters, setFilters] = useState({
    grades: new Set(),
    subjects: new Set(),
    languages: new Set(),
    standards: new Set(),
    bookTypes: new Set(),
    versions: new Set(),
    countries: new Set()
  });

  // Metadata for filters
  const [metadata, setMetadata] = useState({
    grades: [],
    subjects: [],
    languages: [],
    standards: [],
    bookTypes: [],
    versions: [],
    countries: []
  });

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: token ? `Bearer ${token}` : "" } };

  useEffect(() => {
    if (!token) return;
    axios.get("/api/user", authHeaders)
      .then(res => {
        const filtered = res.data.users?.filter(u => u.role !== "admin") || [];
        setUsers(filtered);
      })
      .catch(err => console.error("Error loading users:", err));
  }, [token]);

  useEffect(() => {
    if (!selectedUserId) {
      setAssignedBooks([]);
      setUnassignedBooks([]);
      setAssignedBookEdits({}); 
      return;
    }
    axios.get(`/api/books/user-access/${selectedUserId}`, authHeaders)
      .then(res => {
        const assigned = res.data.assignedBooks || [];
        setAssignedBooks(res.data.assignedBooks || []);
        setUnassignedBooks(res.data.unassignedBooks || []);
const initialEdits = {};
        assigned.forEach(book => {
          initialEdits[book.book_id] = {
            can_download: !!book.can_download,
            expiry: book.expiry?.split("T")[0] || ""
          };
        });
        setAssignedBookEdits(initialEdits);
      })
      .catch(err => console.error("Error loading access data:", err));
  }, [selectedUserId]);

  // Fetch filter metadata once on mount
  useEffect(() => {
    if (!token) return;

    const fetchMetadata = async () => {
      try {
        const [
          gradesRes,
          subjectsRes,
          languagesRes,
          standardsRes,
          bookTypesRes,
          versionsRes,
          countriesRes
        ] = await Promise.all([
          axios.get('/api/grades', authHeaders),
          axios.get('/api/subjects', authHeaders),
          axios.get('/api/languages', authHeaders),
          axios.get('/api/standards', authHeaders),
          axios.get('/api/booktypes', authHeaders),
          axios.get('/api/versions', authHeaders).catch(() => ({ data: [] })),
          axios.get('/api/countries', authHeaders).catch(() => ({ data: [] }))
        ]);

        setMetadata({
          grades: gradesRes.data || [],
          subjects: subjectsRes.data || [],
          languages: languagesRes.data || [],
          standards: standardsRes.data || [],
          bookTypes: bookTypesRes.data || [],
          versions: versionsRes.data || [],
          countries: countriesRes.data || []
        });
      } catch (error) {
        console.error('Error fetching filter metadata:', error);
      }
    };

    fetchMetadata();
  }, [token]);

  // const handleUpdate = (bookId, changes) => {
  //   const payload = {
  //     user_id: parseInt(selectedUserId),
  //     book_id: bookId,
  //     permission: "viewer",
  //     expiry: changes.expiry || null,
  //     can_download: changes.can_download
  //   };

  //   axios.post("/api/books/book-control", payload, authHeaders)
  //     .then(() => {
  //       setAssignedBooks(prev =>
  //         prev.map(b => (b.book_id === bookId ? { ...b, ...payload } : b))
  //       );
  //       setSuccessMessage("Changes saved successfully!");
  //     })
  //     .catch(err => console.error("Error saving changes:", err));
  // };
  const handleBulkUpdate = async () => {
    // Create an array of update promises
    const updatePromises = Object.entries(assignedBookEdits).map(([bookId, changes]) => {
      const payload = {
        user_id: parseInt(selectedUserId),
        book_id: parseInt(bookId),
        permission: "viewer",
        expiry: changes.expiry || null,
        can_download: changes.can_download
      };
      // Return the axios promise
      return axios.post("/api/books/book-control", payload, authHeaders);
    });

    try {
      // Wait for all update requests to complete
      await Promise.all(updatePromises);

      // On success, update the main assignedBooks state to reflect saved changes
      setAssignedBooks(prev => 
        prev.map(book => {
          const edit = assignedBookEdits[book.book_id];
          if (edit) {
            return { ...book, can_download: edit.can_download, expiry: edit.expiry };
          }
          return book;
        })
      );
      
      setSuccessMessage("All changes saved successfully!");

    } catch (err) {
      console.error("Error saving all changes:", err);
      // You might want to show an error popup here as well
    }
  };

  const handleAssign = bookId => {
    const payload = {
      user_id: parseInt(selectedUserId),
      book_id: bookId,
      permission: "viewer",
      expiry: null,
      can_download: false
    };

    axios.post("/api/books/book-control", payload, authHeaders)
      .then(() => {
        const book = unassignedBooks.find(b => b.book_id === bookId);
        if (book) {
          setAssignedBooks(prev => [...prev, { ...book, ...payload }]);
          setUnassignedBooks(prev => prev.filter(b => b.book_id !== bookId));
          setSuccessMessage("Book assigned successfully!");
        }
      })
      .catch(err => console.error("Error assigning book:", err));
  };

  return (
    <><div className="manage-access-container">
      <h1>Manage User Access</h1>

      <UserSelect users={users} selected={selectedUserId} onChange={setSelectedUserId} />

      {selectedUserId && (
        <>
          <AssignedBooksTable
              assignedBooks={assignedBooks}
              edits={assignedBookEdits}
              onEditChange={setAssignedBookEdits}
              onSaveAll={handleBulkUpdate}
            />
          <UnassignedBooksList
            unassignedBooks={unassignedBooks}
            onAssign={handleAssign}
            filters={filters}
            setFilters={setFilters}
            metadata={metadata}
            searchTerm={searchTerm}         // <-- ADD THIS PROP
            setSearchTerm={setSearchTerm} 
          />
        </>
      )}

      
    </div>
    {successMessage && (
        <SuccessPopup message={successMessage} onClose={() => setSuccessMessage("")} />
      )}
    </>

    
  );
};

export default ManageAccess;
