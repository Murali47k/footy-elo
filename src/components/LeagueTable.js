import React, { useState, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

function LeagueTable({
  league,
  data,
  isActive,
  lastUpdated,
  onSyncLeague,
  syncState,
  currentSeason
}) {
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [displayLimit, setDisplayLimit] = useState(25);
  const [sortBy, setSortBy] = useState('elo-desc');

  const isCurrentSeason = currentSeason === 'current';
  const isSyncing = syncState?.isSyncing && syncState?.leagueId === league.id;

  const formatUpdateDate = (dateStr) => {
    if (!dateStr) return 'Not available';
    try {
      const d = new Date(dateStr);
      return `${format(d, 'MMMM d, yyyy • h:mm a')} (${formatDistanceToNow(d, { addSuffix: true })})`;
    } catch {
      return dateStr;
    }
  };

  // Filter and sort players
  const filteredData = useMemo(() => {
    let result = [...data];

    // Position filter
    if (selectedPosition !== 'ALL') {
      result = result.filter(p => p.position === selectedPosition);
    }

    // Table search filter
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'elo-desc') {
      result.sort((a, b) => b.elo - a.elo);
    } else if (sortBy === 'elo-asc') {
      result.sort((a, b) => a.elo - b.elo);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'club-asc') {
      result.sort((a, b) => a.club.localeCompare(b.club));
    }

    return result;
  }, [data, selectedPosition, tableSearch, sortBy]);

  const displayedRows = displayLimit === 'ALL' ? filteredData : filteredData.slice(0, displayLimit);
  const top3 = useMemo(() => data.slice(0, 3), [data]);
  const maxElo = data.length > 0 ? Math.max(...data.map(p => p.elo)) : 1800;

  const getTierInfo = (elo) => {
    if (elo >= 1700) return { label: 'World Class', className: 'tier-worldclass' };
    if (elo >= 1600) return { label: 'Elite', className: 'tier-elite' };
    if (elo >= 1500) return { label: 'Pro', className: 'tier-pro' };
    return { label: 'Solid', className: 'tier-solid' };
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

  if (!isActive) return null;

  return (
    <div id={`league-panel-${league.id}`} className="league-content-panel active">
      {/* Chart Banner with Last Updated timestamp */}
      <div className="chart-header-card">
        <div className="chart-header-left">
          <div className="chart-title-line">
            <span className="chart-flag">{league.flag}</span>
            <h2 className="chart-title">{league.name} Player Ratings</h2>
            <span className="season-badge">
              {currentSeason === 'current' ? '2025/26 Current' : '2024/25 Historic'}
            </span>
          </div>

          <div className="chart-last-updated-row">
            <span className="update-calendar-icon">📅</span>
            <span className="update-label">Chart Last Updated:</span>
            <span className="update-timestamp-highlight">
              {formatUpdateDate(lastUpdated)}
            </span>
            {data.length > 0 && (
              <span className="total-players-pill">
                {data.length} Players Rated
              </span>
            )}
          </div>
        </div>

        <div className="chart-header-right">
          <button
            id={`btn-sync-chart-${league.id}`}
            className={`btn-chart-sync ${isSyncing ? 'loading' : ''}`}
            onClick={() => onSyncLeague(league.id)}
            disabled={isSyncing || !isCurrentSeason}
            title={!isCurrentSeason ? "Sync only available for current season" : `Update ${league.name} data`}
          >
            <span className={`sync-spin-icon ${isSyncing ? 'spinning' : ''}`}>
              {isSyncing ? '🔄' : '⚡'}
            </span>
            <span>
              {isSyncing ? `Updating (${syncState.percent}%)` : 'Sync This League'}
            </span>
          </button>
        </div>
      </div>

      {/* Real-time Inline Progress Bar when syncing this league */}
      {isSyncing && (
        <div className="inline-progress-card">
          <div className="inline-progress-top">
            <span className="inline-step-text">
              <strong>Updating {league.name}:</strong> {syncState.message}
            </span>
            <span className="inline-percent-badge">{syncState.percent}%</span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${syncState.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {data.length >= 3 && selectedPosition === 'ALL' && !tableSearch && (
        <div className="podium-section">
          <div className="podium-heading">
            <span>🏆</span> League Leaders Podium
          </div>
          <div className="podium-grid">
            {top3.map((player, idx) => {
              const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
              const podiumClasses = ['podium-gold', 'podium-silver', 'podium-bronze'];
              const tier = getTierInfo(player.elo);

              return (
                <div key={idx} className={`podium-card ${podiumClasses[idx]}`}>
                  <div className="podium-medal">{medals[idx]}</div>
                  <div className="podium-player-name">{player.name}</div>
                  <div className="podium-club">{player.club}</div>
                  <div className="podium-meta">
                    <span className={`position-badge ${getPositionClass(player.position)}`}>
                      {player.position}
                    </span>
                    <span className={`tier-badge ${tier.className}`}>
                      {tier.label}
                    </span>
                  </div>
                  <div className="podium-elo-display">
                    <span className="podium-elo-score">{Math.round(player.elo)}</span>
                    <span className="podium-elo-unit">ELO</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="table-controls-bar">
        <div className="position-filter-tabs">
          {[
            { id: 'ALL', label: 'All Positions' },
            { id: 'ATT', label: 'Forward (ATT)' },
            { id: 'MID', label: 'Midfield (MID)' },
            { id: 'DEF', label: 'Defense (DEF)' },
            { id: 'GK', label: 'Goalkeeper (GK)' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`pos-tab-btn ${selectedPosition === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedPosition(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="table-search-and-limits">
          <div className="table-quick-search">
            <span className="search-inline-icon">🔍</span>
            <input
              type="text"
              placeholder="Filter players or clubs..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="table-search-input"
            />
            {tableSearch && (
              <button className="clear-search-btn" onClick={() => setTableSearch('')}>
                ✕
              </button>
            )}
          </div>

          <div className="limit-selector-group">
            <span className="selector-label">Show:</span>
            <select
              value={displayLimit}
              onChange={(e) => setDisplayLimit(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="limit-dropdown"
            >
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
              <option value="ALL">All Players</option>
            </select>
          </div>

          <div className="sort-selector-group">
            <span className="selector-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="limit-dropdown"
            >
              <option value="elo-desc">Highest ELO</option>
              <option value="elo-asc">Lowest ELO</option>
              <option value="name-asc">Player Name (A-Z)</option>
              <option value="club-asc">Club (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-responsive-container">
        {data.length === 0 ? (
          <div className="table-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Loading {league.name} data...</p>
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="table-empty-state">
            <span className="empty-icon">🔍</span>
            <p>No players matched your filter criteria.</p>
            <button 
              className="btn-reset-filters" 
              onClick={() => { setSelectedPosition('ALL'); setTableSearch(''); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <table className="elo-data-table">
            <thead>
              <tr>
                <th className="th-rank">#</th>
                <th className="th-player">Player</th>
                <th className="th-club">Club</th>
                <th className="th-pos">Position</th>
                <th className="th-tier">Rating Tier</th>
                <th className="th-elo">ELO Rating</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((player, index) => {
                const tier = getTierInfo(player.elo);
                const eloPercentage = Math.min(100, Math.max(10, ((player.elo - 800) / (maxElo - 800)) * 100));

                return (
                  <tr key={`${player.name}-${player.club}-${index}`} className="table-row-item">
                    <td className="td-rank">
                      {index === 0 && <span className="rank-badge gold">1</span>}
                      {index === 1 && <span className="rank-badge silver">2</span>}
                      {index === 2 && <span className="rank-badge bronze">3</span>}
                      {index > 2 && <span className="rank-number">{index + 1}</span>}
                    </td>

                    <td className="td-player">
                      <div className="player-cell">
                        <strong className="player-title">{player.name}</strong>
                      </div>
                    </td>

                    <td className="td-club">
                      <span className="club-tag">{player.club}</span>
                    </td>

                    <td className="td-pos">
                      <span className={`position-badge ${getPositionClass(player.position)}`}>
                        {player.position}
                      </span>
                    </td>

                    <td className="td-tier">
                      <span className={`tier-badge ${tier.className}`}>
                        {tier.label}
                      </span>
                    </td>

                    <td className="td-elo">
                      <div className="elo-bar-cell">
                        <span className="elo-value">{Math.round(player.elo)}</span>
                        <div className="elo-mini-bar">
                          <div 
                            className="elo-mini-fill" 
                            style={{ width: `${eloPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="table-footer-summary">
        Showing <strong>{displayedRows.length}</strong> of <strong>{filteredData.length}</strong> players
        {selectedPosition !== 'ALL' && ` in position ${selectedPosition}`}
      </div>
    </div>
  );
}

export default LeagueTable;