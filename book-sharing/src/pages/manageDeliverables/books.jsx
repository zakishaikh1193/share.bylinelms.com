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
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getGradeName = id => grades.find(g => g.grade_id === id)?.grade_level || '—';
  const getSubjectName = id => subjects.find(s => s.subject_id === id)?.subject_name || '—';
  const getLanguageName = id => languages.find(l => l.language_id === id)?.language_name || '—';
  const getStandardName = id => standards.find(st => st.standard_id === id)?.standard_name || '—';

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [booksRes, gradesRes, subjectsRes, languagesRes, standardRes] = await Promise.all([
        axios.get('/api/books', { headers }),
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

      <table className="books-table-structure">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Country</th>
            <th>ISBN</th>
            <th>Book Type</th>
            <th>Language</th>
            <th>Grade</th>
            <th>Subject</th>
            <th>Standards</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.length === 0 ? (
            <tr>
              <td colSpan="10" className="books-table-no-data">No books available</td>
            </tr>
          ) : (
            books.map((book) => (
              <tr key={book.book_id} className="clickable-row">
                <td>{book.book_id}</td>
                <td>{book.title}</td>
                <td>{book.country_name || "—"}</td>
                <td>{book.isbn_code || "—"}</td>
                <td>{book.book_type_title || "—"}</td>
                <td>{getLanguageName(book.language_id)}</td>
                <td>{getGradeName(book.grade_id)}</td>
                <td>{getSubjectName(book.subject_id)}</td>
                <td>{getStandardName(book.standard_id)}</td>
                 <td>
                  <div className="action-buttons">
                    <button
                      className="books-table-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/edit-book/${book.book_id}`);
                      }}
                      title="Edit Book"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="books-table-delete-btn"
                      onClick={(e) => handleDelete(book.book_id, e)}
                      title="Delete Book"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BooksTable;
