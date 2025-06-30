import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/manageDeliverables/AddBook.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AddBookForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade_id: '',
    subject_id: '',
    language_id: '',
    standard_id: '',
    country_id: '',
    booktype_id: '',
    version_label: '',
    isbn_code: '',
    digital_file: null,
    print_file: null,
    digital_cover_file: null,
    print_cover_file: null,
    resource_file: null,
    zip_file: null,
  });

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [bookTypes, setBookTypes] = useState([]);
  const [standards, setStandards] = useState([]);
  const [countries, setCountries] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({
    version: 0,
    zip: 0,
    cover: 0,
    resource: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isbnError, setIsbnError] = useState('');
  const [versionError, setVersionError] = useState('');
  const [formats, setFormats] = useState([]);
  const [digitalFormatId, setDigitalFormatId] = useState('');
  const [printFormatId, setPrintFormatId] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('/api/grades', { headers }).then(res => setGrades(res.data));
    axios.get('/api/subjects', { headers }).then(res => setSubjects(res.data));
    axios.get('/api/languages', { headers }).then(res => setLanguages(res.data));
    axios.get('/api/booktypes', { headers }).then(res => setBookTypes(res.data));
    axios.get('/api/standards', { headers }).then(res => setStandards(res.data));
    axios.get('/api/countries', { headers }).then(res => setCountries(res.data));
    axios.get('/api/book-formats', { headers }).then(res => {
      setFormats(res.data);
      const digital = res.data.find(f => f.format_name.toLowerCase().includes('digital'));
      const print = res.data.find(f => f.format_name.toLowerCase().includes('print'));
      setDigitalFormatId(digital ? digital.format_id : '');
      setPrintFormatId(print ? print.format_id : '');
    });
    axios.get('/api/tags', { headers }).then(res => {
      setTags(res.data);
      setTagOptions(res.data.map(t => ({ tag_id: t.tag_id, tag_name: t.tag_name })));
    });
  }, []);

  useEffect(() => {
    if (uploadComplete) {
      setTimeout(() => {
        navigate('/admin/books');
      }, 1000); // Navigate after 1s to allow success message visibility
    }
  }, [uploadComplete, navigate]);

  const formatISBN = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format for ISBN-13: XXX-X-XXXXXX-XX-X
    return digits.replace(/(\d{3})(\d{1})(\d{6})(\d{2})(\d{1})?/, (_, a, b, c, d, e) => {
      if (!e) return `${a}-${b}-${c}-${d}`;
      return `${a}-${b}-${c}-${d}-${e}`;
    });
  };

  const validateISBN = (isbn) => {
    // Remove all non-digit characters
    const digits = isbn.replace(/\D/g, '');
    
    if (digits.length === 0) {
      setIsbnError('');
      return true;
    }

    // Check if it's a valid ISBN-13
    if (digits.length !== 13) {
      setIsbnError('ISBN must be 13 digits');
      return false;
    }

    // Validate ISBN-13 check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += (i % 2 === 0 ? 1 : 3) * parseInt(digits[i]);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    if (checkDigit !== parseInt(digits[12])) {
      setIsbnError('Invalid ISBN check digit');
      return false;
    }

    // Validate format (must start with 978 or 979)
    if (!digits.startsWith('978') && !digits.startsWith('979')) {
      setIsbnError('ISBN must start with 978 or 979');
      return false;
    }

    setIsbnError('');
    return true;
  };

  const formatVersion = (value) => {
    // Remove any characters that aren't numbers, dots, or 'v'
    const cleaned = value.replace(/[^v0-9.]/gi, '');
    
    // Ensure it starts with 'v' or 'V'
    if (!cleaned.toLowerCase().startsWith('v')) {
      return 'v' + cleaned;
    }
    
    return cleaned;
  };

  const validateVersion = (version) => {
    if (!version) {
      setVersionError('Version label is required');
      return false;
    }

    // Check if version starts with 'v' or 'V'
    if (!version.toLowerCase().startsWith('v')) {
      setVersionError('Version must start with "v"');
      return false;
    }

    // Check format: vX.Y.Z where X, Y, Z are numbers
    const versionRegex = /^v\d+(\.\d+){0,2}$/;
    if (!versionRegex.test(version)) {
      setVersionError('Invalid version format. Use format: v1.0 or v1.0.0');
      return false;
    }

    // Check if numbers are not too large
    const numbers = version.substring(1).split('.');
    for (const num of numbers) {
      if (parseInt(num) > 999) {
        setVersionError('Version numbers should not exceed 999');
        return false;
      }
    }

    setVersionError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (name === 'isbn_code') {
      const formattedISBN = formatISBN(value);
      setFormData(prev => ({ ...prev, [name]: formattedISBN }));
      validateISBN(formattedISBN);
    } else if (name === 'version_label') {
      const formattedVersion = formatVersion(value);
      setFormData(prev => ({ ...prev, [name]: formattedVersion }));
      validateVersion(formattedVersion);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormatChange = (e) => {
    setSelectedFormat(e.target.value);
  };

  // Tag input logic
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      const value = tagInput.trim();
      if (!value) return;
      // Check if tag already selected
      if (selectedTags.some(t => t.tag_name.toLowerCase() === value.toLowerCase())) {
        setTagInput('');
        return;
      }
      // Check if tag exists
      const existing = tagOptions.find(t => t.tag_name.toLowerCase() === value.toLowerCase());
      if (existing) {
        setSelectedTags([...selectedTags, existing]);
      } else {
        // New tag (no id yet)
        setSelectedTags([...selectedTags, { tag_id: null, tag_name: value }]);
      }
      setTagInput('');
    }
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.some(t => t.tag_id === tag.tag_id)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t.tag_id !== tag.tag_id && t.tag_name !== tag.tag_name));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ISBN and version before submission
    if (!validateISBN(formData.isbn_code) || !validateVersion(formData.version_label)) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({ version: 0, cover: 0, resource: 0 });
    setUploadComplete(false);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Create new tags if needed
      const newTags = selectedTags.filter(t => !t.tag_id);
      let newTagIds = [];
      for (const t of newTags) {
        const { data } = await axios.post('/api/tags', { tag_name: t.tag_name }, config);
        newTagIds.push(data.tag_id);
      }
      // All tag ids to send
      const tag_ids = [
        ...selectedTags.filter(t => t.tag_id).map(t => t.tag_id),
        ...newTagIds
      ];

      // Helper to create a book and upload its version and cover
      const createBookWithVersion = async (formatId, file, label) => {
        // 1. Create book
        const { data: book } = await axios.post('/api/books', {
          title: formData.title,
          description: formData.description,
          grade_id: formData.grade_id,
          subject_id: formData.subject_id,
          language_id: formData.language_id,
          standard_id: formData.standard_id,
          country_id: formData.country_id,
          booktype_id: formData.booktype_id,
          format_id: formatId,
          tag_ids,
        }, config);
        const book_id = book.book_id;
        // 2. Add version
        const versionForm = new FormData();
        versionForm.append('book_id', book_id);
        versionForm.append('version_label', formData.version_label);
        versionForm.append('isbn_code', formData.isbn_code);
        versionForm.append('version_file', file);
        if (formData.zip_file) {
          versionForm.append('zip_file', formData.zip_file);
        }
        await axios.post('/api/books/book-versions', versionForm, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(prev => ({ ...prev, version: percent }));
          }
        });
        // 3. Upload cover (optional, for each format)
        if (label === 'digital' && formData.digital_cover_file) {
          const coverForm = new FormData();
          coverForm.append('book_id', book_id);
          coverForm.append('file', formData.digital_cover_file);
          await axios.post('/api/books/covers', coverForm, {
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, cover: percent }));
            }
          });
        }
        if (label === 'print' && formData.print_cover_file) {
          const coverForm = new FormData();
          coverForm.append('book_id', book_id);
          coverForm.append('file', formData.print_cover_file);
          await axios.post('/api/books/covers', coverForm, {
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, cover: percent }));
            }
          });
        }
      };
      // Upload logic: digital and/or print
      const digitalFile = formData.digital_file;
      const printFile = formData.print_file;
      if (!digitalFile && !printFile) {
        alert('Please upload at least one version (digital or print)');
        setIsSubmitting(false);
        return;
      }
      if (digitalFile) {
        await createBookWithVersion(digitalFormatId, digitalFile, 'digital');
      }
      if (printFile) {
        await createBookWithVersion(printFormatId, printFile, 'print');
      }
      setUploadComplete(true);
    } catch (err) {
      console.error(err);
      alert('Error adding book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="enhanced-book-form">
      <button
        type="button"
        className="form-back-btn"
        onClick={() => navigate('/admin/books')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>
      <h2>Add New Book</h2>
      <div className="form-grid">
        <label className="full-width">
          Book Title:
          <input 
            type="text" 
            name="title" 
            placeholder="Enter Book Title" 
            onChange={handleChange} 
            required 
          />
        </label>

        <label className="full-width">
          Description111:
          <ReactQuill
            value={formData.description}
            onChange={value => setFormData(prev => ({ ...prev, description: value }))}
            theme="snow"
            placeholder="Enter Description"
            style={{ background: '#fff', borderRadius: 8, marginBottom: 8 }}
          />
        </label>

        <label>
          Grade:
          <select name="grade_id" onChange={handleChange} required>
            <option value="">-- Select Grade --</option>
            {grades.map(g => <option key={g.grade_id} value={g.grade_id}>{g.grade_level}</option>)}
          </select>
        </label>

        <label>
          Subject:
          <select name="subject_id" onChange={handleChange} required>
            <option value="">-- Select Subject --</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select>
        </label>

        <label>
          Language:
          <select name="language_id" onChange={handleChange} required>
            <option value="">-- Select Language --</option>
            {languages.map(l => <option key={l.language_id} value={l.language_id}>{l.language_name}</option>)}
          </select>
        </label>

        <label>
          Standard:
          <select name="standard_id" onChange={handleChange} required>
            <option value="">-- Select Standard --</option>
            {standards.map(st => <option key={st.standard_id} value={st.standard_id}>{st.standard_name}</option>)}
          </select>
        </label>

        <label>
          Country:
          <select name="country_id" onChange={handleChange} required>
            <option value="">-- Select Country --</option>
            {countries.map(c => <option key={c.country_id} value={c.country_id}>{c.country_name}</option>)}
          </select>
        </label>

        <label>
          Book Type:
          <select name="booktype_id" onChange={handleChange} required>
            <option value="">-- Select Book Type --</option>
            {bookTypes.map(bt => (
              <option key={bt.book_type_id} value={bt.book_type_id}>
                {bt.book_type_title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Version Label:
          <input
            type="text"
            name="version_label"
            placeholder="e.g., v1.0 or v1.0.0"
            value={formData.version_label}
            onChange={handleChange}
            maxLength={10}
          />
          {versionError && <span className="error-message">{versionError}</span>}
        </label>

        <label>
          ISBN Code:
          <input
            type="text"
            name="isbn_code"
            placeholder="e.g., 978-1-963843-03-3"
            value={formData.isbn_code}
            onChange={handleChange}
            maxLength={17}
          />
          {isbnError && <span className="error-message">{isbnError}</span>}
        </label>

        
        

        <label>
          Upload Digital Version (PDF):
          <input type="file" name="digital_file" accept="application/pdf" onChange={handleChange} />
        </label>
        <label>
          Upload Digital Cover (PDF):
          <input type="file" name="digital_cover_file" accept="application/pdf" onChange={handleChange} />
        </label>
        <label>
          Upload Print Version (PDF):
          <input type="file" name="print_file" accept="application/pdf" onChange={handleChange} />
        </label>
        <label>
          Upload Print Cover (PDF):
          <input type="file" name="print_cover_file" accept="application/pdf" onChange={handleChange} />
        </label>
        <label>
          Upload ZIP File (optional):
          <input type="file" name="zip_file" accept=".zip,application/zip,application/x-zip-compressed" onChange={handleChange} />
        </label>


        <label className="full-width">
          Tags:
          <div className="tag-input-container">
            <div className="tag-input-field-wrapper">
              <input
                type="text"
                placeholder="Add or select a tag"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                className="tag-input-field"
              />
              <button
                type="button"
                className="tag-input-add-btn"
                onClick={() => handleTagInputKeyDown({ key: 'Enter', preventDefault: () => {} })}
              >
                + Add
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {tagOptions.filter(t => t.tag_name.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.some(st => st.tag_id === t.tag_id)).length > 0 && (
              <div className="tag-suggestions-list">
                {tagOptions
                  .filter(t => t.tag_name.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.some(st => st.tag_id === t.tag_id))
                  .map(t => (
                    <div
                      key={t.tag_id}
                      className="tag-suggestion-item"
                      onClick={() => handleTagSelect(t)}
                    >
                      {t.tag_name}
                    </div>
                  ))}
              </div>
            )}

            {/* Selected Tags Area */}
            {selectedTags.length > 0 && (
                <div className="selected-tags-container">
                    {selectedTags.map(tag => (
                    <div key={tag.tag_id || tag.tag_name} className="selected-tag-pill">
                        <span>{tag.tag_name}</span>
                        <span className="remove-tag-btn" onClick={() => handleRemoveTag(tag)}>x</span>
                    </div>
                    ))}
                </div>
            )}
          </div>
        </label>
      </div>

      {isSubmitting && (
        <div className="upload-progress-section">
          <div>
            Version Upload: {uploadProgress.version}%
            <progress value={uploadProgress.version} max="100" />
          </div>
          {formData.digital_cover_file && (
            <div>
              Digital Cover Upload: {uploadProgress.cover}%
              <progress value={uploadProgress.cover} max="100" />
            </div>
          )}
          {formData.print_cover_file && (
            <div>
              Print Cover Upload: {uploadProgress.cover}%
              <progress value={uploadProgress.cover} max="100" />
            </div>
          )}
          {formData.zip_file && (
            <div>
              ZIP Upload: {uploadProgress.zip}%
              <progress value={uploadProgress.zip} max="100" />
            </div>
          )}
        </div>
      )}
      {uploadComplete && (
        <div className="success-message">
          Upload Complete! Your book was added successfully.
        </div>
      )}

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Uploading...' : 'Add Book'}
        </button>
      </div>
    </form>
  );
}