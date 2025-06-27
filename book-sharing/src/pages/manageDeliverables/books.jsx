import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import '../../styles/manageDeliverables/books.css';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash } from 'react-icons/fa';

const BooksTable = () => {
  const [books, setBooks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getGradeName = id => grades.find(g => g.grade_id === id)?.grade_level || '—';
  const getSubjectName = id => subjects.find(s => s.subject_id === id)?.subject_name || '—';
  const getLanguageName = id => languages.find(l => l.language_id === id)?.language_name || '—';
  const getStandardName = id => standards.find(st => st.standard_id === id)?.standard_name || '—';

  // Filter books based on search term
  const filteredBooks = books.filter(group => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) return true;
    // Use shared metadata for filtering
    return (
      (group.title || '').toLowerCase().includes(lowerCaseSearchTerm) ||
      (group.country_name || '').toLowerCase().includes(lowerCaseSearchTerm) ||
      (group.isbn_code || '').toLowerCase().includes(lowerCaseSearchTerm) ||
      (group.book_type_title || '').toLowerCase().includes(lowerCaseSearchTerm) ||
      getLanguageName(group.language_id).toLowerCase().includes(lowerCaseSearchTerm) ||
      getGradeName(group.grade_id).toLowerCase().includes(lowerCaseSearchTerm) ||
      getSubjectName(group.subject_id).toLowerCase().includes(lowerCaseSearchTerm) ||
      getStandardName(group.standard_id).toLowerCase().includes(lowerCaseSearchTerm) ||
      (group.tags?.some(tag => tag.tag_name.toLowerCase().includes(lowerCaseSearchTerm)))
    );
  });

  // Calculate total pages based on filtered books
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  // Get current items for the page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBooks.slice(indexOfFirstItem, indexOfLastItem);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [booksRes, gradesRes, subjectsRes, languagesRes, standardRes] = await Promise.all([
        axios.get('/api/books/grouped', { headers }),
        axios.get('/api/grades', { headers }),
        axios.get('/api/subjects', { headers }),
        axios.get('/api/languages', { headers }),
        axios.get('/api/standards', { headers }),
      ]);

      setBooks(booksRes.data.books || []);
      setGrades(gradesRes.data);
      setSubjects(subjectsRes.data);
      setLanguages(languagesRes.data);
      setStandards(standardRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching book data:', err);
      setError(err.response?.data?.error || 'Failed to fetch books');
      setLoading(false);
    }
  };

  const handleDelete = async (bookId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }
 
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
 
      await axios.delete(`/api/books/${bookId}`, { headers });
      // Refresh the books list
      fetchData();
    } catch (err) {
      console.error('Error deleting book:', err);
      setError(err.response?.data?.error || 'Failed to delete book');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="books-table-loading">Loading books...</div>;
  if (error) return <div className="error-message">{error}</div>;
  return (
    <div className="books-table-wrapper">
      {/* Back Button */}
      <div className="books-table-header-bar">
        <button
          className="books-table-back-btn"
          onClick={() => navigate('/admin/explore-books')}
        >
          ← Back
        </button>

        <button className="books-table-add-btn" onClick={() => navigate('/admin/add-book')}>
          + Add Book
        </button>
      </div>

      <h2 className="books-table-title">Books List</h2>
      <div className="table-search-container">
  <input
    type="search"
    className="books-table-search"
    placeholder="Search by title, country, subject..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
      <div className="books-table-container">
        <table className="books-table-structure">
        <thead>
          <tr>
            <th>ID</th>
            <th>Grade</th>
            <th>Title</th>
            <th>Country</th>
            <th>ISBN</th>
            <th>Book Type</th>
            <th>Language</th>
            <th>Subject</th>
            <th>Standards</th>
            <th>Format</th>
            <th>Created At</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.length === 0 ? (
            <tr>
              <td colSpan="11" className="books-table-no-data">{searchTerm ? `No books found matching "${searchTerm}"` : "No books available"}</td>
            </tr>
          ) : (
            currentItems.map((group) => {
              const formats = [
                group.digital ? 'Digital' : null,
                group.print ? 'Print' : null
              ].filter(Boolean).join(', ');
              return (
                <tr key={group.title + group.isbn_code + group.grade_id + group.version_label} className="clickable-row">
                  <td>{group.digital?.book_id || group.print?.book_id || '—'}</td>
                  <td>{getGradeName(group.grade_id)}</td>
                  <td>{group.title}</td>
                  <td>{group.country_name || "—"}</td>
                  <td>{group.isbn_code || "—"}</td>
                  <td>{group.book_type_title || "—"}</td>
                  <td>{getLanguageName(group.language_id)}</td>
                  <td>{getSubjectName(group.subject_id)}</td>
                  <td>{getStandardName(group.standard_id)}</td>
                  <td>{formats || "—"}</td>
                  <td>{group.created_at ? new Date(group.created_at).toLocaleString() : '—'}</td>
                  <td>{group.last_updated_at ? new Date(group.last_updated_at).toLocaleString() : '—'}</td>
                  <td>
                    <div className="action-buttons-books">
                      {/* Unified Edit Button: Use digital.book_id if present, else print.book_id */}
                      <button
                        className="books-table-edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/edit-book/${group.digital?.book_id || group.print?.book_id}`);
                        }}
                        title="Edit Book (Both Formats)"
                      >
                        <FaEdit />
                      </button>
                      {/* Delete Digital Button */}
                      {group.digital && (
                        <button
                          className="books-table-delete-btn"
                          onClick={(e) => handleDelete(group.digital.book_id, e)}
                          title="Delete Digital"
                        >
                          <FaTrash /> D
                        </button>
                      )}
                      {/* Delete Print Button */}
                      {group.print && (
                        <button
                          className="books-table-delete-btn"
                          onClick={(e) => handleDelete(group.print.book_id, e)}
                          title="Delete Print"
                        >
                          <FaTrash /> P
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
      <div className="pagination-container">
        <button
          className="pagination-button"
          onClick={() => setCurrentPage(prev => prev - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        
        <button
          className="pagination-button"
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
      </div>
    </div>
  );
};

export default BooksTable;
