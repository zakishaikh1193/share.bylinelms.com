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
  // REMOVED: const [versions, setVersions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  // ... (state for selected filters remains the same)
  const [selectedGrades, setSelectedGrades] = useState(new Set());
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState(new Set());
  const [selectedStandards, setSelectedStandards] = useState(new Set());
  const [selectedBookTypes, setSelectedBookTypes] = useState(new Set());
  const [selectedVersions, setSelectedVersions] = useState(new Set()); // This is now for version LABELS (strings)
  const [selectedCountries, setSelectedCountries] = useState(new Set());

  // ... (state for showing/hiding filters remains the same)
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
          // REMOVED: versionsRes,
          countriesRes
        ] = await Promise.all([
          axios.get('/api/books', { headers }),
          axios.get('/api/grades', { headers }),
          axios.get('/api/subjects', { headers }),
          axios.get('/api/languages', { headers }),
          axios.get('/api/standards', { headers }),
          axios.get('/api/booktypes', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/countries', { headers }).catch(() => ({ data: [] }))
        ]);

        setBooks(booksRes.data.books || booksRes.data || []);
        setGrades(gradesRes.data || []);
        setSubjects(subjectsRes.data || []);
        setLanguages(languagesRes.data || []);
        setStandards(standardsRes.data || []);
        setBookTypes(bookTypesRes.data || []);
        setCountries(countriesRes.data || []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // NEW: Derive the unique versions from the books data
  const availableVersions = [...new Set(books.map(book => book.version_label).filter(Boolean))];

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
    const matchCountry = selectedCountries.size === 0 || (book.country_id && selectedCountries.has(book.country_id));

    return matchGrade && matchSubject && matchLanguage && matchStandard &&
      matchBookType && matchCountry;
  });

  if (loading) return <div className="loading">Loading books...</div>;

  return (
    <div className="books-list-container">
      <aside className="custom-filter-sidebar">
        <h3>Filters</h3>
        {[
          { key: 'Subjects', show: showSubjects, setShow: setShowSubjects, items: subjects, idKey: 'subject_id', nameKey: 'subject_name', selectedSet: selectedSubjects, setter: setSelectedSubjects },
          { key: 'Grades', show: showGrades, setShow: setShowGrades, items: grades, idKey: 'grade_id', nameKey: 'grade_level', selectedSet: selectedGrades, setter: setSelectedGrades },
          { key: 'Book Types', show: showBookTypes, setShow: setShowBookTypes, items: bookTypes, idKey: 'book_type_id', nameKey: 'book_type_title', selectedSet: selectedBookTypes, setter: setSelectedBookTypes },
          { key: 'Languages', show: showLanguages, setShow: setShowLanguages, items: languages, idKey: 'language_id', nameKey: 'language_name', selectedSet: selectedLanguages, setter: setSelectedLanguages },
          { key: 'Standards', show: showStandards, setShow: setShowStandards, items: standards, idKey: 'standard_id', nameKey: 'standard_name', selectedSet: selectedStandards, setter: setSelectedStandards },
          // UPDATED: The Versions filter now uses the derived list of version labels
          { key: 'Versions', show: showVersions, setShow: setShowVersions, items: availableVersions, selectedSet: selectedVersions, setter: setSelectedVersions },
          { key: 'Countries', show: showCountries, setShow: setShowCountries, items: countries, idKey: 'country_id', nameKey: 'country_name', selectedSet: selectedCountries, setter: setSelectedCountries },
        ].map(({ key, show, setShow, items, idKey, nameKey, selectedSet, setter }) => (
          <div key={key} className="filter-box" aria-expanded={show}>
            <div className="filter-title" onClick={() => setShow(!show)}>
              {key}
              <span className={`arrow ${show ? 'open' : ''}`}>▼</span>
            </div>
            {show && (
              <div className="filter-options">
                 {/* Special handling for the versions array of strings */}
                {key === 'Versions' ? items.map(item => (
                  <label key={item} className={selectedSet.has(item) ? 'selected' : ''}>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(item)}
                      onChange={() => toggleSelection(setter, selectedSet, item)}
                    />
                    {item}
                  </label>
                )) : items.map(item => (
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

      {/* The rest of the component remains the same, but we remove dependency on a separate versions array */}
      <main className="books-content">
        {/* ... main content ... */}
      </main>
    </div>
  );
};

export default BookCoverPage;