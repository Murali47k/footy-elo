import React from 'react';

function Header({
  leagues,
  activeLeague,
  onLeagueChange,
  onOpenSyncModal,
  onOpenMathModal,
  syncState,
  serverOnline,
  currentSeason
}) {
  const isSyncing = syncState?.isSyncing;

  return (
    <header className="app-header">
      <div className="header-top-bar">
        <div className="brand-container">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div className="brand-text-block">
            <h1 className="brand-title">FOOTY ELO</h1>
            <span className="brand-tagline">Player Performance Ratings</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            id="btn-open-math-modal"
            className="btn-math-modal"
            onClick={onOpenMathModal}
            title="View ELO calculation formula & positional weights"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h4" />
            </svg>
            <span>Rating Math</span>
          </button>

          <div
            className={`server-status-pill ${serverOnline ? 'online' : 'offline'}`}
            title={serverOnline ? "Backend engine online" : "Using cached local datasets"}
          >
            <span className="status-indicator-dot"></span>
            <span className="status-text">{serverOnline ? 'Live Engine' : 'Cached Data'}</span>
          </div>

          <button
            id="btn-open-sync-center"
            className="btn-sync-center"
            onClick={onOpenSyncModal}
            title="Open League Sync Center"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSyncing ? "icon-spin" : ""}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{isSyncing ? `Syncing (${syncState.percent}%)` : 'Sync Center'}</span>
          </button>
        </div>
      </div>

      <nav className="league-nav-container" aria-label="League Selection">
        <div className="league-nav-track">
          {leagues.map((league) => {
            const isActive = activeLeague === league.id;
            return (
              <button
                key={league.id}
                id={`tab-${league.id}`}
                className={`league-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => onLeagueChange(league.id)}
              >
                {league.flag && <span className="league-nav-flag">{league.flag}</span>}
                <span className="league-nav-title">{league.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export default Header;