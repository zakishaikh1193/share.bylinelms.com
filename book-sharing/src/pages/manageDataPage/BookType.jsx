import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import "../../styles/manageData_Css/BookType.css";
import AddBookTypeModal from "./AddBookTypeModal";

function BookTypesAdmin() {
  const [bookTypes, setBookTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchBookTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/booktypes", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBookTypes(res.data);
    } catch {
      setError("Failed to fetch book types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookTypes();
  }, []);

  return (
    <div className="booktype-admin-wrapper">
      <div className="booktype-admin-card">
        <div className="booktype-header">
          <h2>Book Types</h2>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Add Book Type
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {showModal && (
          <AddBookTypeModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              fetchBookTypes();
            }}
          />
        )}

        <div className="booktype-table-container">
          <h3 className="table-title">Existing Book Types</h3>
          {loading ? (
            <p>Loading...</p>
          ) : bookTypes.length === 0 ? (
            <p>No book types found.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Book Type Title</th>
                </tr>
              </thead>
              <tbody>
                {bookTypes.map(({ book_type_id, book_type_title }) => (
                  <tr key={book_type_id}>
                    <td>{book_type_id}</td>
                    <td>{book_type_title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookTypesAdmin;