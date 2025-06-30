// components/BookFilterSidebar.jsx
import React from 'react';

const BookFilterSidebar = ({
  filters
}) => {
  const toggleSelection = (setter, selectedSet, id) => {
    const newSet = new Set(selectedSet);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setter(newSet);
  };

  return (
    <aside className="custom-filter-sidebar">
      <h3>Filters</h3>
      {filters.map(({ key, show, setShow, items, idKey, nameKey, selectedSet, setter }) => (
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
  );
};

export default BookFilterSidebar;
