import React, { useState, useEffect } from "react";
// import "./BookUpload.css"; // Your CSS file path
 
const BookUpload = () => {
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [coverType, setCoverType] = useState("Student Book");
  const [grade, setGrade] = useState("G1");
  const [format, setFormat] = useState("Digital Print");
  const [isbn, setIsbn] = useState("");
  const [version, setVersion] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
 
  const grades = Array.from({ length: 12 }, (_, i) => `G${i + 1}`);
 
  useEffect(() => {
    if (coverFile && coverFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(coverFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [coverFile]);
 
  const handleSubmit = (e) => {
    e.preventDefault();
 
    console.log("Submitted Cover:", {
      clientName,
      email,
      description,
      coverType,
      grade,
      format,
      isbn,
      version,
      file: coverFile?.name,
    });
 
    alert("Cover uploaded successfully!");
 
    // Reset form
    setClientName("");
    setEmail("");
    setDescription("");
    setCoverType("Student Book");
    setGrade("G1");
    setFormat("Digital Print");
    setIsbn("");
    setVersion("");
    setCoverFile(null);
    setPreviewUrl(null);
 
    // Clear file input manually
    document.querySelector('input[type="file"]').value = "";
  };
 
  return (
    <div className="upload-container">
      <h2>Cover Upload</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
 
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
 
        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
 
        <div className="form-row">
          <div className="form-group">
            <label>Cover Type</label>
            <select
              value={coverType}
              onChange={(e) => setCoverType(e.target.value)}
            >
              <option value="Student Book">Student Book</option>
              <option value="Teacher Book">Teacher Book</option>
              <option value="Practice Book">Practice Book</option>
            </select>
          </div>
 
          <div className="form-group grade-group">
            <label>Grade</label>
            <div className="grade-scroll">
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`grade-btn ${grade === g ? "active" : ""}`}
                  onClick={() => setGrade(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
 
        <div className="form-row">
          <div className="form-group">
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="Digital Print">Digital Print</option>
              <option value="Print">Print</option>
            </select>
          </div>
 
          <div className="form-group">
            <label>ISBN No.</label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </div>
 
          <div className="form-group">
            <label>Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
        </div>
 
        <div className="form-group full-width">
          <label>Upload Cover</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setCoverFile(e.target.files[0])}
            required
          />
          {coverFile && (
            <div className="file-preview-wrapper">
              {coverFile.type.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Cover Preview"
                  className="file-thumbnail"
                />
              ) : (
                <div
                  className="file-thumbnail"
                  style={{
                    background: "#ccc",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "24px",
                  }}
                >
                  📄
                </div>
              )}
              <div className="file-info">
                <span className="file-name" title={coverFile.name}>
                  {coverFile.name}
                </span>
                <button
                  type="button"
                  className="file-remove-btn"
                  aria-label="Remove selected cover"
                  onClick={() => {
                    setCoverFile(null);
                    setPreviewUrl(null);
                    document.querySelector('input[type="file"]').value = "";
                  }}
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>
 
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};
 
export default BookUpload;