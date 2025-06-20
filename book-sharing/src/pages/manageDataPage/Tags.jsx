import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import { FaEdit, FaTrash, FaSave } from 'react-icons/fa'; // Import icons
import "../../styles/manageData_Css/BookFormats.css";

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');

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

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    axios.post('/api/tags', { tag_name: newTag }, { headers })
      .then(() => {
        setNewTag('');
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
        <button className="add-btn">+ Add</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tag Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tags.map(tag => (
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
    </div>
  );
}