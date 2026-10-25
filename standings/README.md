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

### League Finish Bonus (Top 10) — league tables only

| Final Position | Bonus |
|:--|--:|
| 1st (Champion) | +70 |
| 2nd | +50 |
| 3rd | +38 |
| 4th | +32 |
| 5th | +24 |
| 6th | +20 |
| 7th | +16 |
| 8th | +12 |
| 9th | +8 |
| 10th | +4 |
| 11th or lower | 0 |

### UCL / UEL Knockout Bonus — Champions League & Europa League tables only

The Champions League and Europa League share the same scale.

| Furthest Round Reached | Bonus |
|:--|--:|
| Winner | +130 |
| Finalist | +70 |
| Semi-final | +38 |
| Quarter-final | +20 |
| Round of 16 | +10 |
