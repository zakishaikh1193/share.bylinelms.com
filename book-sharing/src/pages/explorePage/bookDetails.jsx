import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/explorePageCss/bookDetails.css';

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`/api/books/${id}`, { headers });
        setBook(res.data);
      } catch (error) {
        console.error('Error fetching book details:', error);
      }
    };
    fetchBook();
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <div className="book-detail-container">
      <div className="book-detail-header">
        <span onClick={() => navigate(-1)} className="book-back-link">Dashboard &gt; Course Detail</span>
        <h1 className="book-title">{book.title}</h1>
        <p className="book-description">{book.description}</p>
      </div>

      <div className="book-specification-wrapper">
        <div className="book-specs-box">
          <h2 className="specs-heading">Book Specifications</h2>
          <table className="specs-table">
            <tbody>
              <tr><th>Grade:</th><td>{book.grade_level || '—'}</td></tr>
              <tr><th>Version:</th><td>{book.version || '—'}</td></tr>
              <tr><th>Language:</th><td>{book.language_name || '—'}</td></tr>
              <tr><th>Subject:</th><td>{book.subject_name || '—'}</td></tr>
              <tr><th>Country:</th><td>{book.country_name || '—'}</td></tr>
              <tr><th>Book Type:</th><td>{book.book_type_title || '—'}</td></tr>
              <tr><th>ISBN:</th><td>{book.isbn_number || '—'}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="book-cover-box">
          <img
            src={book.img || book.coverUrl || 'https://mckups.com/wp-content/uploads/2021/04/isometric-view-torn-book-cover-mockup-Graphics-9752611-1-1-scaled.jpeg'}
            alt="Book Cover"
            className="book-cover-img"
          />
        </div>
      </div>

      <div className="book-actions">
        <button onClick={() => navigate(-1)} className="action-btn gray">← Go Back</button>
        <button className="action-btn blue">Read Book</button>
        <button className="action-btn blue">Download PDF</button>
        <button className="action-btn blue-outline">ZIP Not Available</button>
      </div>
    </div>
  );
};

export default BookDetail;
