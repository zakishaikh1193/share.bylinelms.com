import React, { useEffect, useState } from 'react';
import axios from '../../../axiosConfig';
import { useNavigate } from 'react-router-dom';

const BookListPage = () => {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/books', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setBooks(res.data.books))
    .catch(err => console.error(err));
  }, []);

  const handleViewDetails = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  const getCoverUrl = (coverPath) => {
    if (!coverPath)
      return 'https://mckups.com/wp-content/uploads/2021/04/isometric-view-torn-book-cover-mockup-Graphics-9752611-1-1-scaled.jpeg';
    return `${axios.defaults.baseURL}/${coverPath.replace(/\\/g, '/')}`;
  };

  const BookCover = ({ cover }) => {
    const coverUrl = getCoverUrl(cover);

    return (
      <img
        src={coverUrl}
        alt="Book Cover"
        width="300px"
        height="400px"
        style={{ objectFit: 'cover', borderRadius: '12px' }}
        className="mx-auto"
      />
    );
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <div key={book.book_id} className="bg-white shadow-xl rounded-2xl p-4 flex flex-col">
          <BookCover cover={book.cover} />

          <h2 className="text-xl font-semibold mt-3">{book.title}</h2>

          <p className="text-sm text-gray-700 mt-1">
            <strong>Type:</strong> {book.book_type_title || 'N/A'}
          </p>

          <p className="text-sm text-gray-700 mt-1">
            <strong>Country:</strong> {book.country_name || 'Unknown'}
          </p>

          {book.version_label && (
            <p className="text-sm text-gray-700 mt-1">
              <strong>Version:</strong> {book.version_label}
            </p>
          )}

          {book.isbn_code && (
            <p className="text-sm text-gray-700 mt-1">
              <strong>ISBN:</strong> {book.isbn_code}
            </p>
          )}

          <p className="text-gray-600 mt-3 text-sm">
            {book.description?.length > 100
              ? book.description.slice(0, 100) + '...'
              : book.description}
          </p>

          <button
            onClick={() => handleViewDetails(book.book_id)}
            className="mt-auto bg-blue-600 text-white px-4 py-2 rounded-xl mt-4 hover:bg-blue-700"
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
};

export default BookListPage;
