import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';

function SyncModal({
  isOpen,
  onClose,
  leagues,
  metadata,
  syncState,
  onSyncLeague,
  currentSeason
}) {
  if (!isOpen) return null;

  const isCurrentSeason = currentSeason === 'current' || currentSeason === '2026-27';

  const formatLastUpdated = (isoString) => {
    if (!isoString) return 'Never updated';
    try {
      const date = new Date(isoString);
      return `${format(date, 'MMM d, yyyy • h:mm a')} (${formatDistanceToNow(date, { addSuffix: true })})`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">League Sync Center</h2>
            <p className="modal-subtitle">
              Sync live player statistics from FotMob & recompute ELO ratings for Current Season (2026/27)
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {!isCurrentSeason && (
          <div className="modal-alert-notice">
            Live syncing is only available for the <strong>Current Season (2026/27)</strong>. Historical seasons are static snapshots.
          </div>
        )}

        {syncState?.isSyncing && (
          <div className="live-sync-banner">
            <div className="live-sync-header">
              <span className="live-sync-spinner"></span>
              <span className="live-sync-title">
                Syncing {syncState.leagueName || 'League'}...
              </span>
              <span className="live-sync-percent">{syncState.percent}%</span>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, Math.max(0, syncState.percent))}%` }}
              />
            </div>
            <div className="live-sync-message">{syncState.message}</div>
          </div>
        )}

        <div className="sync-league-list">
          {leagues.map((league) => {
            const leagueMeta = metadata[league.id] || {};
            const isThisSyncing = syncState?.isSyncing && syncState?.leagueId === league.id;
            const hasError = syncState?.leagueId === league.id && syncState?.status === 'error';

            return (
              <div 
                key={league.id} 
                className={`sync-league-row ${isThisSyncing ? 'row-syncing' : ''}`}
              >
                <div className="sync-league-info">
                  <div className="sync-league-name-row">
                    {league.flag && <span className="sync-league-flag" style={{ marginRight: '6px' }}>{league.flag}</span>}
                    <span className="sync-league-name">{league.name}</span>
                    {leagueMeta.playerCount > 0 && (
                      <span className="sync-player-badge">
                        {leagueMeta.playerCount} players
                      </span>
                    )}
                  </div>
                  <div className="sync-league-meta-row">
                    <span className="meta-label">Last updated:</span>
                    <span className="meta-value">
                      {formatLastUpdated(leagueMeta.lastUpdated)}
                    </span>
                  </div>
                </div>

                <div className="sync-league-action">
                  <button
                    className={`btn-sync-action ${isThisSyncing ? 'loading' : ''} ${hasError ? 'error' : ''}`}
                    onClick={() => onSyncLeague(league.id)}
                    disabled={syncState?.isSyncing || !isCurrentSeason}
                  >
                    {isThisSyncing ? (
                      <>
                        <span className="button-spinner"></span>
                        <span>{syncState.percent}%</span>
                      </>
                    ) : hasError ? (
                      'Retry'
                    ) : (
                      'Sync'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <p className="modal-footer-hint">
            Each sync fetches FotMob per-90 metrics, calculates normalized ELO scores across positions, and refreshes the table instantly.
          </p>
          <button className="btn-modal-done" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SyncModal;
