# Footy ELO ⚽

A football player rating engine computing normalized ELO ratings across Europe's Top 5 Leagues (Premier League, La Liga, Bundesliga, Serie A, and Ligue 1) as well as the **UEFA Champions League** and **UEFA Europa League** using position-weighted match performance metrics.


> ### Competition-Specific Rating Scope
> All player statistics and ELO scores are calculated **strictly within each individual league or tournament** and are **not aggregated across competitions**:
> - **Champions League ELO** is computed exclusively from UEFA Champions League fixtures.
> - **Europa League ELO** is computed exclusively from UEFA Europa League fixtures.
> - **Domestic League ELO** is computed exclusively from that domestic league's fixtures (e.g. Premier League, La Liga).
>
> A player active in both their domestic league and European competition holds independent ratings in each tournament. This design preserves the integrity of tournament football, avoids distortions caused by differing schedule lengths or domestic cup matches, and allows pure scouting comparison between domestic consistency and continental performance.
>
> **Bonuses follow the competition too:** league tables only get the league-finish bonus, and Champions League / Europa League tables only get the knockout-round bonus for that competition (see [Standings & European Bonus](#standings--european-bonus)). Nothing is mixed across tables.

---

## Features

- **Position-Normalized ELO**: Calculates ELO scores calibrated around a 1500 baseline using 30 positional metrics (goals, xG, tackles, saves, clean sheets, dribbles, etc.).
- **Competition-Specific Standings Bonus**: League ELO adds a league-finish bonus (top 10, +2 to +50). Champions League and Europa League ELO add a knockout-round bonus (+10 to +100). Reported as `STANDINGS_BONUS` and `ELO_FINAL`.
- **Interactive "Rating Math" Modal**: Web button providing full mathematical transparency — step-by-step formulas, K-factor (10), 1500 baseline, positional normalization, the standings bonus scales, complete weights breakdown for ATT, MID, DEF, GK, and a worked example calculation.
- **7 Major Competitions**: Full support for Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UEFA Champions League, and UEFA Europa League.
- **Comprehensive 11-Season Database (2016/17 – 2026/27)**: Complete historical archive from 2016/17 onwards and live 2026/27 current campaign.
- **Crash-Proof Per-League Syncing**: Fast, dedicated syncing per league to prevent rate-limiting timeouts.
- **Real-Time Progress Streaming**: Live SSE (Server-Sent Events) progress bar showing real-time stat-by-stat fetching and calculation status.
- **Timestamp Tracking**: Displays exact last updated dates and relative times on charts and in the Sync Center.
- **Modern Dashboard UI**:
  - Top 3 Podium cards (Gold, Silver, Bronze)
  - Position filter tabs (`ATT`, `MID`, `DEF`, `GK`)
  - Rating tiers based on `ELO_FINAL` (*World Class 1700+*, *Elite 1600+*, *Pro 1500+*, *Solid*)
  - Global player scouting search and in-table filtering
  - Clear competition-specific indicators and banner callouts

---

## How ELO is Calculated

The rating engine computes position-calibrated ratings using a 5-step algorithm:

1. **Performance Delta ($\Delta_{\text{perf}}$)**:
   $$\Delta_{\text{perf}} = \sum_{i} (\text{Stat}_i \times \text{Weight}_{\text{pos}, i})$$
2. **Raw Score ($\text{ELO}_{\text{RAW}}$)**:
   $$\text{ELO}_{\text{RAW}} = 1500 + (10 \times \Delta_{\text{perf}})$$
3. **Position-Mean Normalization (Anti-Attacker Bias)**:
   $$\text{ELO} = 1500 + (\text{ELO}_{\text{RAW}} - \mu_{\text{Position}})$$
   *Centers every position around 1500, ensuring defenders and goalkeepers are evaluated fairly alongside forwards.*
4. **Floor & Rounding**:
   $$\text{ELO} = \text{round}(\max(800, \text{ELO}))$$
5. **Standings & European Bonus**:
   $$\text{ELO}_{\text{FINAL}} = \text{ELO} + \text{Bonus}_{\text{competition}}$$
   *Bonus is the league-finish bonus for league tables, or the knockout-round bonus for Champions League / Europa League tables. Added after normalization and flooring, so it never distorts the positional averages.*

---

## Standings & European Bonus

Team success is rewarded on top of individual performance. Every player in a squad receives the **same bonus** within a table, based on how their club did **in that competition**.

| Table being calculated | Bonus applied |
|:--|:--|
| Premier League, La Liga, Bundesliga, Serie A, Ligue 1 | League finish bonus only |
| Champions League, Europa League | Knockout round bonus only |

### League Finish Bonus (Top 10) — league tables only

| Final Position | Bonus |
|:--|--:|
| 1st (Champion) | +50 |
| 2nd | +44 |
| 3rd | +38 |
| 4th | +32 |
| 5th | +26 |
| 6th | +20 |
| 7th | +16 |
| 8th | +12 |
| 9th | +6 |
| 10th | +2 |
| 11th or lower | 0 |

### UCL / UEL Knockout Bonus — Champions League & Europa League tables only

The Champions League and Europa League share the same scale.

| Furthest Round Reached | Bonus |
|:--|--:|
| Winner | +100 |
| Finalist | +75 |
| Semi-final | +50 |
| Quarter-final | +25 |
| Round of 16 | +10 |

### Rules

- **Best round only**: a team is credited with the deepest round it reached, not the sum of every round.
- **Never mixed**: a club that finishes 2nd in the league and wins the Champions League gets **+44 in the league table** and **+100 in the Champions League table**, not +144 in either.
- **Applied after the floor**: `ELO` is normalized, floored at 800 and rounded first; the bonus is then added to produce `ELO_FINAL`.
- **Only when data exists**: league tables read `standings/leagues/`, and CL/EL tables read `standings/europe/`. If none exist for the season, `STANDINGS_BONUS = 0` and `ELO_FINAL = ELO`.
- **Output columns**: `ParticipantName, TeamName, Position, ELO, STANDINGS_BONUS, ELO_FINAL`. Tables are sorted by `ELO_FINAL`.
- **Configurable**: edit `LEAGUE_POSITION_BONUS` and `EUROPEAN_BONUS` in `elo/def_elo.py`, then re-run the recalculation script.

### Worked Example

An elite striker scores a stat-based `ELO` of **1663** in the league. His club finished **3rd** (+38), and also reached the **Champions League semi-final**:

- **League table:** $\text{ELO}_{\text{FINAL}} = 1663 + 38 = 1701 \;\Rightarrow\; \text{World Class}$ (no Champions League bonus)
- **Champions League table:** his CL stat `ELO` gets **+50** for the semi-final run only (no league bonus)

---

## Architecture

```
footy-elo/
├── backend/               # Flask API server & SSE streaming
│   ├── server.py          # REST & SSE endpoints (/api/sync/stream/<id>, /api/metadata)
│   ├── sync_service.py    # 7-competition sync orchestrator & metadata tracker
│   └── requirements.txt   # Python dependencies
├── scraper/               # Data extraction
│   ├── league_stats.py    # Direct FotMob data catalog scraper & position mapper
│   └── fetch_standings.py # Fetches league tables & UCL/UEL results for the bonus
├── elo/                   # Rating algorithm
│   ├── def_elo.py         # Position weights, baseline config & standings bonus scales
│   └── calc.py            # Normalized ELO computation + standings bonus loader
├── standings/             # League & European standings JSON (feeds the bonus)
│   ├── leagues/           # Final league tables per season
│   └── europe/            # UCL/UEL knockout results per season
├── public/elo_tables/     # Generated ELO CSV tables incl. STANDINGS_BONUS & ELO_FINAL (7 competitions x 11 seasons)
├── scripts/               # Automation & recalculation utilities
│   ├── build_ucl_uel.py   # UCL & UEL 11-season builder script
│   └── recalculate_all_elo.py # Instant local recalculation engine
└── src/                   # React frontend application
    ├── components/
    │   ├── Header.js      # Navigation with competition flags & Rating Math trigger
    │   ├── EloMathModal.js# Interactive rating math, weights & standings bonus explainer modal
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

When modifying the rating algorithm in `elo/calc.py`, or the position weights and bonus scales in `elo/def_elo.py`, you can instantly recalculate all ELO tables across all 11 seasons and 7 competitions in under 1 second without making any network requests:

```bash
# Recalculate all 77 tables (7 competitions x 11 seasons)
python scripts/recalculate_all_elo.py

# Recalculate only Champions League
python scripts/recalculate_all_elo.py --league champions-league

# Recalculate only Europa League
python scripts/recalculate_all_elo.py --league europa-league

# Recalculate only a specific season
python scripts/recalculate_all_elo.py --season 2026/27

# Fetch fresh standings first, then recalculate (so bonuses are up to date)
python scripts/recalculate_all_elo.py --fetch-standings

# Pure stat-based ELO only (skip the standings bonus)
python scripts/recalculate_all_elo.py --no-bonus
```

> Bonuses are applied automatically per competition: league tables use `standings/leagues/` and Champions League / Europa League tables use `standings/europe/`. The same script is also the place to re-run after editing `LEAGUE_POSITION_BONUS` or `EUROPEAN_BONUS` in `elo/def_elo.py`.