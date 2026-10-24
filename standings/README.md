# standings/

This directory holds manually-maintained standings data that feed into the
ELO bonus system (`elo/apply_standings_bonus.py`).

## Structure

```
standings/
├── leagues/
│   ├── pl_<season>.json          # Premier League
│   ├── laliga_<season>.json      # La Liga
│   ├── bundesliga_<season>.json  # Bundesliga
│   ├── seriea_<season>.json      # Serie A
│   └── ligue1_<season>.json      # Ligue 1
│
└── europe/
    ├── ucl_<season>.json         # Champions League knockout results
    └── uel_<season>.json         # Europa League knockout results
```

Season suffix format: `2025_2026`, `2024_2025`, etc.

---

## League JSON format

```json
{
  "season": "2025/2026",
  "league": "Premier League",
  "standings": [
    { "position": 1, "team": "Liverpool" },
    { "position": 2, "team": "Arsenal" }
  ]
}
```

Only teams finishing top 10 earn an ELO bonus.

## European JSON format

```json
{
  "season": "2025/2026",
  "competition": "Champions League",
  "results": {
    "winner":  "Real Madrid",
    "final":   "Liverpool",
    "semi":    ["Arsenal", "Bayern München"],
    "quarter": ["Barcelona", "Borussia Dortmund", "Internazionale", "Atlético Madrid"],
    "r16":     ["Manchester City", "PSV", "Feyenoord", "RB Leipzig",
                "Paris Saint-Germain", "Napoli", "Club Brugge", "Roma"]
  }
}
```

Each round lists only teams eliminated at that round (except winner/final).

---

## ELO Bonuses

### League

| Position | Bonus |
|----------|-------|
| 1 (Champion) | +50 |
| 2  | +44 |
| 3  | +38 |
| 4  | +32 |
| 5  | +26 |
| 6  | +20 |
| 7  | +16 |
| 8  | +12 |
| 9  | +6  |
| 10 | +2  |

### UCL / UEL (same scale)

| Round   | Bonus |
|---------|-------|
| Winner  | +100  |
| Final   | +75   |
| Semi    | +50   |
| Quarter | +25   |
| R16     | +10   |
