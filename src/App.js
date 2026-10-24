import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import LeagueTable from './components/LeagueTable';
import SyncModal from './components/SyncModal';
import EloMathModal from './components/EloMathModal';

export const LEAGUES = [
  { id: 'premier-league', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', filePrefix: 'pl', apiId: '47' },
  { id: 'la-liga', name: 'La Liga', flag: '🇪🇸', filePrefix: 'laliga', apiId: '87' },
  { id: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪', filePrefix: 'bundesliga', apiId: '54' },
  { id: 'serie-a', name: 'Serie A', flag: '🇮🇹', filePrefix: 'seriea', apiId: '55' },
  { id: 'ligue-1', name: 'Ligue 1', flag: '🇫🇷', filePrefix: 'ligue1', apiId: '53' },
  { id: 'champions-league', name: 'Champions League', flag: '⭐', filePrefix: 'cl', apiId: '42' },
  { id: 'europa-league', name: 'Europa League', flag: '🏆', filePrefix: 'el', apiId: '73' },
];

// All seasons with Player ELO data (from 2016/17 onwards, plus current 2026/27)
export const AVAILABLE_SEASONS = [
  { id: 'current', slug: '2026-27', fotmobSeason: '2026/2027', label: '2026/27 (Current Season)', isCurrent: true },
  { id: '2025-26', slug: '2025-26', fotmobSeason: '2025/2026', label: '2025/26' },
  { id: '2024-25', slug: '2024-25', fotmobSeason: '2024/2025', label: '2024/25' },
  { id: '2023-24', slug: '2023-24', fotmobSeason: '2023/2024', label: '2023/24' },
  { id: '2022-23', slug: '2022-23', fotmobSeason: '2022/2023', label: '2022/23' },
  { id: '2021-22', slug: '2021-22', fotmobSeason: '2021/2022', label: '2021/22' },
  { id: '2020-21', slug: '2020-21', fotmobSeason: '2020/2021', label: '2020/21' },
  { id: '2019-20', slug: '2019-20', fotmobSeason: '2019/2020', label: '2019/20' },
  { id: '2018-19', slug: '2018-19', fotmobSeason: '2018/2019', label: '2018/19' },
  { id: '2017-18', slug: '2017-18', fotmobSeason: '2017/2018', label: '2017/18' },
  { id: '2016-17', slug: '2016-17', fotmobSeason: '2016/2017', label: '2016/17' },
];

export const getPlayerEloFilePath = (filePrefix, seasonId) => {
  if (seasonId === 'current' || seasonId === '2026-27') {
    return `/elo_tables/${filePrefix}_elo.csv`;
  }
  // Map season slug to the underscore-separated filename
  const map = {
    '2025-26': '2025_2026',
    '2024-25': '2024_2025',
    '2023-24': '2023_2024',
    '2022-23': '2022_2023',
    '2021-22': '2021_2022',
    '2020-21': '2020_2021',
    '2019-20': '2019_2020',
    '2018-19': '2018_2019',
    '2017-18': '2017_2018',
    '2016-17': '2016_2017',
  };
  const suffix = map[seasonId] || seasonId.replace('-', '_');
  return `/elo_tables/${filePrefix}_elo_${suffix}.csv`;
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
      const eloVal = parseFloat(cols[5]);
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
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);

  // Real sync state tracked from backend SSE
  const [syncState, setSyncState] = useState({
    isSyncing: false,
    leagueId: null,
    leagueName: null,
    percent: 0,
    status: 'idle',
    message: ''
  });

  const activeSeasonObj = AVAILABLE_SEASONS.find(s => s.id === currentSeason) || AVAILABLE_SEASONS[0];
  const activeLeagueObj = LEAGUES.find(l => l.id === activeLeague) || LEAGUES[0];
  const activeLeagueMeta = metadata[activeLeague] || {};

  // Load player ELO ratings for a specific league + season
  const loadLeagueData = useCallback(async (leagueId, season = currentSeason) => {
    const leagueObj = LEAGUES.find(l => l.id === leagueId);
    if (!leagueObj) return;

    const filePath = getPlayerEloFilePath(leagueObj.filePrefix, season);

    try {
      const response = await fetch(`${filePath}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`CSV not found: ${filePath}`);
      }

      const text = await response.text();
      const data = parseCSV(text);
      data.sort((a, b) => b.elo - a.elo);

      setLeagueData(prev => ({
        ...prev,
        [`${leagueId}:${season}`]: data
      }));
    } catch (error) {
      console.warn(`Could not load ELO data for ${leagueId} (${season}):`, error.message);
      setLeagueData(prev => ({
        ...prev,
        [`${leagueId}:${season}`]: []
      }));
    }
  }, [currentSeason]);

  const loadAllLeagues = useCallback(() => {
    LEAGUES.forEach(league => {
      loadLeagueData(league.id, currentSeason);
    });
  }, [loadLeagueData, currentSeason]);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/metadata`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.metadata) {
          setMetadata(json.metadata);
          setServerOnline(true);
          return;
        }
      }
    } catch (e) {
      // Backend not running
    }

    try {
      const res = await fetch(`/elo_tables/sync_meta.json?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setMetadata(json);
      }
    } catch (e) {
      console.warn('Could not read fallback metadata:', e);
    }
    setServerOnline(false);
  }, []);

  const checkServerHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`, { signal: AbortSignal.timeout(2000) });
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAllLeagues();
    fetchMetadata();
    checkServerHealth();

    const healthInterval = setInterval(checkServerHealth, 15000);
    return () => clearInterval(healthInterval);
  }, [loadAllLeagues, fetchMetadata, checkServerHealth]);

  // When season changes, reload all leagues for global search
  useEffect(() => {
    loadAllLeagues();
  }, [currentSeason, loadAllLeagues]);

  // Triggered when user wants to sync a league (Current Season 2026/27 only)
  const handleSyncLeague = useCallback((leagueId) => {
    const leagueObj = LEAGUES.find(l => l.id === leagueId);
    if (!leagueObj) return;

    if (currentSeason !== 'current' && currentSeason !== '2026-27') {
      alert('Live syncing is only available for Current Season (2026/27). Historical seasons are static snapshots.');
      return;
    }

    setSyncState({
      isSyncing: true,
      leagueId: leagueId,
      leagueName: leagueObj.name,
      percent: 5,
      status: 'starting',
      message: `Connecting to ${leagueObj.name} data feed (2026/27)...`
    });

    const eventSource = new EventSource(`${BACKEND_URL}/api/sync/stream/${leagueId}?season=2026/2027`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        setSyncState(prev => ({
          ...prev,
          percent: data.percent ?? prev.percent,
          status: data.status ?? prev.status,
          message: data.message ?? prev.message
        }));

        if (data.status === 'complete') {
          eventSource.close();
          setTimeout(() => {
            loadLeagueData(leagueId, currentSeason);
            fetchMetadata();
            setSyncState({ isSyncing: false, leagueId: null, leagueName: null, percent: 0, status: 'idle', message: '' });
          }, 1200);
        } else if (data.status === 'error') {
          eventSource.close();
          setTimeout(() => {
            setSyncState({ isSyncing: false, leagueId: null, leagueName: null, percent: 0, status: 'idle', message: '' });
          }, 4000);
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream closed or encountered error:', err);
      eventSource.close();
      loadLeagueData(leagueId, currentSeason);
      fetchMetadata();
      setSyncState({ isSyncing: false, leagueId: null, leagueName: null, percent: 0, status: 'idle', message: '' });
    };
  }, [currentSeason, loadLeagueData, fetchMetadata]);

  // Global search across all loaded leagues
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (!term || !term.trim()) {
      setSearchResult(null);
      return;
    }

    const q = term.toLowerCase().trim();
    let bestMatch = null;
    let foundLeagueObj = null;

    for (const league of LEAGUES) {
      const key = `${league.id}:${currentSeason}`;
      const players = leagueData[key] || [];
      const match = players.find(p => p.name.toLowerCase().includes(q));
      if (match) {
        bestMatch = match;
        foundLeagueObj = league;
        break;
      }
    }

    if (bestMatch && foundLeagueObj) {
      setSearchResult({
        success: true,
        player: bestMatch,
        leagueId: foundLeagueObj.id,
        leagueName: foundLeagueObj.name
      });
      setActiveLeague(foundLeagueObj.id);
    } else {
      setSearchResult({
        success: false,
        notFound: true,
        query: term
      });
    }
  }, [currentSeason, leagueData]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
  };

  const currentData = leagueData[`${activeLeague}:${currentSeason}`] || [];

  return (
    <div className="app-container">
      <Header
        leagues={LEAGUES}
        activeLeague={activeLeague}
        onLeagueChange={(id) => { setActiveLeague(id); }}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenMathModal={() => setIsMathModalOpen(true)}
        syncState={syncState}
        serverOnline={serverOnline}
        currentSeason={currentSeason}
      />

      <main className="app-main-content">
        <SearchSection
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          onSearch={() => handleSearch(searchTerm)}
          onClearSearch={handleClearSearch}
          searchResult={searchResult}
        />

        <div className="main-dashboard-card">
          <div className="season-selector-bar">
            <div className="season-selector-left">
              <span className="league-indicator-title">
                {activeLeagueObj.flag && <span className="league-title-flag">{activeLeagueObj.flag}</span>}
                {activeLeagueObj.name}
              </span>
            </div>

            <div className="season-selector-controls">
              <label htmlFor="seasonSelect" className="season-select-label">
                Season:
              </label>
              <select
                id="seasonSelect"
                value={currentSeason}
                onChange={(e) => setCurrentSeason(e.target.value)}
                className="season-dropdown"
              >
                {AVAILABLE_SEASONS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <LeagueTable
            league={activeLeagueObj}
            data={currentData}
            isActive={true}
            lastUpdated={activeLeagueMeta.lastUpdated}
            currentSeason={currentSeason}
            seasonLabel={activeSeasonObj.label}
            onOpenMathModal={() => setIsMathModalOpen(true)}
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

      <EloMathModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
      />

      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-title">
            <strong>Footy ELO Rating Engine</strong> • Position-Normalized Player Ratings (2016/17 – 2026/27)
          </p>
          <p className="footer-sub">
            Europe's Top 5 Leagues, UEFA Champions League & Europa League • Competition-Specific Statistics • Powered by FotMob Opta feeds
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;