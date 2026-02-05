import React from 'react';
import SyncButton from './SyncButton';

function Header({ leagues, activeLeague, onLeagueChange, lastSyncDate, onSyncComplete, currentSeason }) {
  return (
    <div className="header">
      <div className="logo">Footy ELO</div>
      <nav className="navbar">
        <div className="nav-track">
          {leagues.map(league => (
            <button
              key={league.id}
              className={`nav-btn ${activeLeague === league.id ? 'active' : ''}`}
              onClick={() => onLeagueChange(league.id)}
            >
              {league.name}
            </button>
          ))}
        </div>
        
        <SyncButton 
          lastSyncDate={lastSyncDate}
          onSyncComplete={onSyncComplete}
          currentSeason={currentSeason}
        />
      </nav>
    </div>
  );
}

export default Header;