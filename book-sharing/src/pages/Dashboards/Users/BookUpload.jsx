import React, { useEffect, useState } from "react";
import axios from "../../../axiosConfig"; // adjust path to your config
import "./BookUpload.css"; 
const SubmitReview = () => {
  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({
    book_id: "",
    subject: "",
    description: "",
    file: null,
  });
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get("/api/books", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setBooks(res.data.books);
      } catch (err) {
        console.error("Failed to fetch books", err);
      }
    };
    fetchBooks();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("book_id", formData.book_id);
      payload.append("subject", formData.subject);
      payload.append("description", formData.description);
      if (formData.file) payload.append("file", formData.file);

      const res = await axios.post("/api/reviews", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg(`Review submitted with ID ${res.data.review_id}`);
      setFormData({ book_id: "", subject: "", description: "", file: null });
    } catch (err) {
      console.error("Failed to submit review", err);
      alert("Failed to submit review.");
    }
  };

  return (
    <div className="submit-review-container">
      <h2>Submit a Review</h2>
      {successMsg && <div className="success">{successMsg}</div>}
      <form onSubmit={handleSubmit}>
        <label>Book:</label>
        <select
          name="book_id"
          value={formData.book_id}
          onChange={handleChange}
          required
        >
          <option value="">Select a book</option>
          <option value="general">General</option>
          {books.map((book) => (
            <option key={book.book_id} value={book.book_id}>
              {book.title}
            </option>
          ))}
        </select>

        <label>Subject:</label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
        />

        <label>Description:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <label>Optional File:</label>
        <input
          type="file"
          name="file"
          accept=".pdf,.zip,.jpg,.jpeg,.png"
          onChange={handleChange}
        />

        <button type="submit">Submit Review</button>
      </form>
    </div>
  );
};

export default SubmitReview;
