import React from 'react';

const SearchBar = ({ 
  searchTerm, 
  setSearchTerm,
  searchType,
  setSearchType,
  timezone,
  setTimezone
}) => {
  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchTerm(''); // Clear search term when changing type
  };

  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
  };

  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={
            searchType === 'date' 
              ? 'Enter date range (DD-MM-YYYY to DD-MM-YYYY)' 
              : 'Search by username or email'
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={searchType}
          onChange={handleSearchTypeChange}
          className="search-type-select"
        >
          <option value="all">Search All</option>
          <option value="user">Search Users</option>
          <option value="action">Search Actions</option>
          <option value="date">Search by Date</option>
        </select>
      </div>
      <div className="timezone-selector">
        <span className="timezone-label">Timezone:</span>
        <select
          value={timezone}
          onChange={handleTimezoneChange}
          className="timezone-select"
        >
          <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">EST (America/New_York)</option>
          <option value="Europe/London">GMT (Europe/London)</option>
          <option value="Asia/Dubai">UAE (Asia/Dubai)</option>
          <option value="Asia/Riyadh">Saudi Arabia (Asia/Riyadh)</option>
          <option value="Australia/Sydney">Australia/Sydney</option>
        </select>
      </div>
    </div>
  );
};

export default SearchBar;
