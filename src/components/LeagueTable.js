import React, { useState, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

// Broad category map for tabs
const POSITION_CATEGORIES = {
  'ATT': ['ATT', 'ST', 'CF', 'RW', 'LW', 'RF', 'LF'],
  'MID': ['MID', 'CDM', 'CM', 'CAM', 'RAM', 'LAM', 'RM', 'LM'],
  'DEF': ['DEF', 'CB', 'RB', 'LB', 'RWB', 'LWB'],
  'GK': ['GK']
};

function LeagueTable({
  league,
  data,
  isActive,
  lastUpdated,
  currentSeason,
  seasonLabel,
  onOpenMathModal
}) {
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [displayLimit, setDisplayLimit] = useState(25);
  const [sortBy, setSortBy] = useState('elo-desc');

  const isCurrentSeason = currentSeason === 'current' || currentSeason === '2026-27';

  const formatUpdateDate = (dateStr) => {
    if (!dateStr) return 'Not available';
    try {
      const d = new Date(dateStr);
      return `${format(d, 'MMM d, yyyy • h:mm a')} (${formatDistanceToNow(d, { addSuffix: true })})`;
    } catch {
      return dateStr;
    }
  };

  // Filter and sort players
  const filteredData = useMemo(() => {
    let result = [...data];

    // Position filter
    if (selectedPosition !== 'ALL') {
      const allowed = POSITION_CATEGORIES[selectedPosition] || [selectedPosition];
      result = result.filter(p => allowed.includes(p.position) || p.position === selectedPosition);
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
    if (pos === 'GK') return 'pos-gk';
    if (['DEF', 'CB', 'RB', 'LB', 'RWB', 'LWB'].includes(pos)) return 'pos-def';
    if (['MID', 'CDM', 'CM', 'CAM', 'RAM', 'LAM', 'RM', 'LM'].includes(pos)) return 'pos-mid';
    if (['ATT', 'ST', 'CF', 'RW', 'LW', 'RF', 'LF'].includes(pos)) return 'pos-att';
    return 'pos-default';
  };

  if (!isActive) return null;

  return (
    <div id={`league-panel-${league.id}`} className="league-content-panel active">
      {/* Chart Banner with Metadata */}
      <div className="chart-header-card">
        <div className="chart-header-left">
          <div className="chart-title-line">
            <h2 className="chart-title">{league.name} Player Ratings</h2>
            <span className="season-badge">
              {seasonLabel || (isCurrentSeason ? '2026/27 Current' : currentSeason)}
            </span>
          </div>

          <div className="chart-last-updated-row">
            <span className="update-label">Last updated:</span>
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
      </div>

      {/* League-Specific Scope Notice */}
      <div className="league-scope-callout">
        <div className="scope-callout-content">
          <span className="scope-callout-title">Competition-Specific Ratings:</span>
          <span>
            Stats and ELO scores are calculated exclusively from <strong>{league.name}</strong> fixtures for {seasonLabel || (isCurrentSeason ? '2026/27' : currentSeason)}. Ratings are independent per competition and are not aggregated across domestic leagues or other European tournaments.
          </span>
        </div>
        {onOpenMathModal && (
          <button
            type="button"
            className="btn-table-math-link"
            onClick={onOpenMathModal}
            title="View exact ELO formula and positional weights"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h4" />
            </svg>
            <span>Rating Math</span>
          </button>
        )}
      </div>

      {/* Top 3 Leaders Section */}
      {data.length >= 3 && selectedPosition === 'ALL' && !tableSearch && (
        <div className="leaders-section">
          <div className="leaders-heading">
            <span className="leaders-heading-title">Top Rated Players</span>
            <span className="leaders-heading-sub">{seasonLabel || currentSeason}</span>
          </div>
          <div className="leaders-grid">
            {top3.map((player, idx) => {
              const rankLabels = ['#1', '#2', '#3'];
              const leaderClasses = ['rank-first', 'rank-second', 'rank-third'];
              const tier = getTierInfo(player.elo);

              return (
                <div key={idx} className={`leader-card ${leaderClasses[idx]}`}>
                  <div className="leader-card-header">
                    <span className="leader-rank-badge">{rankLabels[idx]}</span>
                    <span className={`tier-badge ${tier.className}`}>
                      {tier.label}
                    </span>
                  </div>

                  <div className="leader-player-name">{player.name}</div>
                  <div className="leader-club">{player.club}</div>

                  <div className="leader-card-footer">
                    <span className={`position-badge ${getPositionClass(player.position)}`}>
                      {player.position}
                    </span>
                    <div className="leader-elo-display">
                      <span className="leader-elo-score">{Math.round(player.elo)}</span>
                      <span className="leader-elo-unit">ELO</span>
                    </div>
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
            { id: 'ATT', label: 'Forward' },
            { id: 'MID', label: 'Midfield' },
            { id: 'DEF', label: 'Defense' },
            { id: 'GK', label: 'Goalkeeper' }
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-inline-icon">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
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
            <div className="empty-spinner"></div>
            <p>Loading {league.name} player ratings for <strong>{seasonLabel || currentSeason}</strong>...</p>
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="table-empty-state">
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
                <th className="th-position">Position</th>
                <th className="th-tier">Tier</th>
                <th className="th-elo">ELO Rating</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((player, index) => {
                const rank = index + 1;
                const tier = getTierInfo(player.elo);
                const pct = Math.min(100, Math.max(15, ((player.elo - 1400) / (maxElo - 1400)) * 100));

                return (
                  <tr key={`${player.name}-${player.club}-${index}`} className="table-row">
                    <td className="td-rank">
                      <span className={`rank-number ${rank <= 3 ? `top-${rank}` : ''}`}>
                        {rank}
                      </span>
                    </td>
                    <td className="td-player">
                      <span className="player-name-bold">{player.name}</span>
                    </td>
                    <td className="td-club">
                      <span className="club-name-text">{player.club}</span>
                    </td>
                    <td className="td-position">
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
                      <div className="elo-cell-content">
                        <span className="elo-value-num">{Math.round(player.elo)}</span>
                        <div className="elo-bar-track" title={`ELO: ${Math.round(player.elo)}`}>
                          <div
                            className={`elo-bar-fill ${tier.className}`}
                            style={{ width: `${pct}%` }}
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

      {data.length > 0 && (
        <div className="table-footer-meta">
          <span>
            Showing {displayedRows.length} of {filteredData.length} players ({data.length} total)
          </span>
          <span className="rating-scale-hint">
            Scale: 1700+ World Class • 1600+ Elite • 1500+ Pro • &lt;1500 Solid
          </span>
          {onOpenMathModal && (
            <button
              type="button"
              className="btn-footer-math-hint"
              onClick={onOpenMathModal}
            >
              How ELO is calculated ➔
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default LeagueTable;