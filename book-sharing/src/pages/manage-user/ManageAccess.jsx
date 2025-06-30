import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import UserSelect from "./components/UserSelect";
import '../../styles/manage-user-css/ManageAccess.css';
import PDFCoverPreview from "../../components/PDFCoverPreview";
import Pagination from '../../components/common/Pagination';

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
// --- Assigned Books Stats Card (Dashboard Style) ---
const AssignedBooksStatsCard = ({ count }) => (
  <div className="dashboard-stats-card assigned-books-stats">
    <div className="dashboard-stats-card-icon">
      {/* This uses Font Awesome, you might have a different icon library */}
      <i className="fas fa-book-reader"></i> 
    </div>
    <div className="dashboard-stats-card-content">
      <div className="dashboard-stats-card-title">Assigned Books</div>
      <div className="dashboard-stats-card-count">{count}</div>
    </div>
  </div>
);
// --- Assigned Books Table ---
const AssignedBooksTable = ({ assignedBooks, edits, onEditChange, onSaveAll }) => {
  // Pagination and search state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState("");
  const pageSize = 5;
  const [newlyCheckedIds, setNewlyCheckedIds] = React.useState([]);

  // Filter assigned books by search term (title, version, ISBN, format)
  const filteredBooks = assignedBooks.filter(group => {
    const search = searchTerm.toLowerCase();
    return (
      group.title?.toLowerCase().includes(search) ||
      group.version_label?.toLowerCase().includes(search) ||
      group.isbn_code?.toLowerCase().includes(search) ||
      (group.digital && 'digital'.includes(search)) ||
      (group.print && 'print'.includes(search))
    );
  });

  // Pagination logic
  const totalAssigned = filteredBooks.reduce((acc, group) => acc + (group.digital ? 1 : 0) + (group.print ? 1 : 0), 0);
  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedBooks = filteredBooks.slice(startIdx, endIdx);

  // Get all book IDs from the currently filtered list (not just paginated)
  const allFilteredBookIds = filteredBooks.reduce((ids, group) => {
    if (group.digital) ids.push(group.digital.book_id);
    if (group.print) ids.push(group.print.book_id);
    return ids;
  }, []);

  // Check if all books in the entire filtered list are selected
  const allFilteredChecked = allFilteredBookIds.length > 0 && allFilteredBookIds.every(
    id => edits[id]?.can_download
  );

  // Select All handler (now global for the filtered list)
  const handleSelectAll = () => {
    const newEdits = { ...edits };

    if (!allFilteredChecked) {
      // SELECTING ALL
      // Find which ones are currently unchecked across all filtered books
      const idsToChange = allFilteredBookIds.filter(id => !edits[id]?.can_download);
      setNewlyCheckedIds(idsToChange);

      // Check all filtered books
      allFilteredBookIds.forEach(id => {
        newEdits[id] = { ...newEdits[id], can_download: true };
      });
      onEditChange(newEdits);
    } else {
      // UNSELECTING ALL
      // Revert only those that were newly checked by this action
      newlyCheckedIds.forEach(id => {
        newEdits[id] = { ...newEdits[id], can_download: false };
      });
      setNewlyCheckedIds([]); // Clear the list
      onEditChange(newEdits);
    }
  };

  // Reset newlyCheckedIds if filter changes
  React.useEffect(() => {
    setNewlyCheckedIds([]);
  }, [searchTerm]);

  // Reset to first page if filter changes and current page is out of range
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredBooks, currentPage, totalPages]);

  return (
    <div className="assigned-books-section">
      <div className="assigned-books-header">
        <h2>Assigned Books</h2>
        
        <button className="btn-save-all" onClick={onSaveAll}>
          Save All Changes
        </button>
      </div>
      {/* Search Bar */}
      <div style={{ margin: '16px 0' }}>
        <input
          type="text"
          placeholder="Search by title, version, ISBN, or format..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ width: 300 }}
        />
      </div>
      <table className="assigned-books-table">
        <thead>
          <tr>
            <th>Book Title</th>
            <th>Version</th>
            <th>ISBN</th>
            <th>Format</th>
            <th className="download-header">
              <span>Download</span>
              <button
                type="button"
                className={`btn-select-all ${allFilteredChecked ? 'active' : ''}`}
                onClick={handleSelectAll}
                aria-pressed={allFilteredChecked}
              >
                {allFilteredChecked ? 'Unselect All' : 'Select All'}
              </button>
            </th>
            <th>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {paginatedBooks.map(group => [
            group.digital && (
              <tr key={group.digital.book_id + '-digital'}>
                <td>{group.title}</td>
                <td>{group.version_label}</td>
                <td>{group.isbn_code}</td>
                <td>Digital</td>
                <td className="center-text">
                  <input
                    type="checkbox"
                    checked={!!edits[group.digital.book_id]?.can_download}
                    onChange={e => {
                      const newEdits = { ...edits };
                      newEdits[group.digital.book_id] = {
                        ...newEdits[group.digital.book_id],
                        can_download: e.target.checked
                      };
                      onEditChange(newEdits);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={edits[group.digital.book_id]?.expiry || ''}
                    onChange={e => {
                      const newEdits = { ...edits };
                      newEdits[group.digital.book_id] = {
                        ...newEdits[group.digital.book_id],
                        expiry: e.target.value
                      };
                      onEditChange(newEdits);
                    }}
                  />
                </td>
              </tr>
            ),
            group.print && (
              <tr key={group.print.book_id + '-print'}>
                <td>{group.title}</td>
                <td>{group.version_label}</td>
                <td>{group.isbn_code}</td>
                <td>Print</td>
                <td className="center-text">
                  <input
                    type="checkbox"
                    checked={!!edits[group.print.book_id]?.can_download}
                    onChange={e => {
                      const newEdits = { ...edits };
                      newEdits[group.print.book_id] = {
                        ...newEdits[group.print.book_id],
                        can_download: e.target.checked
                      };
                      onEditChange(newEdits);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={edits[group.print.book_id]?.expiry || ''}
                    onChange={e => {
                      const newEdits = { ...edits };
                      newEdits[group.print.book_id] = {
                        ...newEdits[group.print.book_id],
                        expiry: e.target.value
                      };
                      onEditChange(newEdits);
                    }}
                  />
                </td>
              </tr>
            )
          ])}
        </tbody>
      </table>
      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalCount={filteredBooks.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
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
  setSearchTerm,
  selectedUserId,
  authHeaders
}) => {
  const {
    grades,
    subjects,
    languages,
    standards,
    bookTypes,
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
      const matchCountry = filters.countries.size === 0 || (book.country_id && filters.countries.has(book.country_id));
      return (
        matchGrade &&
        matchSubject &&
        matchLanguage &&
        matchStandard &&
        matchBookType &&
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
        (book.isbn_code || '').toLowerCase().includes(lowerCaseSearchTerm) ||
        (book.tags?.some(tag => tag.tag_name.toLowerCase().includes(lowerCaseSearchTerm)))
      );
    });

  const toggleFilterVisibility = (key) => {
    setShowFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState([]);

  // Helper to get group key
  const getGroupKey = (group) =>
    [group.title, group.isbn_code, group.grade_id, group.version_label].join('|');

  // Toggle selection by group key
  const toggle = (group) => {
    const key = getGroupKey(group);
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Assign selected groups
  const assign = () => {
    selected.forEach(key => {
      const group = unassignedBooks.find(g => getGroupKey(g) === key);
      if (group) onAssign(group);
    });
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
          { key: "countries", label: "Countries", items: countries, idKey: "country_id", nameKey: "country_name" },
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
                isbn_code,
                format_name
              } = book;

              return (
                <div
                  key={getGroupKey(book)}
                  className={`book-card ${selected.includes(getGroupKey(book)) ? "selected" : ""}`}
                  onClick={() => toggle(book)}
                  style={{ width: 285 }}
                >
                  <PDFCoverPreview
                    pdfUrl={`/api/books/${(book.digital || book.print).book_id}/stream-cover`}
                    width={250}
                    height={260}
                  />
                  <div className="book-card-header">
                    <h3>{title}</h3>
                    <button
                      className={`select-btn ${selected.includes(getGroupKey(book)) ? "selected" : ""}`}
                      onClick={e => {
                        e.stopPropagation();
                        toggle(book);
                      }}
                    >
                      {selected.includes(getGroupKey(book)) ? "✓" : "+"}
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
        grade_level: book.grade_level,
        version_label: book.version_label,
        digital: null,
        print: null,
        description: book.description,
        subject_id: book.subject_id,
        subject_name: book.subject_name,
        language_id: book.language_id,
        language_name: book.language_name,
        standard_id: book.standard_id,
        standard_name: book.standard_name,
        country_id: book.country_id,
        country_name: book.country_name,
        booktype_id: book.booktype_id,
        book_type_title: book.book_type_title,
        created_by: book.created_by,
        created_at: book.created_at,
        tags: book.tags,
      };
    }
    const formatName = (book.format_name || '').toLowerCase();
    if (formatName.includes('digital')) grouped[key].digital = book;
    if (formatName.includes('print')) grouped[key].print = book;
  }
  return Object.values(grouped);
}

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
    countries: new Set()
  });

  // Metadata for filters
  const [metadata, setMetadata] = useState({
    grades: [],
    subjects: [],
    languages: [],
    standards: [],
    bookTypes: [],
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
        setAssignedBooks(groupBooksByLogicalBook(res.data.assignedBooks || []));
        setUnassignedBooks(groupBooksByLogicalBook(res.data.unassignedBooks || []));
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
          countriesRes,
        ] = await Promise.all([
          axios.get('/api/grades', authHeaders),
          axios.get('/api/subjects', authHeaders),
          axios.get('/api/languages', authHeaders),
          axios.get('/api/standards', authHeaders),
          axios.get('/api/booktypes', authHeaders),
          axios.get('/api/countries', authHeaders).catch(() => ({ data: [] }))
        ]);

        setMetadata({
          grades: gradesRes.data || [],
          subjects: subjectsRes.data || [],
          languages: languagesRes.data || [],
          standards: standardsRes.data || [],
          bookTypes: bookTypesRes.data || [],
          countries: countriesRes.data || [],
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
    // Create an array of update promises for both digital and print
    const updatePromises = Object.entries(assignedBookEdits).map(([bookId, changes]) => {
      const payload = {
        user_id: parseInt(selectedUserId),
        book_id: parseInt(bookId),
        permission: "viewer",
        expiry: changes.expiry || null,
        can_download: changes.can_download
      };
      return axios.post("/api/books/book-control", payload, authHeaders);
    });

    try {
      await Promise.all(updatePromises);
      // Refetch assigned/unassigned books for the user
      axios.get(`/api/books/user-access/${selectedUserId}`, authHeaders)
        .then(res => {
          setAssignedBooks(groupBooksByLogicalBook(res.data.assignedBooks || []));
          setUnassignedBooks(groupBooksByLogicalBook(res.data.unassignedBooks || []));
          // --- Update assignedBookEdits with new values from backend ---
          const initialEdits = {};
          (res.data.assignedBooks || []).forEach(book => {
            initialEdits[book.book_id] = {
              can_download: !!book.can_download,
              expiry: book.expiry?.split("T")[0] || ""
            };
          });
          setAssignedBookEdits(initialEdits);
          // --- End update ---
          setSuccessMessage("All changes saved successfully!");
        })
        .catch(err => console.error("Error loading access data:", err));
    } catch (err) {
      console.error("Error saving all changes:", err);
      // You might want to show an error popup here as well
    }
  };

  const handleAssign = async (group) => {
    const bookIds = [];
    if (group.digital) bookIds.push(group.digital.book_id);
    if (group.print) bookIds.push(group.print.book_id);

    // Wait for all assignments to finish
    await Promise.all(bookIds.map(bookId => {
      const payload = {
        user_id: parseInt(selectedUserId),
        book_id: bookId,
        permission: "viewer",
        expiry: null,
        can_download: false
      };
      return axios.post("/api/books/book-control", payload, authHeaders);
    }));

    // Refetch assigned/unassigned books for the user
    axios.get(`/api/books/user-access/${selectedUserId}`, authHeaders)
      .then(res => {
        setAssignedBooks(groupBooksByLogicalBook(res.data.assignedBooks || []));
        setUnassignedBooks(groupBooksByLogicalBook(res.data.unassignedBooks || []));
        setSuccessMessage("Book assigned successfully!");
      })
      .catch(err => console.error("Error loading access data:", err));
  };

  return (
    <><div className="manage-access-container">
      <h1>Manage User Access</h1>

      <div className="user-select-stats-row">
    <UserSelect users={users} selected={selectedUserId} onChange={setSelectedUserId} />
    <AssignedBooksStatsCard count={assignedBooks.length} />
  </div>

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
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedUserId={selectedUserId}
            authHeaders={authHeaders}
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
