import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/manageDeliverables/AddBook.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function EditBookForm() {
  const navigate = useNavigate();
  const { bookId } = useParams();
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
    zip_file: null,
  });
  const [digitalBookId, setDigitalBookId] = useState(null);
  const [printBookId, setPrintBookId] = useState(null);
  const [digitalFormatId, setDigitalFormatId] = useState('');
  const [printFormatId, setPrintFormatId] = useState('');
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [bookTypes, setBookTypes] = useState([]);
  const [standards, setStandards] = useState([]);
  const [countries, setCountries] = useState([]);
  const [formats, setFormats] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]); // Array of {tag_id, tag_name}
  const [tagOptions, setTagOptions] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({
    version: 0,
    zip: 0,
    cover: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isbnError, setIsbnError] = useState('');
  const [versionError, setVersionError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        // 1. Fetch the current book details to get group key
        const { data: bookRes } = await axios.get(`/api/books/${bookId}/details`, { headers });
        const bookData = bookRes.book;
        if (!bookData) throw new Error('Book data not found');
        // 2. Fetch grouped books and find the group for this book
        const { data: groupedRes } = await axios.get('/api/books/grouped', { headers });
        // Find group by matching book_id to either digital or print
        const group = (groupedRes.books || []).find(g =>
          (g.digital && g.digital.book_id === bookData.book_id) ||
          (g.print && g.print.book_id === bookData.book_id)
        );
        if (!group) {
          console.error('No group found for book_id:', bookData.book_id, groupedRes.books);
          throw new Error('Grouped book not found');
        }
        setDigitalBookId(group.digital?.book_id || null);
        setPrintBookId(group.print?.book_id || null);
        // Use digital as primary, fallback to print
        const base = group.digital || group.print;
        setFormData({
          title: group.title || '',
          description: group.description || '',
          grade_id: group.grade_id || '',
          subject_id: group.subject_id || '',
          language_id: group.language_id || '',
          standard_id: group.standard_id || '',
          country_id: group.country_id || '',
          booktype_id: group.booktype_id || '',
          version_label: group.version_label || '',
          isbn_code: group.isbn_code || '',
          digital_file: null,
          print_file: null,
          digital_cover_file: null,
          print_cover_file: null,
          zip_file: null,
        });
        // ...fetch and set grades, subjects, etc. as before...
        const [gradesRes, subjectsRes, languagesRes, bookTypesRes, standardsRes, countriesRes, formatsRes, tagsRes] = await Promise.all([
          axios.get('/api/grades', { headers }),
          axios.get('/api/subjects', { headers }),
          axios.get('/api/languages', { headers }),
          axios.get('/api/booktypes', { headers }),
          axios.get('/api/standards', { headers }),
          axios.get('/api/countries', { headers }),
          axios.get('/api/book-formats', { headers }),
          axios.get('/api/tags', { headers }),
        ]);
        setGrades(gradesRes.data);
        setSubjects(subjectsRes.data);
        setLanguages(languagesRes.data);
        setBookTypes(bookTypesRes.data);
        setStandards(standardsRes.data);
        setCountries(countriesRes.data);
        setFormats(formatsRes.data);
        const digital = formatsRes.data.find(f => f.format_name.toLowerCase().includes('digital'));
        const print = formatsRes.data.find(f => f.format_name.toLowerCase().includes('print'));
        setDigitalFormatId(digital ? digital.format_id : '');
        setPrintFormatId(print ? print.format_id : '');
        setTags(tagsRes.data);
        setTagOptions(tagsRes.data.map(t => ({ tag_id: t.tag_id, tag_name: t.tag_name })));
        setSelectedFormat(base.format_id || '');
        setSelectedTags(base.tags || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.error || 'Failed to fetch book details');
        setLoading(false);
      }
    };
    fetchData();
  }, [bookId]);

  // --- Validation and Formatting Functions (No changes needed) ---
  const formatISBN = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{3})(\d{1})(\d{6})(\d{2})(\d{1})?/, (_, a, b, c, d, e) => {
      if (!e) return `${a}-${b}-${c}-${d}`;
      return `${a}-${b}-${c}-${d}-${e}`;
    });
  };

  const validateISBN = (isbn) => {
    const digits = isbn.replace(/\D/g, '');
    if (digits.length === 0) {
      setIsbnError('');
      return true;
    }
    if (digits.length !== 13) {
      setIsbnError('ISBN must be 13 digits');
      return false;
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += (i % 2 === 0 ? 1 : 3) * parseInt(digits[i]);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit !== parseInt(digits[12])) {
      setIsbnError('Invalid ISBN check digit');
      return false;
    }
    if (!digits.startsWith('978') && !digits.startsWith('979')) {
      setIsbnError('ISBN must start with 978 or 979');
      return false;
    }
    setIsbnError('');
    return true;
  };

  const formatVersion = (value) => {
    const cleaned = value.replace(/[^v0-9.]/gi, '');
    if (!cleaned.toLowerCase().startsWith('v')) return 'v' + cleaned;
    return cleaned;
  };

  const validateVersion = (version) => {
    if (!version) {
      setVersionError('Version label is required');
      return false;
    }
    if (!version.toLowerCase().startsWith('v')) {
      setVersionError('Version must start with "v"');
      return false;
    }
    const versionRegex = /^v\d+(\.\d+){0,2}$/;
    if (!versionRegex.test(version)) {
      setVersionError('Invalid version format. Use format: v1.0 or v1.0.0');
      return false;
    }
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
    setIsSubmitting(true);
    setUploadProgress({ version: 0, zip: 0, cover: 0 });
    setUploadComplete(false);
    setError(null);
    // ...validation as before...
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // ...tag logic as before...
      // Helper to update a book and upload its new version and cover
      const updateBookWithVersion = async (book_id, formatId, file, coverFile, label) => {
        await axios.put(`/api/books/update/${book_id}`, {
          title: formData.title,
          description: formData.description,
          grade_id: formData.grade_id,
          subject_id: formData.subject_id,
          language_id: formData.language_id,
          standard_id: formData.standard_id,
          country_id: formData.country_id,
          booktype_id: formData.booktype_id,
          isbn_code: formData.isbn_code,
          version_label: formData.version_label,
          format_id: formatId,
          tag_ids: selectedTags.map(t => t.tag_id || t.tag_name),
        }, config);
        // Always update version if a new PDF or ZIP is provided
        const { data: versionData } = await axios.get(`/api/books/${book_id}/versions`, config);
        const latestVersion = versionData.versions?.[0];
        if (!latestVersion) return;
        const versionId = latestVersion.version_id;
        const versionForm = new FormData();
        versionForm.append('book_id', book_id);
        versionForm.append('version_label', formData.version_label);
        versionForm.append('isbn_code', formData.isbn_code);
        if (file) {
          versionForm.append('version_file', file);
        }
        if (formData.zip_file) {
          versionForm.append('zip_file', formData.zip_file);
        }
        if (file || formData.zip_file) {
          await axios.put(`/api/books/book-versions/${versionId}`, versionForm, {
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, version: percent }));
            }
          });
        }
        // 4. Update cover if a new cover file is provided
        if (coverFile) {
          const coverForm = new FormData();
          coverForm.append('book_id', book_id);
          coverForm.append('file', coverFile);
          await axios.put(`/api/books/covers/${book_id}`, coverForm, {
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, cover: percent }));
            }
          });
        }
      };
      // Update both digital and print records with the same metadata
      if (digitalBookId) {
        await updateBookWithVersion(digitalBookId, digitalFormatId, formData.digital_file, formData.digital_cover_file, 'digital');
      }
      if (printBookId) {
        await updateBookWithVersion(printBookId, printFormatId, formData.print_file, formData.print_cover_file, 'print');
      }
      setUploadComplete(true);
      setTimeout(() => {
        navigate('/admin/books');
      }, 1000);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.response?.data?.error || 'Error updating book');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="books-table-loading">Loading book details...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <form onSubmit={handleSubmit} className="enhanced-book-form">
      <button
        type="button"
        className="form-back-btn"
        onClick={() => navigate('/admin/books')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <h2>Edit Book</h2>
      <div className="form-grid">
        <label>
          Book Title:
          <input type="text" name="title" value={formData.title} placeholder="Enter Book Title" onChange={handleChange} required/>
        </label>

        <label className="full-width">
          Description:
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
          <select name="grade_id" value={formData.grade_id} onChange={handleChange} required>
            <option value="">-- Select Grade --</option>
            {grades.map(g => <option key={g.grade_id} value={g.grade_id}>{g.grade_level}</option>)}
          </select>
        </label>

        <label>
          Subject:
          <select name="subject_id" value={formData.subject_id} onChange={handleChange} required>
            <option value="">-- Select Subject --</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select>
        </label>

        <label>
          Language:
          <select name="language_id" value={formData.language_id} onChange={handleChange} required>
            <option value="">-- Select Language --</option>
            {languages.map(l => <option key={l.language_id} value={l.language_id}>{l.language_name}</option>)}
          </select>
        </label>

        <label>
          Standard:
          <select name="standard_id" value={formData.standard_id} onChange={handleChange} required>
            <option value="">-- Select Standard --</option>
            {standards.map(st => <option key={st.standard_id} value={st.standard_id}>{st.standard_name}</option>)}
          </select>
        </label>

        <label>
          Country:
          <select name="country_id" value={formData.country_id} onChange={handleChange} required>
            <option value="">-- Select Country --</option>
            {countries.map(c => <option key={c.country_id} value={c.country_id}>{c.country_name}</option>)}
          </select>
        </label>

        <label>
          Book Type:
          <select name="booktype_id" value={formData.booktype_id} onChange={handleChange} required>
            <option value="">-- Select Book Type --</option>
            {bookTypes.map(bt => <option key={bt.book_type_id} value={bt.book_type_id}>{bt.book_type_title}</option>)}
          </select>
        </label>

        <label>
          Version Label:
          <input type="text" name="version_label" value={formData.version_label} placeholder="e.g. v1.0, Revised Edition" onChange={handleChange} required/>
          {versionError && <span className="error-message">{versionError}</span>}
        </label>

        <label>
          ISBN Code:
          <input type="text" name="isbn_code" value={formData.isbn_code} placeholder="Enter ISBN Code" onChange={handleChange} maxLength={17}/>
          {isbnError && <span className="error-message">{isbnError}</span>}
        </label>

        <label>
          Upload New Digital Version (PDF):
          <input type="file" name="digital_file" accept="application/pdf" onChange={handleChange}/>
        </label>

        <label>
          Upload New Digital Cover (PDF):
          <input type="file" name="digital_cover_file" accept="application/pdf" onChange={handleChange}/>
        </label>

        <label>
          Upload New Print Version (PDF):
          <input type="file" name="print_file" accept="application/pdf" onChange={handleChange}/>
        </label>

        <label>
          Upload New Print Cover (PDF):
          <input type="file" name="print_cover_file" accept="application/pdf" onChange={handleChange}/>
        </label>

        <label>
          Upload New ZIP File:
          <input type="file" name="zip_file" accept=".zip,application/zip,application/x-zip-compressed" onChange={handleChange}/>
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

      <button type="submit" className="submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Book'}
      </button>

      {isSubmitting && (
        <div className="upload-progress-section">
          {formData.digital_file && (
            <div>
              Digital Version Upload: {uploadProgress.version}%
              <progress value={uploadProgress.version} max="100" />
            </div>
          )}
          {formData.print_file && (
            <div>
              Print Version Upload: {uploadProgress.version}%
              <progress value={uploadProgress.version} max="100" />
            </div>
          )}
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
          Book updated successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}
    </form>
  );
}