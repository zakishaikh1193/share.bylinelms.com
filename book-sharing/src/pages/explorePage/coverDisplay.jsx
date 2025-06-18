import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import '../../styles/explorePageCss/coverDisplay.css';

const BookCoverPage = () => {
  const [books, setBooks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [standards, setStandards] = useState([]);
  const [bookTypes, setBookTypes] = useState([]);
  const [versions, setVersions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedGrades, setSelectedGrades] = useState(new Set());
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState(new Set());
  const [selectedStandards, setSelectedStandards] = useState(new Set());
  const [selectedBookTypes, setSelectedBookTypes] = useState(new Set());
  const [selectedVersions, setSelectedVersions] = useState(new Set());
  const [selectedCountries, setSelectedCountries] = useState(new Set());

  const [showGrades, setShowGrades] = useState(true);
  const [showSubjects, setShowSubjects] = useState(true);
  const [showLanguages, setShowLanguages] = useState(true);
  const [showStandards, setShowStandards] = useState(true);
  const [showBookTypes, setShowBookTypes] = useState(true);
  const [showVersions, setShowVersions] = useState(true);
  const [showCountries, setShowCountries] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [
          booksRes,
          gradesRes,
          subjectsRes,
          languagesRes,
          standardsRes,
          bookTypesRes,
          versionsRes,
          countriesRes
        ] = await Promise.all([
          axios.get('/api/books', { headers }),
          axios.get('/api/grades', { headers }),
          axios.get('/api/subjects', { headers }),
          axios.get('/api/languages', { headers }),
          axios.get('/api/standards', { headers }),
          axios.get('/api/booktypes', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/versions', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/countries', { headers }).catch(() => ({ data: [] }))
        ]);

        setBooks(booksRes.data.books || booksRes.data || []);
        setGrades(gradesRes.data || []);
        setSubjects(subjectsRes.data || []);
        setLanguages(languagesRes.data || []);
        setStandards(standardsRes.data || []);
        setBookTypes(bookTypesRes.data || []);
        setVersions(versionsRes.data || []);
        setCountries(countriesRes.data || []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleSelection = (setter, selectedSet, id) => {
    const newSet = new Set(selectedSet);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setter(newSet);
  };

  const filteredBooks = books.filter(book => {
    const matchGrade = selectedGrades.size === 0 || selectedGrades.has(book.grade_id);
    const matchSubject = selectedSubjects.size === 0 || selectedSubjects.has(book.subject_id);
    const matchLanguage = selectedLanguages.size === 0 || selectedLanguages.has(book.language_id);
    const matchStandard = selectedStandards.size === 0 || selectedStandards.has(book.standard_id);
    const matchBookType = selectedBookTypes.size === 0 || (book.booktype_id && selectedBookTypes.has(book.booktype_id));
    const matchVersion = selectedVersions.size === 0 || (book.version_id && selectedVersions.has(book.version_id));
    const matchCountry = selectedCountries.size === 0 || (book.country_id && selectedCountries.has(book.country_id));

    return matchGrade && matchSubject && matchLanguage && matchStandard &&
      matchBookType && matchVersion && matchCountry;
  });

  if (loading) return <div className="loading">Loading books...</div>;

  return (
    <div className="books-list-container">
      <aside className="custom-filter-sidebar">
        <h3>Filters</h3>
        {[
          { key: 'Subjects', show: showSubjects, setShow: setShowSubjects, items: subjects, idKey: 'subject_id', nameKey: 'subject_name', selectedSet: selectedSubjects, setter: setSelectedSubjects },
          { key: 'Grades', show: showGrades, setShow: setShowGrades, items: grades, idKey: 'grade_id', nameKey: 'grade_level', selectedSet: selectedGrades, setter: setSelectedGrades },
          ...(bookTypes.length > 0 ? [{ key: 'Book Types', show: showBookTypes, setShow: setShowBookTypes, items: bookTypes, idKey: 'book_type_id', nameKey: 'book_type_title', selectedSet: selectedBookTypes, setter: setSelectedBookTypes }] : []),
          { key: 'Languages', show: showLanguages, setShow: setShowLanguages, items: languages, idKey: 'language_id', nameKey: 'language_name', selectedSet: selectedLanguages, setter: setSelectedLanguages },
          { key: 'Standards', show: showStandards, setShow: setShowStandards, items: standards, idKey: 'standard_id', nameKey: 'standard_name', selectedSet: selectedStandards, setter: setSelectedStandards },
          ...(versions.length > 0 ? [{ key: 'Versions', show: showVersions, setShow: setShowVersions, items: versions, idKey: 'version_id', nameKey: 'version_name', selectedSet: selectedVersions, setter: setSelectedVersions }] : []),
          ...(countries.length > 0 ? [{ key: 'Countries', show: showCountries, setShow: setShowCountries, items: countries, idKey: 'country_id', nameKey: 'country_name', selectedSet: selectedCountries, setter: setSelectedCountries }] : []),
        ].map(({ key, show, setShow, items, idKey, nameKey, selectedSet, setter }) => (
          <div key={key} className="filter-box" aria-expanded={show}>
            <div className="filter-title" onClick={() => setShow(!show)}>
              {key}
              <span className={`arrow ${show ? 'open' : ''}`}>▼</span>
            </div>
            {show && (
              <div className="filter-options">
                {items.map(item => (
                  <label key={item[idKey]} className={selectedSet.has(item[idKey]) ? 'selected' : ''}>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(item[idKey])}
                      onChange={() => toggleSelection(setter, selectedSet, item[idKey])}
                    />
                    {item[nameKey]}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>

      <main className="books-content">
        <h2>Covers</h2>
        {filteredBooks.length === 0 ? (
          <p>No books match the selected filters.</p>
        ) : (
          <div className="books-grid">
            {filteredBooks.map(book => (
              <article className="book-card" key={book.book_id}>
                <img
                  src={
                    book.coverUrl
                      ? `${axios.defaults.baseURL}/${book.coverUrl.replace(
                          /^.*\/uploads\//,
                          "uploads/"
                        )}`
                      : "https://mckups.com/wp-content/uploads/2021/04/isometric-view-torn-book-cover-mockup-Graphics-9752611-1-1-scaled.jpeg"
                  }
                  alt={book.title}
                  className="book-cover-image"
                />
                <div className="book-details">
                  <h4 className="book-title">{book.title}</h4>
                  <div className="book-info-container">
                    {[
                      { label: 'Country', value: countries.find(c => c.country_id === book.country_id)?.country_name || book.country_name || '—' },
                      { label: 'ISBN', value: book.isbn_code || '—' },
                      { label: 'Book Type', value: bookTypes.find(bt => bt.book_type_id === book.booktype_id)?.book_type_title || book.book_type_title || '—' },
                      { label: 'Language', value: languages.find(l => l.language_id === book.language_id)?.language_name || '—' },
                      { label: 'Grade', value: grades.find(g => g.grade_id === book.grade_id)?.grade_level || '—' },
                      { label: 'Subject', value: subjects.find(s => s.subject_id === book.subject_id)?.subject_name || '—' },
                      { label: 'Standard', value: standards.find(st => st.standard_id === book.standard_id)?.standard_name || '—' },
                      { label: 'Version', value: versions.find(v => v.version_id === book.version_id)?.version_name || book.version_name || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="book-info">
                        <span className="info-label">{label}:</span>
                        <span className="info-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookCoverPage;