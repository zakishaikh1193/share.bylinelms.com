import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import { FaEdit, FaTrash, FaSave } from 'react-icons/fa'; // Import icons
import "../../styles/manageData_Css/BookFormats.css";
import Pagination from '../../components/common/Pagination';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchTags = () => {
    axios.get('/api/tags', { headers })
      .then(res => setTags(res.data))
      .catch(() => setTags([]));
  };

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line
  }, []);

  // Reset to first page if tags change and current page is out of range
  useEffect(() => {
    const totalPages = Math.ceil(tags.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [tags, currentPage]);

  // Pagination logic
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedTags = tags.slice(startIdx, endIdx);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    axios.post('/api/tags', { tag_name: newTag }, { headers })
      .then(() => {
        setNewTag('');
        setShowAddInput(false);
        fetchTags();
      });
  };

  const startEdit = (id, name) => {
    setEditId(id);
    setEditValue(name);
  };

  const handleEditSave = (id) => {
    if (!editValue.trim()) return;
    axios.put(`/api/tags/${id}`, { tag_name: editValue }, { headers })
      .then(() => {
        setEditId(null);
        setEditValue('');
        fetchTags();
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    axios.delete(`/api/tags/${id}`, { headers })
      .then(() => fetchTags());
  };

  return (
    <div className="data-section">
      <div className="data-header">
        <h2>Tags</h2>
        {!showAddInput && (
          <button className="add-btn" onClick={() => setShowAddInput(true)}>+ Add</button>
        )}
      </div>

      {showAddInput && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="edit-input"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            placeholder="Enter new tag name"
            autoFocus
          />
          <button type="submit" className="action-btn"><FaSave /></button>
          <button type="button" className="action-btn" onClick={() => { setShowAddInput(false); setNewTag(''); }}>Cancel</button>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tag Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTags.map(tag => (
            <tr key={tag.tag_id}>
              <td>{tag.tag_id}</td>
              <td>
                {editId === tag.tag_id ? (
                  <input
                    className="edit-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(tag.tag_id)}
                    onKeyDown={e => e.key === 'Enter' && handleEditSave(tag.tag_id)}
                    autoFocus
                  />
                ) : (
                  tag.tag_name
                )}
              </td>
              <td className="actions-cell">
                {editId === tag.tag_id ? (
                  <button className="action-btn" onClick={() => handleEditSave(tag.tag_id)}><FaSave /></button>
                ) : (
                  <>
                    <button className="action-btn" onClick={() => startEdit(tag.tag_id, tag.tag_name)}><FaEdit /></button>
                    <button className="action-btn" onClick={() => handleDelete(tag.tag_id)}><FaTrash /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalCount={tags.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}