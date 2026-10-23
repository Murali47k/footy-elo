import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import LeagueTable from './components/LeagueTable';
import SyncModal from './components/SyncModal';

const LEAGUES = [
  { id: 'premier-league', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', filePrefix: 'pl', apiId: '47' },
  { id: 'la-liga', name: 'La Liga', flag: '🇪🇸', filePrefix: 'laliga', apiId: '87' },
  { id: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪', filePrefix: 'bundesliga', apiId: '54' },
  { id: 'serie-a', name: 'Serie A', flag: '🇮🇹', filePrefix: 'seriea', apiId: '55' },
  { id: 'ligue-1', name: 'Ligue 1', flag: '🇫🇷', filePrefix: 'ligue1', apiId: '53' }
];

const LEAGUE_FILES = {
  'premier-league': {
    'current': '/elo_tables/pl_elo.csv',
    '2024-25': '/elo_tables/pl_elo_2024_2025.csv'
  },
  'la-liga': {
    'current': '/elo_tables/laliga_elo.csv',
    '2024-25': '/elo_tables/laliga_elo_2024_2025.csv'
  },
  'bundesliga': {
    'current': '/elo_tables/bundesliga_elo.csv',
    '2024-25': '/elo_tables/bundesliga_elo_2024_2025.csv'
  },
  'serie-a': {
    'current': '/elo_tables/seriea_elo.csv',
    '2024-25': '/elo_tables/seriea_elo_2024_2025.csv'
  },
  'ligue-1': {
    'current': '/elo_tables/ligue1_elo.csv',
    '2024-25': '/elo_tables/ligue1_elo_2024_2025.csv'
  }
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const parseCSVRow = (row) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const parseCSV = (text) => {
  const rows = text.split('\n');
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row) continue;

    const cols = parseCSVRow(row);
    if (cols.length >= 4) {
      const eloVal = parseFloat(cols[3]);
      if (!isNaN(eloVal)) {
        data.push({
          name: cols[0].trim(),
          club: cols[1].trim(),
          position: cols[2].trim(),
          elo: eloVal
        });
      }
    }
  }
  return data;
};

function App() {
  const [activeLeague, setActiveLeague] = useState('premier-league');
  const [currentSeason, setCurrentSeason] = useState('current');
  const [leagueData, setLeagueData] = useState({});
  const [metadata, setMetadata] = useState({});
  const [serverOnline, setServerOnline] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Real sync state tracked from backend SSE
  const [syncState, setSyncState] = useState({
    isSyncing: false,
    leagueId: null,
    leagueName: null,
    percent: 0,
    status: 'idle',
    message: ''
  });

  const loadLeagueData = useCallback(async (leagueId, season = currentSeason) => {
    try {
      const filePath = LEAGUE_FILES[leagueId]?.[season];
      if (!filePath) return;

      // Add cache buster timestamp query to ensure fresh read after sync
      const response = await fetch(`${filePath}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`CSV not found for ${leagueId}`);
      }

      const text = await response.text();
      const data = parseCSV(text);
      data.sort((a, b) => b.elo - a.elo);

      setLeagueData(prev => ({
        ...prev,
        [leagueId]: data
      }));
    } catch (error) {
      console.warn(`Could not load data for ${leagueId}:`, error);
      setLeagueData(prev => ({
        ...prev,
        [leagueId]: prev[leagueId] || []
      }));
    }
  }, [currentSeason]);

  const loadAllLeagues = useCallback(() => {
    LEAGUES.forEach(league => {
      loadLeagueData(league.id);
    });
  }, [loadLeagueData]);

  const fetchMetadata = useCallback(async () => {
    // First try backend metadata endpoint
    try {
      const res = await fetch(`${BACKEND_URL}/api/metadata`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.metadata) {
          setMetadata(json.metadata);
          setServerOnline(true);
          return;
        }
      }
    } catch {
      // Backend unavailable, fallback to public file
    }

    // Fallback: static sync_meta.json in public folder
    try {
      const res = await fetch(`/elo_tables/sync_meta.json?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setMetadata(json);
      }
    } catch (e) {
      console.error('Error fetching fallback metadata:', e);
    }
  }, []);

  const checkServerStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`, { method: 'GET' });
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    }
  }, []);

  useEffect(() => {
    loadAllLeagues();
    fetchMetadata();
    checkServerStatus();

    const interval = setInterval(checkServerStatus, 15000);
    return () => clearInterval(interval);
  }, [loadAllLeagues, fetchMetadata, checkServerStatus]);

  // Handle per-league sync with real-time SSE progress
  const handleSyncLeague = (leagueId) => {
    const leagueObj = LEAGUES.find(l => l.id === leagueId);
    if (!leagueObj) return;

    if (syncState.isSyncing) {
      alert("A league synchronization is already in progress. Please wait for it to complete.");
      return;
    }

    setSyncState({
      isSyncing: true,
      leagueId,
      leagueName: leagueObj.name,
      percent: 2,
      status: 'starting',
      message: `Connecting to ${leagueObj.name} feed...`
    });

    // Connect to Server-Sent Events stream for real-time progress
    const eventSource = new EventSource(`${BACKEND_URL}/api/sync/stream/${leagueId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        setSyncState(prev => ({
          ...prev,
          percent: data.percent ?? prev.percent,
          status: data.status || prev.status,
          message: data.message || prev.message
        }));

        if (data.status === 'complete') {
          eventSource.close();
          setTimeout(() => {
            setSyncState({
              isSyncing: false,
              leagueId: null,
              leagueName: null,
              percent: 100,
              status: 'idle',
              message: ''
            });
            // Reload active league data & metadata
            loadLeagueData(leagueId);
            fetchMetadata();
          }, 1200);
        } else if (data.status === 'error') {
          eventSource.close();
          setTimeout(() => {
            setSyncState(prev => ({
              ...prev,
              isSyncing: false,
              status: 'error',
              message: data.message || 'Sync failed'
            }));
          }, 3000);
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
      setSyncState({
        isSyncing: false,
        leagueId,
        leagueName: leagueObj.name,
        percent: 100,
        status: 'error',
        message: 'Lost connection to backend server during sync'
      });
    };
  };

  // Search logic
  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setSearchResult(null);
      return;
    }

    let foundPlayer = null;
    let foundLeagueId = null;
    let foundLeagueRank = null;

    for (const [leagueId, players] of Object.entries(leagueData)) {
      const matchIndex = players.findIndex(p => p.name.toLowerCase().includes(term));
      if (matchIndex !== -1) {
        foundPlayer = players[matchIndex];
        foundLeagueId = leagueId;
        foundLeagueRank = matchIndex + 1;
        break;
      }
    }

    if (foundPlayer) {
      const leagueObj = LEAGUES.find(l => l.id === foundLeagueId) || { name: foundLeagueId, flag: '⚽' };
      setSearchResult({
        success: true,
        player: foundPlayer,
        leagueName: leagueObj.name,
        leagueFlag: leagueObj.flag,
        leagueRank: foundLeagueRank
      });
    } else {
      setSearchResult({
        success: false,
        term: searchTerm
      });
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
  };

  const activeLeagueObj = LEAGUES.find(l => l.id === activeLeague) || LEAGUES[0];
  const activeLeagueMeta = metadata[activeLeague] || {};

  return (
    <div className="App">
      <Header
        leagues={LEAGUES}
        activeLeague={activeLeague}
        onLeagueChange={setActiveLeague}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        syncState={syncState}
        onQuickSync={handleSyncLeague}
        serverOnline={serverOnline}
        currentSeason={currentSeason}
      />

      <main className="main-content-layout">
        <SearchSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          searchResult={searchResult}
          onClearSearch={handleClearSearch}
        />

        <div className="main-dashboard-card">
          <div className="season-selector-bar">
            <div className="season-selector-left">
              <span className="league-indicator-title">
                {activeLeagueObj.flag} {activeLeagueObj.name}
              </span>
            </div>

            <div className="season-selector-controls">
              <label htmlFor="seasonSelect" className="season-select-label">
                Season Database:
              </label>
              <select
                id="seasonSelect"
                value={currentSeason}
                onChange={(e) => setCurrentSeason(e.target.value)}
                className="season-dropdown"
              >
                <option value="current">Current Season (2025/26)</option>
                <option value="2024-25">Historical (2024/25)</option>
              </select>
            </div>
          </div>

          <LeagueTable
            league={activeLeagueObj}
            data={leagueData[activeLeague] || []}
            isActive={true}
            lastUpdated={activeLeagueMeta.lastUpdated}
            onSyncLeague={handleSyncLeague}
            syncState={syncState}
            currentSeason={currentSeason}
          />
        </div>
      </main>

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        leagues={LEAGUES}
        metadata={metadata}
        syncState={syncState}
        onSyncLeague={handleSyncLeague}
        currentSeason={currentSeason}
      />

      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-title">
            ⚽ <strong>Footy ELO Rating Engine</strong> • Positional ELO Algorithm with Normalized Stats
          </p>
          <p className="footer-sub">
            Powered by live FotMob statistics & position-weighted performance coefficients.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;