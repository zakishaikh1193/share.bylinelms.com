import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import { MdEdit, MdDelete } from "react-icons/md";

import AddCountryModal from "./AddCountryModal";
import AddGradeModal from "./AddGradeModal";
import AddSubjectModal from "./AddSubjectModal";
import AddBookTypeModal from "./AddBookTypeModal";
import AddLanguageModal from "./AddLanguageModal";
import AddStandardModal from "./AddStandardModal";
import BookFormats from './BookFormats';
import Tags from './Tags';
import Pagination from '../../components/common/Pagination';

import "../../styles/manageData_Css/ManageDataAdmin.css";

const ManageDataAdmin = () => {
  const [countries, setCountries] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [bookTypes, setBookTypes] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [standards, setStandards] = useState([]);
  const [showModal, setShowModal] = useState({});
  const [collapsed, setCollapsed] = useState({});

  const [editValue, setEditValue] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState("");

  // Pagination state for subjects
  const [subjectPage, setSubjectPage] = useState(1);
  const subjectPageSize = 10;

  const tokenHeader = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Reset to first page if subjects change and current page is out of range
  useEffect(() => {
    const totalPages = Math.ceil(subjects.length / subjectPageSize);
    if (subjectPage > totalPages && totalPages > 0) {
      setSubjectPage(1);
    }
  }, [subjects, subjectPage]);

  // Pagination logic for subjects
  const subjectStartIdx = (subjectPage - 1) * subjectPageSize;
  const subjectEndIdx = subjectStartIdx + subjectPageSize;
  const paginatedSubjects = subjects.slice(subjectStartIdx, subjectEndIdx);

  const fetchAll = async () => {
    await Promise.all([
      axios
        .get("/api/countries", tokenHeader)
        .then((res) => setCountries(res.data)),
      axios.get("/api/grades", tokenHeader).then((res) => setGrades(res.data)),
      axios
        .get("/api/subjects", tokenHeader)
        .then((res) => setSubjects(res.data)),
      axios
        .get("/api/booktypes", tokenHeader)
        .then((res) => setBookTypes(res.data)),
      axios
        .get("/api/languages", tokenHeader)
        .then((res) => setLanguages(res.data)),
      axios
        .get("/api/standards", tokenHeader)
        .then((res) => setStandards(res.data)),
    ]);
  };

  const toggleCollapse = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEditOpen = (item, type) => {
    setEditItem(item);
    setEditType(type);
    let value = "";
    switch (type) {
      case "country":
        value = item.country_name;
        break;
      case "grade":
        value = item.grade_level;
        break;
      case "subject":
        value = item.subject_name;
        break;
      case "standard":
        value = item.standard_name;
        break;
      case "language":
        value = item.language_name;
        break;
      case "booktype":
        value = item.book_type_title;
        break;
      default:
        value = "";
    }
    setEditValue(value);
    setShowModal((prev) => ({ ...prev, edit: true }));
  };

  const handleEditSave = async () => {
    if (!editItem || !editType || !editValue.trim()) return;

    try {
      const endpoints = {
        country: `/api/countries/${editItem.country_id}`,
        grade: `/api/grades/${editItem.grade_id}`,
        subject: `/api/subjects/${editItem.subject_id}`,
        standard: `/api/standards/${editItem.standard_id}`,
        language: `/api/languages/${editItem.language_id}`,
        booktype: `/api/booktypes/${editItem.book_type_id}`,
      };

      const payloads = {
        country: { country_name: editValue },
        grade: { grade_level: editValue },
        subject: { subject_name: editValue },
        standard: { standard_name: editValue },
        language: {
          language_name: editValue,
          country_id: editItem.country_id, // ✅ Include existing country_id
        },
        booktype: { book_type_title: editValue },
      };

      await axios.put(endpoints[editType], payloads[editType], tokenHeader);
      setShowModal({});
      setEditItem(null);
      setEditValue("");
      fetchAll();
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleDelete = async (item, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`))
      return;

    try {
      const endpoints = {
        country: `/api/countries/${item.country_id}`,
        grade: `/api/grades/${item.grade_id}`,
        subject: `/api/subjects/${item.subject_id}`,
        standard: `/api/standards/${item.standard_id}`,
        language: `/api/languages/${item.language_id}`,
        booktype: `/api/booktypes/${item.book_type_id}`,
      };

      await axios.delete(endpoints[type], tokenHeader);
      fetchAll();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const renderActions = (item, type) => (
    <td className="actions-cell">
      <MdEdit
        className="action-icon"
        onClick={() => handleEditOpen(item, type)}
      />
      <MdDelete
        className="action-icon"
        onClick={() => handleDelete(item, type)}
      />
    </td>
  );
  return (
    <div className="manage-data-admin-container">
      <h1 className="manage-title">Manage Data</h1>

      {/* 🌍 Countries and 📘 Grades */}
      <div className="horizontal-button-group">
        <div className="button-group-section">
          <div className="section-header">
            <h2>Countries</h2>
            <button
              className="add-data-button"
              onClick={() => setShowModal({ country: true })}
            >
              + Add
            </button>
          </div>
          <div className="button-list">
            {countries.map((c) => (
              <div key={c.country_id} className="item-button-with-icon">
                <button
                  className="item-button"
                  onClick={() => handleEditOpen(c, "country")}
                >
                  {c.country_name}
                </button>
              </div>
            ))}
          </div>
          {showModal.country && (
            <AddCountryModal
              onClose={() => setShowModal({})}
              onSuccess={fetchAll}
            />
          )}
        </div>

        <div className="button-group-section">
          <div className="section-header">
            <h2>Grades</h2>
            <button
              className="add-data-button"
              onClick={() => setShowModal({ grade: true })}
            >
              + Add
            </button>
          </div>

          <div className="button-list">
            {grades.map((g) => (
              <div key={g.grade_id} className="item-button-with-icon">
                <button
                  className="item-button"
                  onClick={() => handleEditOpen(g, "grade")}
                >
                  {g.grade_level}
                </button>
              </div>
            ))}
          </div>
        </div>
        {showModal.grade && (
          <AddGradeModal
            onClose={() => setShowModal({})}
            onSuccess={fetchAll}
          />
        )}
      </div>

      {/* 📄 Subjects & Book Types in Horizontal Table Layout */}
      <div className="horizontal-sections-row">
        <section className="data-section half-width">
          <div
            className="section-header"
            onClick={() => toggleCollapse("subject")}
          >
            <h2>Subjects</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal({ subject: true });
              }}
            >
              + Add
            </button>
          </div>
          {!collapsed["subject"] && (
            <table>
              <thead>
                <tr>
                  <th>SUBJECT ID</th>
                  <th>SUBJECT NAME</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubjects.map((item) => (
                  <tr key={item.subject_id}>
                    <td>{item.subject_id}</td>
                    <td>{item.subject_name}</td>
                    {renderActions(item, "subject")}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Pagination Controls for Subjects */}
          {!collapsed["subject"] && (
            <Pagination
              currentPage={subjectPage}
              totalCount={subjects.length}
              pageSize={subjectPageSize}
              onPageChange={setSubjectPage}
            />
          )}
          {showModal.subject && (
            <AddSubjectModal
              onClose={() => setShowModal({})}
              onSuccess={fetchAll}
            />
          )}
        </section>

        <section className="data-section half-width">
          <div
            className="section-header"
            onClick={() => toggleCollapse("booktype")}
          >
            <h2>Book Types</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal({ booktype: true });
              }}
            >
              + Add
            </button>
          </div>
          {!collapsed["booktype"] && (
            <table>
              <thead>
                <tr>
                  <th>BOOK TYPE ID</th>
                  <th>BOOK TYPE TITLE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {bookTypes.map((item) => (
                  <tr key={item.book_type_id}>
                    <td>{item.book_type_id}</td>
                    <td>{item.book_type_title}</td>
                    {renderActions(item, "booktype")}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {showModal.booktype && (
            <AddBookTypeModal
              onClose={() => setShowModal({})}
              onSuccess={fetchAll}
            />
          )}
        </section>
      </div>

      {/* ✏️ Edit Modal for Country/Grade */}
      {showModal.edit && (
        <div className="edit-modal-overlay">
          <div className="edit-modal-content">
            <h3>Edit</h3>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="edit-input"
            />
            <div className="edit-button-group">
              <button onClick={handleEditSave}>Update</button>
              <button className="cancel-btn" onClick={() => setShowModal({})}>
                Cancel
              </button>
              {editItem && editType && (
                <button
                  className="delete-btn"
                  onClick={() => {
                    handleDelete(editItem, editType);
                    setShowModal({});
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🧾 Languages & Standards Section */}
      <div className="horizontal-sections">
        {[
          {
            title: "Standards",
            key: "standard",
            data: standards,
            columns: ["standard_id", "standard_name"],
            modal: (
              <AddStandardModal
                onClose={() => setShowModal({})}
                onSuccess={fetchAll}
              />
            ),
          },
          {
            title: "Languages",
            key: "language",
            data: languages,
            columns: ["language_id", "language_name"],
            extra: (item) =>
              countries.find((c) => c.country_id === item.country_id)
                ?.country_name || "Unknown",
            modal: (
              <AddLanguageModal
                onClose={() => setShowModal({})}
                onSuccess={fetchAll}
              />
            ),
          },
        ].map(({ title, key, data, columns, modal, extra }) => (
          <section className="data-section" key={key}>
            <div className="section-header" onClick={() => toggleCollapse(key)}>
              <h2>{title}</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal({ [key]: true });
                }}
              >
                + Add
              </button>
            </div>
            {!collapsed[key] && (
              <table>
                <thead>
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i}>{col.replace("_", " ").toUpperCase()}</th>
                    ))}
                    {extra && <th>Country</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item[columns[0]]}>
                      {columns.map((col, i) => (
                        <td key={i}>{item[col]}</td>
                      ))}
                      {extra && <td>{extra(item)}</td>}
                      {renderActions(item, key)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {showModal[key] && modal}
          </section>
        ))}
      </div>

      {/* Book Formats Section */}
      <section className="data-section">
        <BookFormats />
      </section>

      {/* Tags Section */}
      <section className="data-section">
        <Tags />
      </section>
    </div>
  );
};

export default ManageDataAdmin;