import React from 'react';

function SearchSection({ searchTerm, onSearchChange, onSearch, searchResult }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="search-section">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search player (e.g. Kobel, Mbappé)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="search-btn" onClick={onSearch}>
          Search
        </button>
      </div>

      {searchResult && (
        <div className={`search-card ${searchResult.success ? 'success' : 'error'}`}>
          <div className="search-header">
            <span className={`status-dot ${searchResult.success ? 'success' : 'error'}`}></span>
            <h3>{searchResult.success ? 'Player Found' : 'Player Not Found'}</h3>
          </div>

          {searchResult.success ? (
            <>
              <div className="player-main">
                <div className="player-name">{searchResult.player.name}</div>
                <div className="player-elo">
                  {searchResult.player.elo.toFixed(0)}
                  <span>ELO</span>
                </div>
              </div>

              <div className="player-tags">
                <span className="tag">{searchResult.player.club}</span>
                <span className="tag">{searchResult.player.position}</span>
                <span className="tag">{searchResult.leagueName}</span>
              </div>
            </>
          ) : (
            <p className="error-text">
              No player matching <strong>"{searchResult.term}"</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchSection;