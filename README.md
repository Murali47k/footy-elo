# Footy ELO ⚽

A football player rating engine computing normalized ELO ratings across Europe's Top 5 Leagues (Premier League, La Liga, Bundesliga, Serie A, and Ligue 1) using position-weighted match performance metrics.

---

## ✨ Features

- **Position-Normalized ELO**: Calculates ELO scores calibrated around a 1500 baseline using 30 positional metrics (goals, xG, tackles, saves, clean sheets, dribbles, etc.).
- **Crash-Proof Per-League Syncing**: Fast, dedicated syncing per league to prevent rate-limiting timeouts.
- **Real-Time Progress Streaming**: Live SSE (Server-Sent Events) progress bar showing real-time stat-by-stat fetching and calculation status.
- **Timestamp Tracking**: Displays exact last updated dates and relative times on charts and in the Sync Center.
- **Modern Dashboard UI**:
  - Top 3 Podium cards (Gold, Silver, Bronze)
  - Position filter tabs (`ATT`, `MID`, `DEF`, `GK`)
  - Rating tiers (*World Class 1700+*, *Elite 1600+*, *Pro 1500+*, *Solid*)
  - Global player scouting search and in-table filtering
  - Complete 11-season archive (2016/17 through 2025/26) and Current (2026/27) season databases across Europe's Top 5 Leagues

---

## 🛠️ Architecture

```
footy-elo/
├── backend/               # Flask API server & SSE streaming
│   ├── server.py          # REST & SSE endpoints (/api/sync/stream/<id>, /api/metadata)
│   ├── sync_service.py    # Per-league sync orchestrator & metadata tracker
│   └── requirements.txt   # Python dependencies
├── scraper/               # Data extraction
│   └── league_stats.py    # Direct FotMob data catalog scraper & position mapper
├── elo/                   # Rating algorithm
│   ├── def_elo.py         # Position weights & baseline configuration
│   └── calc.py            # Normalized ELO score computation
├── public/elo_tables/     # Generated ELO CSV tables & sync_meta.json
└── src/                   # React frontend application
    ├── components/        # Header, LeagueTable, SearchSection, SyncModal
    └── App.css            # Dark glassmorphic design system
```

---

## 🚀 Quickstart

### 1. Backend Server

```bash
# Activate virtual environment
source backend/venv/bin/activate

# Install dependencies (if needed)
pip install -r backend/requirements.txt

# Start the Flask API (port 5000)
python backend/server.py
```

### 2. Frontend Application

```bash
# Install node dependencies
npm install

# Start development server (port 3000)
npm start
```

### 3. CLI Sync (Optional)

You can also sync any league directly from the terminal:

```bash
# Sync single league
python backend/sync_all_leagues.py --league premier-league

# Sync all leagues sequentially
python backend/sync_all_leagues.py --league all
```
