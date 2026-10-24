#!/usr/bin/env python3
"""
Generate template standings JSON files for all seasons.
Edit the generated files to reflect real final standings.
Run: python standings/generate_sample_standings.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEAGUES_DIR = os.path.join(ROOT, "standings", "leagues")
EUROPE_DIR  = os.path.join(ROOT, "standings", "europe")

# ── 2025/26 (current) ──────────────────────────────────────────────────────

PL_2025_2026 = {
    "season": "2025/2026",
    "league": "Premier League",
    "standings": [
        {"position": 1,  "team": "Liverpool"},
        {"position": 2,  "team": "Arsenal"},
        {"position": 3,  "team": "Chelsea"},
        {"position": 4,  "team": "Manchester City"},
        {"position": 5,  "team": "Newcastle United"},
        {"position": 6,  "team": "Aston Villa"},
        {"position": 7,  "team": "Nottingham Forest"},
        {"position": 8,  "team": "Tottenham Hotspur"},
        {"position": 9,  "team": "Brighton and Hove Albion"},
        {"position": 10, "team": "Fulham"},
    ]
}

LALIGA_2025_2026 = {
    "season": "2025/2026",
    "league": "La Liga",
    "standings": [
        {"position": 1,  "team": "Real Madrid"},
        {"position": 2,  "team": "Barcelona"},
        {"position": 3,  "team": "Atlético Madrid"},
        {"position": 4,  "team": "Villarreal"},
        {"position": 5,  "team": "Athletic Club"},
        {"position": 6,  "team": "Real Sociedad"},
        {"position": 7,  "team": "Real Betis"},
        {"position": 8,  "team": "Sevilla"},
        {"position": 9,  "team": "Osasuna"},
        {"position": 10, "team": "Valencia CF"},
    ]
}

BUNDESLIGA_2025_2026 = {
    "season": "2025/2026",
    "league": "Bundesliga",
    "standings": [
        {"position": 1,  "team": "Bayern München"},
        {"position": 2,  "team": "Bayer 04 Leverkusen"},
        {"position": 3,  "team": "Borussia Dortmund"},
        {"position": 4,  "team": "RB Leipzig"},
        {"position": 5,  "team": "Eintracht Frankfurt"},
        {"position": 6,  "team": "VfB Stuttgart"},
        {"position": 7,  "team": "Sport-Club Freiburg"},
        {"position": 8,  "team": "Borussia Mönchengladbach"},
        {"position": 9,  "team": "TSG 1899 Hoffenheim"},
        {"position": 10, "team": "1. FSV Mainz 05"},
    ]
}

SERIEA_2025_2026 = {
    "season": "2025/2026",
    "league": "Serie A",
    "standings": [
        {"position": 1,  "team": "Internazionale"},
        {"position": 2,  "team": "Napoli"},
        {"position": 3,  "team": "Juventus"},
        {"position": 4,  "team": "Atalanta"},
        {"position": 5,  "team": "Milan"},
        {"position": 6,  "team": "Roma"},
        {"position": 7,  "team": "Lazio"},
        {"position": 8,  "team": "Fiorentina"},
        {"position": 9,  "team": "Bologna"},
        {"position": 10, "team": "Torino"},
    ]
}

LIGUE1_2025_2026 = {
    "season": "2025/2026",
    "league": "Ligue 1",
    "standings": [
        {"position": 1,  "team": "Paris Saint-Germain"},
        {"position": 2,  "team": "Monaco"},
        {"position": 3,  "team": "Marseille"},
        {"position": 4,  "team": "Lyon"},
        {"position": 5,  "team": "Lille"},
        {"position": 6,  "team": "Nice"},
        {"position": 7,  "team": "Lens"},
        {"position": 8,  "team": "Rennes"},
        {"position": 9,  "team": "Brest"},
        {"position": 10, "team": "Strasbourg"},
    ]
}

UCL_2025_2026 = {
    "season": "2025/2026",
    "competition": "Champions League",
    "results": {
        "winner":  "Real Madrid",
        "final":   "Liverpool",
        "semi":    ["Arsenal", "Bayern München"],
        "quarter": ["Barcelona", "Borussia Dortmund", "Internazionale", "Atlético Madrid"],
        "r16":     ["Manchester City", "PSV", "Feyenoord", "RB Leipzig",
                    "Paris Saint-Germain", "Napoli", "Club Brugge", "Sporting Lisbon"]
    }
}

UEL_2025_2026 = {
    "season": "2025/2026",
    "competition": "Europa League",
    "results": {
        "winner":  "Bayer 04 Leverkusen",
        "final":   "Juventus",
        "semi":    ["Lyon", "Marseille"],
        "quarter": ["Roma", "Milan", "Benfica", "Celtic"],
        "r16":     ["Real Sociedad", "Atalanta", "Sporting Lisbon", "Feyenoord",
                    "Olympiakos", "Ajax", "Dinamo Zagreb", "Villarreal"]
    }
}

# ── Write helpers ───────────────────────────────────────────────────────────

def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ {os.path.relpath(path, ROOT)}")

if __name__ == "__main__":
    print("\n📋 Generating standings JSON files...")

    # League tables
    write(os.path.join(LEAGUES_DIR, "pl_2025_2026.json"),         PL_2025_2026)
    write(os.path.join(LEAGUES_DIR, "laliga_2025_2026.json"),     LALIGA_2025_2026)
    write(os.path.join(LEAGUES_DIR, "bundesliga_2025_2026.json"), BUNDESLIGA_2025_2026)
    write(os.path.join(LEAGUES_DIR, "seriea_2025_2026.json"),     SERIEA_2025_2026)
    write(os.path.join(LEAGUES_DIR, "ligue1_2025_2026.json"),     LIGUE1_2025_2026)

    # European competitions
    write(os.path.join(EUROPE_DIR, "ucl_2025_2026.json"), UCL_2025_2026)
    write(os.path.join(EUROPE_DIR, "uel_2025_2026.json"), UEL_2025_2026)

    print(f"\nDone! Edit the JSON files in standings/ to reflect real results,")
    print(f"then run: python scripts/apply_bonuses.py\n")
