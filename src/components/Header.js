import React from 'react';

function Header({
  leagues,
  activeLeague,
  onLeagueChange,
  onOpenSyncModal,
  syncState,
  onQuickSync,
  serverOnline,
  currentSeason
}) {
  const isSyncingActive = syncState?.isSyncing && syncState?.leagueId === activeLeague;
  const isCurrent = currentSeason === 'current';
  const activeLeagueObj = leagues.find(l => l.id === activeLeague) || leagues[0];

  return (
    <header className="app-header">
      <div className="header-top-bar">
        <div className="brand-container">
          <div className="brand-logo-badge">
            <span className="logo-ball">⚽</span>
          </div>
          <div className="brand-text-block">
            <h1 className="brand-title">FOOTY ELO</h1>
            <span className="brand-tagline">Football Player Rating Engine</span>
          </div>
        </div>

        <div className="header-actions">
          <div className={`server-status-pill ${serverOnline ? 'online' : 'offline'}`} title={serverOnline ? "Backend service online" : "Backend offline - using cached data"}>
            <span className="status-indicator-dot"></span>
            <span className="status-text">{serverOnline ? 'Engine Online' : 'Cached Mode'}</span>
          </div>

          <button
            id="btn-quick-sync-league"
            className={`btn-header-sync ${isSyncingActive ? 'syncing' : ''}`}
            onClick={() => onQuickSync(activeLeague)}
            disabled={syncState?.isSyncing || !isCurrent || !serverOnline}
            title={!isCurrent ? "Sync only available for current season" : `Sync ${activeLeagueObj.name}`}
          >
            <span className={`sync-icon-spin ${isSyncingActive ? 'spinning' : ''}`}>
              {isSyncingActive ? '🔄' : '⚡'}
            </span>
            <span>
              {isSyncingActive 
                ? `Syncing (${syncState.percent}%)` 
                : `Sync ${activeLeagueObj.name}`}
            </span>
          </button>

          <button
            id="btn-open-sync-center"
            className="btn-header-manager"
            onClick={onOpenSyncModal}
            title="Open League Sync Center"
          >
            <span>⚙️</span>
            <span>Sync Center</span>
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
                <span className="league-nav-flag">{league.flag}</span>
                <span className="league-nav-title">{league.name}</span>
                {isActive && <span className="active-glow-indicator" />}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export default Header;