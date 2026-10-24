import React from 'react';

function SearchSection({
  searchTerm,
  onSearchChange,
  onSearch,
  searchResult,
  onClearSearch
}) {
  const handleTriggerSearch = () => {
    if (typeof onSearch === 'function') {
      onSearch();
    } else if (typeof onSearchChange === 'function') {
      onSearchChange(searchTerm);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTriggerSearch();
    }
  };

  const getPositionClass = (pos) => {
    switch (pos) {
      case 'GK': return 'pos-gk';
      case 'DEF': return 'pos-def';
      case 'MID': return 'pos-mid';
      case 'ATT': return 'pos-att';
      default: return 'pos-default';
    }
  };

  return (
    <div className="global-search-container">
      <div className="search-bar-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-lead-icon">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          id="global-player-search"
          type="text"
          className="search-main-input"
          placeholder="Global player scouting (e.g. Haaland, Mbappé, Bellingham, Saka...)"
          value={searchTerm || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {searchTerm && (
          <button
            className="search-clear-action"
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        <button id="btn-submit-search" className="search-submit-btn" onClick={handleTriggerSearch}>
          Scout Player
        </button>
      </div>

      {searchResult && (
        <div className={`scouting-result-card ${searchResult.success ? 'found' : 'not-found'}`}>
          <div className="scouting-card-header">
            <span className={`status-pill-dot ${searchResult.success ? 'found' : 'not-found'}`} />
            <span className="scouting-card-type">
              {searchResult.success ? 'Player Profile Found' : 'No Player Match'}
            </span>
          </div>

          {searchResult.success && searchResult.player ? (
            <div className="scouting-card-body">
              <div className="scouting-player-profile">
                <div className="scouting-name-block">
                  <h3 className="scouting-player-name">{searchResult.player.name}</h3>
                  <div className="scouting-tags-row">
                    <span className="scouting-club-tag">
                      {searchResult.player.club}
                    </span>
                    <span className={`position-badge ${getPositionClass(searchResult.player.position)}`}>
                      {searchResult.player.position}
                    </span>
                    {searchResult.leagueName && (
                      <span className="scouting-league-pill">
                        {searchResult.leagueName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="scouting-rating-box">
                  <div className="scouting-elo-number">
                    {Math.round(searchResult.player.elo)}
                  </div>
                  <div className="scouting-elo-label">ELO Rating</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="scouting-not-found-msg">
              <p>No player found matching "<strong>{searchResult.query || searchTerm}</strong>" in current databases.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchSection;