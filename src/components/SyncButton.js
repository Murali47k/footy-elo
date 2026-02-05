import React, { useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const LEAGUES = [
  { id: 'premier-league', name: 'Premier League', apiId: '47' },
  { id: 'la-liga', name: 'La Liga', apiId: '87' },
  { id: 'bundesliga', name: 'Bundesliga', apiId: '54' },
  { id: 'serie-a', name: 'Serie A', apiId: '55' },
  { id: 'ligue-1', name: 'Ligue 1', apiId: '53' }
];

function SyncButton({ lastSyncDate, onSyncComplete, currentSeason }) {
  const [syncing, setSyncing] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState({});

  const startSync = async () => {
    // Only allow sync for current season
    if (currentSeason !== 'current') {
      alert('Sync is only available for the current season');
      return;
    }

    setSyncing(true);
    setShowProgress(true);

    // Initialize progress
    const initialProgress = {};
    LEAGUES.forEach(league => {
      initialProgress[league.id] = { status: 'pending', message: 'Waiting...' };
    });
    setProgress(initialProgress);

    try {
      const response = await axios.post('http://localhost:5000/api/sync-all', {
        leagues: LEAGUES
      });

      // Simulate progress updates (in real implementation, use WebSockets or polling)
      for (const league of LEAGUES) {
        setProgress(prev => ({
          ...prev,
          [league.id]: { status: 'syncing', message: 'Syncing...' }
        }));

        await new Promise(resolve => setTimeout(resolve, 1000));

        setProgress(prev => ({
          ...prev,
          [league.id]: { status: 'complete', message: 'Complete' }
        }));
      }

      setTimeout(() => {
        setShowProgress(false);
        setSyncing(false);
        onSyncComplete();
      }, 1000);

    } catch (error) {
      console.error('Sync error:', error);
      
      LEAGUES.forEach(league => {
        setProgress(prev => ({
          ...prev,
          [league.id]: { status: 'error', message: 'Failed' }
        }));
      });

      setTimeout(() => {
        setShowProgress(false);
        setSyncing(false);
      }, 2000);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'syncing':
        return '🔄';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <>
      <div className="sync-container">
        <button 
          className="sync-btn" 
          onClick={startSync}
          disabled={syncing || currentSeason !== 'current'}
        >
          <span className={`sync-icon ${syncing ? 'spinning' : ''}`}>
            {syncing ? '🔄' : '🔄'}
          </span>
          {syncing ? 'Syncing...' : 'Sync Data'}
        </button>
        
        {lastSyncDate && !syncing && (
          <span className="last-sync">
            Last synced {formatDistanceToNow(lastSyncDate, { addSuffix: true })}
          </span>
        )}
      </div>

      {showProgress && (
        <>
          <div className="sync-overlay" onClick={() => !syncing && setShowProgress(false)} />
          <div className="sync-progress">
            <h3>Syncing Current Season</h3>
            {LEAGUES.map(league => (
              <div key={league.id} className="progress-item">
                <span className="progress-status">
                  {getStatusIcon(progress[league.id]?.status)}
                </span>
                <span className="progress-name">{league.name}</span>
                <span className={`progress-state ${progress[league.id]?.status}`}>
                  {progress[league.id]?.message}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default SyncButton;