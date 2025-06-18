// import React, { useState } from 'react';
// import '../../styles/manageDeliverables/covers.css';
 
// const Cover = () => {
//   const initialMockCovers = [
//     {
//       id: 1,
//       type: 'Digital',
//       title: 'Introduction to AI',
//       description: 'Digital Cover for AI book',
//       imageURL: 'https://via.placeholder.com/210x297?text=Digital+AI',
//     },
//     {
//       id: 2,
//       type: 'Print',
//       title: 'Mathematics Volume 1',
//       description: 'Print edition for Math curriculum',
//       imageURL: 'https://via.placeholder.com/210x297?text=Print+Maths',
//     },
//     {
//       id: 3,
//       type: 'Digital',
//       title: 'Web Development Essentials',
//       description: 'Complete guide for web dev beginners',
//       imageURL: 'https://via.placeholder.com/210x297?text=Digital+WebDev',
//     },
//     {
//       id: 4,
//       type: 'Print',
//       title: 'Science Explorer',
//       description: 'Grade-level science print cover',
//       imageURL: 'https://via.placeholder.com/210x297?text=Print+Science',
//     },
//   ];
 
//   const [covers, setCovers] = useState(initialMockCovers);
//   const [filterType, setFilterType] = useState('All');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showForm, setShowForm] = useState(false);
//   const [formData, setFormData] = useState({
//     type: 'Digital',
//     title: '',
//     description: '',
//     imageURL: '',
//     file: null,
//   });
 
//   const [selectedCover, setSelectedCover] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
 
//   const handleAddCover = () => {
//     setShowForm(true);
//   };
 
//   const handleFormChange = (e) => {
//     const { name, value, files } = e.target;
//     if (name === 'file') {
//       const file = files[0];
//       if (file) {
//         const imageURL = URL.createObjectURL(file);
//         setFormData({ ...formData, file, imageURL });
//       }
//     } else {
//       setFormData({ ...formData, [name]: value });
//     }
//   };
 
//   const handleFormSubmit = (e) => {
//     e.preventDefault();
//     const newCover = {
//       id: covers.length + 1,
//       type: formData.type,
//       title: formData.title,
//       description: formData.description,
//       imageURL: formData.imageURL,
//     };
//     setCovers([newCover, ...covers]);
//     setFormData({ type: 'Digital', title: '', description: '', imageURL: '', file: null });
//     setShowForm(false);
//   };
 
//   const handleReadMore = (cover) => {
//     setSelectedCover(cover);
//     setIsEditing(false);
//   };
 
//   const handleEditChange = (e) => {
//     const { name, value, files } = e.target;
//     if (name === 'file') {
//       const file = files[0];
//       if (file) {
//         const imageURL = URL.createObjectURL(file);
//         setSelectedCover({ ...selectedCover, imageURL });
//       }
//     } else {
//       setSelectedCover({ ...selectedCover, [name]: value });
//     }
//   };
 
//   const handleUpdateCover = () => {
//     const updatedList = covers.map((c) => (c.id === selectedCover.id ? selectedCover : c));
//     setCovers(updatedList);
//     setIsEditing(false);
//   };
 
//   const filteredCovers = covers.filter((cover) => {
//     const matchType = filterType === 'All' || cover.type === filterType;
//     const matchSearch = cover.title.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchType && matchSearch;
//   });
 
//   return (
//     <div className="cover-full-wrapper">
//       <div className="cover-header">
//         <h2>Book Cover Gallery</h2>
//         <div className="header-actions">
//           <button className="add-cover-btn" onClick={handleAddCover}>+ Add Cover</button>
//           <input
//             type="text"
//             placeholder="Search by title..."
//             className="search-input"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//           <select
//             value={filterType}
//             onChange={(e) => setFilterType(e.target.value)}
//             className="filter-select"
//           >
//             <option value="All">All</option>
//             <option value="Digital">Digital</option>
//             <option value="Print">Print</option>
//           </select>
//         </div>
//       </div>
 
//       {showForm && (
//         <form className="cover-form" onSubmit={handleFormSubmit}>
//           <div className="form-group">
//             <label>Type:</label>
//             <select name="type" value={formData.type} onChange={handleFormChange}>
//               <option value="Digital">Digital</option>
//               <option value="Print">Print</option>
//             </select>
//           </div>
//           <div className="form-group">
//             <label>Title:</label>
//             <input type="text" name="title" value={formData.title} onChange={handleFormChange} required />
//           </div>
//           <div className="form-group">
//             <label>Description:</label>
//             <textarea name="description" value={formData.description} onChange={handleFormChange} required />
//           </div>
//           <div className="form-group">
//             <label>Upload Cover Image:</label>
//             <input type="file" name="file" accept="image/*" onChange={handleFormChange} required />
//           </div>
//           {formData.imageURL && (
//             <div className="preview-container">
//               <img src={formData.imageURL} alt="Preview" />
//             </div>
//           )}
//           <button type="submit" className="submit-btn">Upload</button>
//         </form>
//       )}
 
//       <div className="cover-grid">
//         {filteredCovers.map((cover) => (
//           <div key={cover.id} className="cover-card">
//             <div className="badge-wrapper">
//               <span className={`badge ${cover.type.toLowerCase()}`}>{cover.type} Cover</span>
//             </div>
//             <img src={cover.imageURL} alt={cover.title} />
//             <div className="card-text">
//               <strong>{cover.title}</strong>
//               <p>{cover.description}</p>
//               <button className="read-more-btn" onClick={() => handleReadMore(cover)}>Read More</button>
//             </div>
//           </div>
//         ))}
//       </div>
 
//       {selectedCover && (
//         <div className="modal-overlay" onClick={() => setSelectedCover(null)}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <h3>{isEditing ? 'Edit Cover' : selectedCover.title}</h3>
//             {isEditing ? (
//               <>
//                 <input type="text" name="title" value={selectedCover.title} onChange={handleEditChange} />
//                 <textarea name="description" value={selectedCover.description} onChange={handleEditChange} />
//                 <select name="type" value={selectedCover.type} onChange={handleEditChange}>
//                   <option value="Digital">Digital</option>
//                   <option value="Print">Print</option>
//                 </select>
//                 <input type="file" name="file" onChange={handleEditChange} />
//                 {selectedCover.imageURL && (
//                   <img src={selectedCover.imageURL} alt="Preview" className="modal-img" />
//                 )}
//                 <button onClick={handleUpdateCover} className="submit-btn">Save Changes</button>
//               </>
//             ) : (
//               <>
//                 <img src={selectedCover.imageURL} alt={selectedCover.title} className="modal-img" />
//                 <p><strong>Type:</strong> {selectedCover.type}</p>
//                 <p><strong>Description:</strong> {selectedCover.description}</p>
//                 <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
//               </>
//             )}
//             <button className="close-btn" onClick={() => setSelectedCover(null)}>Close</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
 
// export default Cover;

import React from 'react'

function covers() {
  return (
    <div>covers</div>
  )
}

export default covers