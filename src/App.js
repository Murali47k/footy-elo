import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import LeagueTable from './components/LeagueTable';

const LEAGUES = [
  { id: 'premier-league', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', apiId: '47' },
  { id: 'la-liga', name: 'La Liga', flag: '🇪🇸', apiId: '87' },
  { id: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪', apiId: '54' },
  { id: 'serie-a', name: 'Serie A', flag: '🇮🇹', apiId: '55' },
  { id: 'ligue-1', name: 'Ligue 1', flag: '🇫🇷', apiId: '53' }
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

function App() {
  const [activeLeague, setActiveLeague] = useState('premier-league');
  const [currentSeason, setCurrentSeason] = useState('current');
  const [leagueData, setLeagueData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [lastSyncDate, setLastSyncDate] = useState(new Date()); // Initialize with today

  useEffect(() => {
    loadAllLeagues();
  }, [currentSeason]);

  const loadAllLeagues = () => {
    LEAGUES.forEach(league => {
      loadLeagueData(league.id);
    });
  };

  const loadLeagueData = async (leagueId) => {
    try {
      const filePath = LEAGUE_FILES[leagueId][currentSeason];
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error('CSV not found');
      }

      const text = await response.text();
      const data = parseCSV(text);
      data.sort((a, b) => b.elo - a.elo);

      setLeagueData(prev => ({
        ...prev,
        [leagueId]: data
      }));
    } catch (error) {
      console.error(`Error loading ${leagueId}:`, error);
      setLeagueData(prev => ({
        ...prev,
        [leagueId]: []
      }));
    }
  };

  const parseCSV = (text) => {
    const rows = text.split('\n');
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue;

      const cols = parseCSVRow(row);
      if (cols.length >= 4) {
        data.push({
          name: cols[0].trim(),
          club: cols[1].trim(),
          position: cols[2].trim(),
          elo: parseFloat(cols[3])
        });
      }
    }
    return data;
  };

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

  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    
    if (!term) {
      setSearchResult(null);
      return;
    }

    let found = null;
    let foundLeague = '';

    for (const [leagueId, players] of Object.entries(leagueData)) {
      const match = players.find(p => 
        p.name.toLowerCase().includes(term)
      );
      if (match) {
        found = match;
        foundLeague = leagueId;
        break;
      }
    }

    if (found) {
      const league = LEAGUES.find(l => l.id === foundLeague);
      setSearchResult({
        success: true,
        player: found,
        leagueName: league.name
      });
    } else {
      setSearchResult({
        success: false,
        term: searchTerm
      });
    }
  };

  const handleSyncComplete = () => {
    // Only reload if we're viewing current season
    if (currentSeason === 'current') {
      loadAllLeagues();
    }
    setLastSyncDate(new Date());
  };

  return (
    <div className="App">
      <Header 
        leagues={LEAGUES}
        activeLeague={activeLeague}
        onLeagueChange={setActiveLeague}
        lastSyncDate={lastSyncDate}
        onSyncComplete={handleSyncComplete}
        currentSeason={currentSeason}
      />

      <div className="container">
        <SearchSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          searchResult={searchResult}
        />

        <div className="rankings-section">
          <div className="season-bar">
            <span className="season-label">Season</span>
            <select 
              id="seasonSelect" 
              value={currentSeason}
              onChange={(e) => setCurrentSeason(e.target.value)}
            >
              <option value="current">Current</option>
              <option value="2024-25">2024–25</option>
            </select>
          </div>

          {LEAGUES.map(league => (
            <LeagueTable
              key={league.id}
              league={league}
              data={leagueData[league.id] || []}
              isActive={activeLeague === league.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;