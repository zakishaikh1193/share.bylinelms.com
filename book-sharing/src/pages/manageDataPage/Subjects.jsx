import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import "../../styles/manageData_Css/Subjects.css";
import AddSubjectModal from "./AddSubjectModal";

function SubjectsAdmin() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/subjects", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSubjects(res.data);
    } catch {
      setError("Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <div className="subject-admin-wrapper">
      <div className="subject-admin-card">
        <div className="subject-header">
          <h2>Subjects</h2>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Add Subject
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {showModal && (
          <AddSubjectModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              fetchSubjects();
            }}
          />
        )}

        <div className="subject-table-container">
          <h3 className="table-title">Existing Subjects</h3>
          {loading ? (
            <p>Loading...</p>
          ) : subjects.length === 0 ? (
            <p>No subjects found.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject Name</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(({ subject_id, subject_name }) => (
                  <tr key={subject_id}>
                    <td>{subject_id}</td>
                    <td>{subject_name}</td>
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

export default SubjectsAdmin;