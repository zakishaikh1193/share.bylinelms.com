import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/manageDeliverables/AddBook.css';

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
    version_file: null,
    cover_file: null,
    zip_file: null,
    // resource_file has been removed
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
    // resource progress has been removed
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

        // Fetch all the necessary data in parallel
        const [bookRes, gradesRes, subjectsRes, languagesRes, bookTypesRes, standardsRes, countriesRes] =
          await Promise.all([
            axios.get(`/api/books/${bookId}/details`, { headers }),
            axios.get('/api/grades', { headers }),
            axios.get('/api/subjects', { headers }),
            axios.get('/api/languages', { headers }),
            axios.get('/api/booktypes', { headers }),
            axios.get('/api/standards', { headers }),
            axios.get('/api/countries', { headers }),
          ]);

        // Set the form data with the book details
        const bookData = bookRes.data.book;
        if (!bookData) {
          throw new Error('Book data not found');
        }

        const { data: versionsRes } = await axios.get(`/api/books/${bookId}/versions`, { headers });
        const latestVersion = versionsRes.versions?.[0];

        setFormData({
          title: bookData.title || '',
          description: bookData.description || '',
          grade_id: bookData.grade_id || '',
          subject_id: bookData.subject_id || '',
          language_id: bookData.language_id || '',
          standard_id: bookData.standard_id || '',
          country_id: bookData.country_id || '',
          booktype_id: bookData.booktype_id || '',
          version_label: latestVersion?.version_label || '',
          isbn_code: latestVersion?.isbn_code || '',
          version_file: null,
          cover_file: null,
          zip_file: null,
        });

        // Set all the dropdown options
        setGrades(gradesRes.data);
        setSubjects(subjectsRes.data);
        setLanguages(languagesRes.data);
        setBookTypes(bookTypesRes.data);
        setStandards(standardsRes.data);
        setCountries(countriesRes.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress({ version: 0, zip: 0, cover: 0 }); // Cleaned up progress state
    setUploadComplete(false);
    setError(null);

    // Re-validate on submit
    const isIsbnValid = validateISBN(formData.isbn_code);
    const isVersionValid = validateVersion(formData.version_label);
    if (!isIsbnValid || !isVersionValid) {
        setIsSubmitting(false);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Update book details first
      await axios.put(`/api/books/update/${bookId}`, {
        title: formData.title,
        description: formData.description,
        grade_id: formData.grade_id,
        subject_id: formData.subject_id,
        language_id: formData.language_id,
        standard_id: formData.standard_id,
        country_id: formData.country_id,
        booktype_id: formData.booktype_id,
        isbn_code: formData.isbn_code,
        version_label: formData.version_label
      }, config);

      // 2. Update version if a new version file is provided
      if (formData.version_file) {
        const versionForm = new FormData();
        versionForm.append('book_id', bookId);
        versionForm.append('version_label', formData.version_label);
        versionForm.append('isbn_code', formData.isbn_code);
        versionForm.append('version_file', formData.version_file);
        if (formData.zip_file) {
          versionForm.append('zip_file', formData.zip_file);
        }

        const { data } = await axios.get(`/api/books/${bookId}/versions`, config);
        const latestVersion = data.versions?.[0];
        if (!latestVersion) {
            throw new Error('No existing version found to update. Cannot upload new version file.');
        }

        const versionId = latestVersion.version_id;
        await axios.put(`/api/books/book-versions/${versionId}`, versionForm, {
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, version: percent }));
            }
        });
      }

      // 3. Update cover if a new cover file is provided
      if (formData.cover_file) {
        const coverForm = new FormData();
        coverForm.append('book_id', bookId);
        coverForm.append('file', formData.cover_file);
        await axios.put(`/api/books/covers/${bookId}`, coverForm, {
            headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(prev => ({ ...prev, cover: percent }));
            }
        });
      }

      // 4. Resource file logic has been removed entirely.

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
          <textarea name="description" value={formData.description} placeholder="Enter Description" onChange={handleChange}/>
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
          Upload New Version File (PDF):
          <input type="file" name="version_file" accept="application/pdf" onChange={handleChange}/>
        </label>

        <label>
          Upload New ZIP File (optional):
          <input type="file" name="zip_file" accept=".zip,application/zip,application/x-zip-compressed" onChange={handleChange}/>
        </label>

        <label>
          Upload New Cover PDF:
          <input type="file" name="cover_file" accept="application/pdf" onChange={handleChange}/>
        </label>

        {/* Resource File Input Removed */}
      </div>

      <button type="submit" className="submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Book'}
      </button>

      {isSubmitting && (
        <div className="upload-progress-section">
          {formData.version_file && (
            <div>
              Version Upload: {uploadProgress.version}%
              <progress value={uploadProgress.version} max="100" />
            </div>
          )}
          {formData.cover_file && (
            <div>
              Cover Upload: {uploadProgress.cover}%
              <progress value={uploadProgress.cover} max="100" />
            </div>
          )}
          {/* Resource Progress Bar Removed */}
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