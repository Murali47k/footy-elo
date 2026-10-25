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

          <a
            id="btn-github-repo"
            href="https://github.com/Murali47k/footy-elo"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-github-link"
            title="View source on GitHub (Murali47k/footy-elo)"
            aria-label="GitHub Repository"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>
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