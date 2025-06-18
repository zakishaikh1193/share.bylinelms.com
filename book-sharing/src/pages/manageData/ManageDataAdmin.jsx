import React, { useState, useEffect } from 'react';
import axios from '../../axiosConfig';
import '../../styles/manageData_Css/ManageDataAdmin.css';

export default function ManageDataAdmin() {
  const [countries, setCountries] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [standards, setStandards] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [bookTypes, setBookTypes] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [activeCountryTab, setActiveCountryTab] = useState('list');
  const [activeGradeTab, setActiveGradeTab] = useState('list');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch all data
    axios.get('/api/countries', { headers }).then(res => setCountries(res.data));
    axios.get('/api/grades', { headers }).then(res => setGrades(res.data));
    axios.get('/api/subjects', { headers }).then(res => setSubjects(res.data));
    axios.get('/api/standards', { headers }).then(res => setStandards(res.data));
    axios.get('/api/languages', { headers }).then(res => setLanguages(res.data));
    axios.get('/api/booktypes', { headers }).then(res => setBookTypes(res.data));
  }, []);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="manage-data-wrapper">
      <h1><strong>Manage Data</strong></h1>
      <div className="list-group-container">
        <div className="horizontal-sections">
          {/* Countries Section */}
          <div className="list-group-item">
            <div 
              className={`list-group-header ${activeSection === 'countries' ? 'active' : ''}`}
              onClick={() => toggleSection('countries')}
            >
              <h2>Countries</h2>
              <button className="add-button">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Country
              </button>
            </div>
            <div className={`list-group-content ${activeSection === 'countries' ? 'active' : ''}`}>
              <div className="tabs">
                <button 
                  className={`tab-button ${activeCountryTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveCountryTab('list')}
                >
                  List View
                </button>
                <button 
                  className={`tab-button ${activeCountryTab === 'grid' ? 'active' : ''}`}
                  onClick={() => setActiveCountryTab('grid')}
                >
                  Grid View
                </button>
              </div>
              <div className={`tab-content ${activeCountryTab === 'list' ? 'active' : ''}`}>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Country Name</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countries.map(country => (
                        <tr key={country.country_id}>
                          <td>{country.country_id}</td>
                          <td>{country.country_name}</td>
                          <td className="action-buttons">
                            <button className="edit-btn">Edit</button>
                            <button className="delete-btn">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={`tab-content ${activeCountryTab === 'grid' ? 'active' : ''}`}>
                <div className="data-grid grid-view">
                  {countries.map(country => (
                    <div key={country.country_id} className="grid-item">
                      <div className="grid-item-content">
                        <span className="grid-item-name">{country.country_name}</span>
                        <div className="grid-item-actions">
                          <button>Edit</button>
                          <button>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grades Section */}
          <div className="list-group-item">
            <div 
              className={`list-group-header ${activeSection === 'grades' ? 'active' : ''}`}
              onClick={() => toggleSection('grades')}
            >
              <h2>Grades</h2>
              <button className="add-button">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Grade
              </button>
            </div>
            <div className={`list-group-content ${activeSection === 'grades' ? 'active' : ''}`}>
              <div className="tabs">
                <button 
                  className={`tab-button ${activeGradeTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveGradeTab('list')}
                >
                  List View
                </button>
                <button 
                  className={`tab-button ${activeGradeTab === 'grid' ? 'active' : ''}`}
                  onClick={() => setActiveGradeTab('grid')}
                >
                  Grid View
                </button>
              </div>
              <div className={`tab-content ${activeGradeTab === 'list' ? 'active' : ''}`}>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Grade Level</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map(grade => (
                        <tr key={grade.grade_id}>
                          <td>{grade.grade_id}</td>
                          <td>{grade.grade_level}</td>
                          <td className="action-buttons">
                            <button className="edit-btn">Edit</button>
                            <button className="delete-btn">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={`tab-content ${activeGradeTab === 'grid' ? 'active' : ''}`}>
                <div className="data-grid grid-view">
                  {grades.map(grade => (
                    <div key={grade.grade_id} className="grid-item">
                      <div className="grid-item-content">
                        <span className="grid-item-name">{grade.grade_level}</span>
                        <div className="grid-item-actions">
                          <button>Edit</button>
                          <button>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Section */}
          <div className="list-group-item">
            <div 
              className={`list-group-header ${activeSection === 'subjects' ? 'active' : ''}`}
              onClick={() => toggleSection('subjects')}
            >
              <h2>Subjects</h2>
              <button>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Subject
              </button>
            </div>
            <div className={`list-group-content ${activeSection === 'subjects' ? 'active' : ''}`}>
              <div className="data-grid">
                {subjects.map(subject => (
                  <div key={subject.subject_id} className="data-item">
                    <span className="data-item-name">{subject.subject_name}</span>
                    <div className="data-item-actions">
                      <button>Edit</button>
                      <button>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Standards Section */}
          <div className="list-group-item">
            <div 
              className={`list-group-header ${activeSection === 'standards' ? 'active' : ''}`}
              onClick={() => toggleSection('standards')}
            >
              <h2>Standards</h2>
              <button>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Standard
              </button>
            </div>
            <div className={`list-group-content ${activeSection === 'standards' ? 'active' : ''}`}>
              <div className="data-grid">
                {standards.map(standard => (
                  <div key={standard.standard_id} className="data-item">
                    <span className="data-item-name">{standard.standard_name}</span>
                    <div className="data-item-actions">
                      <button>Edit</button>
                      <button>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Languages Section */}
          <div className="list-group-item">
            <div 
              className={`list-group-header ${activeSection === 'languages' ? 'active' : ''}`}
              onClick={() => toggleSection('languages')}
            >
              <h2>Languages</h2>
              <button>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Language
              </button>
            </div>
            <div className={`list-group-content ${activeSection === 'languages' ? 'active' : ''}`}>
              <div className="data-grid">
                {languages.map(language => (
                  <div key={language.language_id} className="data-item">
                    <span className="data-item-name">{language.language_name}</span>
                    <div className="data-item-actions">
                      <button>Edit</button>
                      <button>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Book Types Section */}
          <div className="list-group-item">
            <div 
              className={`list-group-header ${activeSection === 'bookTypes' ? 'active' : ''}`}
              onClick={() => toggleSection('bookTypes')}
            >
              <h2>Book Types</h2>
              <button>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Book Type
              </button>
            </div>
            <div className={`list-group-content ${activeSection === 'bookTypes' ? 'active' : ''}`}>
              <div className="data-grid">
                {bookTypes.map(bookType => (
                  <div key={bookType.book_type_id} className="data-item">
                    <span className="data-item-name">{bookType.book_type_title}</span>
                    <div className="data-item-actions">
                      <button>Edit</button>
                      <button>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 