# Footy ELO ⚽

A football player rating engine computing normalized ELO ratings across Europe's Top 5 Leagues (Premier League, La Liga, Bundesliga, Serie A, and Ligue 1) as well as the **UEFA Champions League** and **UEFA Europa League** using position-weighted match performance metrics.


> ### Competition-Specific Rating Scope
> All player statistics and ELO scores are calculated **strictly within each individual league or tournament** and are **not aggregated across competitions**:
> - **Champions League ELO** is computed exclusively from UEFA Champions League fixtures.
> - **Europa League ELO** is computed exclusively from UEFA Europa League fixtures.
> - **Domestic League ELO** is computed exclusively from that domestic league's fixtures (e.g. Premier League, La Liga).
>
> A player active in both their domestic league and European competition holds independent ratings in each tournament. This design preserves the integrity of tournament football, avoids distortions caused by differing schedule lengths or domestic cup matches, and allows pure scouting comparison between domestic consistency and continental performance.

---

## Features

- **Position-Normalized ELO**: Calculates ELO scores calibrated around a 1500 baseline using 30 positional metrics (goals, xG, tackles, saves, clean sheets, dribbles, etc.).
- **Interactive "Rating Math" Modal**: Web button providing full mathematical transparency — step-by-step formulas, K-factor (10), 1500 baseline, positional normalization, complete weights breakdown for ATT, MID, DEF, GK, and a worked example calculation.
- **7 Major Competitions**: Full support for Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UEFA Champions League, and UEFA Europa League.
- **Comprehensive 11-Season Database (2016/17 – 2026/27)**: Complete historical archive from 2016/17 onwards and live 2026/27 current campaign.
- **Crash-Proof Per-League Syncing**: Fast, dedicated syncing per league to prevent rate-limiting timeouts.
- **Real-Time Progress Streaming**: Live SSE (Server-Sent Events) progress bar showing real-time stat-by-stat fetching and calculation status.
- **Timestamp Tracking**: Displays exact last updated dates and relative times on charts and in the Sync Center.
- **Modern Dashboard UI**:
  - Top 3 Podium cards (Gold, Silver, Bronze)
  - Position filter tabs (`ATT`, `MID`, `DEF`, `GK`)
  - Rating tiers (*World Class 1700+*, *Elite 1600+*, *Pro 1500+*, *Solid*)
  - Global player scouting search and in-table filtering
  - Clear competition-specific indicators and banner callouts

---

## How ELO is Calculated

The rating engine computes position-calibrated ratings using a 4-step algorithm:

1. **Performance Delta ($\Delta_{\text{perf}}$)**:
   $$\Delta_{\text{perf}} = \sum_{i} (\text{Stat}_i \times \text{Weight}_{\text{pos}, i})$$
2. **Raw Score ($\text{ELO}_{\text{RAW}}$)**:
   $$\text{ELO}_{\text{RAW}} = 1500 + (10 \times \Delta_{\text{perf}})$$
3. **Position-Mean Normalization (Anti-Attacker Bias)**:
   $$\text{ELO} = 1500 + (\text{ELO}_{\text{RAW}} - \mu_{\text{Position}})$$
   *Centers every position around 1500, ensuring defenders and goalkeepers are evaluated fairly alongside forwards.*
4. **Floor & Rounding**:
   $$\text{ELO}_{\text{Final}} = \text{round}(\max(800, \text{ELO}))$$

---

## Architecture

```
footy-elo/
├── backend/               # Flask API server & SSE streaming
│   ├── server.py          # REST & SSE endpoints (/api/sync/stream/<id>, /api/metadata)
│   ├── sync_service.py    # 7-competition sync orchestrator & metadata tracker
│   └── requirements.txt   # Python dependencies
├── scraper/               # Data extraction
│   └── league_stats.py    # Direct FotMob data catalog scraper & position mapper
├── elo/                   # Rating algorithm
│   ├── def_elo.py         # Position weights & baseline configuration
│   └── calc.py            # Normalized ELO score computation
├── public/elo_tables/     # Generated ELO CSV tables (7 competitions x 11 seasons)
├── scripts/               # Automation & recalculation utilities
│   ├── build_ucl_uel.py   # UCL & UEL 11-season builder script
│   └── recalculate_all_elo.py # Instant local recalculation engine
└── src/                   # React frontend application
    ├── components/
    │   ├── Header.js      # Navigation with competition flags & Rating Math trigger
    │   ├── EloMathModal.js# Interactive rating math & weights explainer modal
    │   ├── LeagueTable.js # Table with league-specific callout, tiers, & search
    │   ├── SearchSection.js # Global player cross-competition scout search
    │   └── SyncModal.js   # Per-league sync center
    └── App.css            # Dark glassmorphic design system
```

---

## Quickstart

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

You can also sync any competition directly from the terminal:

```bash
# Sync Premier League
python backend/sync_all_leagues.py --league premier-league

# Sync Champions League
python backend/sync_all_leagues.py --league champions-league

# Sync Europa League
python backend/sync_all_leagues.py --league europa-league

# Sync all 7 competitions sequentially
python backend/sync_all_leagues.py --league all
```

### 4. Recalculate ELO Ratings (Local Table Data)

When modifying the rating algorithm in `elo/calc.py` or position weights in `elo/def_elo.py`, you can instantly recalculate all ELO tables across all 11 seasons and 7 competitions in under 1 second without making any network requests:

```bash
# Recalculate all 77 tables (7 competitions x 11 seasons)
python scripts/recalculate_all_elo.py

# Recalculate only Champions League
python scripts/recalculate_all_elo.py --league champions-league

# Recalculate only Europa League
python scripts/recalculate_all_elo.py --league europa-league

# Recalculate only a specific season
python scripts/recalculate_all_elo.py --season 2026/27
```


