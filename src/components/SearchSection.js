import React from 'react';

function SearchSection({
  searchTerm,
  onSearchChange,
  onSearch,
  searchResult,
  onClearSearch
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
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
        <span className="search-lead-icon">🔍</span>
        <input
          id="global-player-search"
          type="text"
          className="search-main-input"
          placeholder="Global player scouting (e.g. Haaland, Mbappé, Bellingham, Saka...)"
          value={searchTerm}
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
        <button id="btn-submit-search" className="search-submit-btn" onClick={onSearch}>
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

          {searchResult.success ? (
            <div className="scouting-card-body">
              <div className="scouting-player-profile">
                <div className="scouting-name-block">
                  <h3 className="scouting-player-name">{searchResult.player.name}</h3>
                  <div className="scouting-tags-row">
                    <span className="scouting-club-tag">
                      🏟️ {searchResult.player.club}
                    </span>
                    <span className={`position-badge ${getPositionClass(searchResult.player.position)}`}>
                      {searchResult.player.position}
                    </span>
                    <span className="scouting-league-tag">
                      {searchResult.leagueFlag} {searchResult.leagueName}
                    </span>
                    {searchResult.leagueRank && (
                      <span className="scouting-rank-tag">
                        Rank #{searchResult.leagueRank} in League
                      </span>
                    )}
                  </div>
                </div>

                <div className="scouting-elo-score-box">
                  <span className="scouting-elo-number">
                    {Math.round(searchResult.player.elo)}
                  </span>
                  <span className="scouting-elo-sub">ELO RATING</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="scouting-not-found-body">
              <p>
                No player record found matching <strong>"{searchResult.term}"</strong> across current league databases.
              </p>
              <span className="scouting-hint">
                Tip: Try searching by last name (e.g., "Rodri", "Saka", "Musiala")
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchSection;