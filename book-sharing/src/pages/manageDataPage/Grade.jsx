import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import AddGradeModal from './AddGradeModal';
import '../../styles/manageData_Css/Grade.css';

const GradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchGrades = async () => {
    try {
      const res = await axios.get('/api/grades', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setGrades(res.data);
    } catch (err) {
      console.error('Failed to fetch grades', err);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const handleAddSuccess = () => {
    fetchGrades();
    setShowModal(false);
  };

  return (
    <div className="addgrade-container">
      <h2>Grades</h2>
      <div className="add-btn-wrapper">
        <button className="add-btn" onClick={() => setShowModal(true)}>+ Add Grade</button>
      </div>

      <ul className="grade-list">
        {grades.map((g) => (
          <li key={g.grade_id}>{g.grade_level}</li>
        ))}
      </ul>

      {showModal && <AddGradeModal onClose={() => setShowModal(false)} onSuccess={handleAddSuccess} />}
    </div>
  );
};

export default GradesPage;
