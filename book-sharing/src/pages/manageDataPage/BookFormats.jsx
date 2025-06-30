import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import { FaEdit, FaTrash, FaSave } from 'react-icons/fa'; // Import icons
import "../../styles/manageData_Css/BookFormats.css";

export default function BookFormats() {
  const [formats, setFormats] = useState([]);
  const [newFormat, setNewFormat] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchFormats = () => {
    axios.get('/api/book-formats', { headers })
      .then(res => setFormats(res.data))
      .catch(() => setFormats([]));
  };

  useEffect(() => {
    fetchFormats();
    // eslint-disable-next-line
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newFormat.trim()) return;
    axios.post('/api/book-formats', { format_name: newFormat }, { headers })
      .then(() => {
        setNewFormat('');
        setShowAddInput(false);
        fetchFormats();
      });
  };

  const startEdit = (id, name) => {
    setEditId(id);
    setEditValue(name);
  };

  const handleEditSave = (id) => {
    if (!editValue.trim()) return;
    axios.put(`/api/book-formats/${id}`, { format_name: editValue }, { headers })
      .then(() => {
        setEditId(null);
        setEditValue('');
        fetchFormats();
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this format?')) return;
    axios.delete(`/api/book-formats/${id}`, { headers })
      .then(() => fetchFormats());
  };

  return (
    <div className="data-section">
      <div className="data-header">
        <h2>Book Formats</h2>
        {!showAddInput && (
          <button className="add-btn" onClick={() => setShowAddInput(true)}>+ Add</button>
        )}
      </div>
      
      {showAddInput && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="edit-input"
            value={newFormat}
            onChange={e => setNewFormat(e.target.value)}
            placeholder="Enter new format name"
            autoFocus
          />
          <button type="submit" className="action-btn"><FaSave /></button>
          <button type="button" className="action-btn" onClick={() => { setShowAddInput(false); setNewFormat(''); }}>Cancel</button>
        </form>
      )}
      
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Format Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formats.map(format => (
            <tr key={format.format_id}>
              <td>{format.format_id}</td>
              <td>
                {editId === format.format_id ? (
                  <input
                    className="edit-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(format.format_id)}
                    onKeyDown={e => e.key === 'Enter' && handleEditSave(format.format_id)}
                    autoFocus
                  />
                ) : (
                  format.format_name
                )}
              </td>
              <td className="actions-cell">
                {editId === format.format_id ? (
                  <button className="action-btn" onClick={() => handleEditSave(format.format_id)}><FaSave /></button>
                ) : (
                  <>
                    <button className="action-btn" onClick={() => startEdit(format.format_id, format.format_name)}><FaEdit /></button>
                    <button className="action-btn" onClick={() => handleDelete(format.format_id)}><FaTrash /></button>
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