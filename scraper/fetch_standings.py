#!/usr/bin/env python3
"""
scraper/fetch_standings.py
──────────────────────────────────────────────────────────────────
Fetches real league standings + UCL/UEL knockout round results
from FotMob and writes them to standings/leagues/ and standings/europe/.

Usage:
  python scraper/fetch_standings.py                     # current season
  python scraper/fetch_standings.py --season 2024/2025  # specific season

The output JSON files are then picked up by the ELO bonus engine in
elo/apply_standings_bonus.py (called automatically by recalculate_all_elo.py).
"""

import os
import sys
import json
import time
import argparse
import urllib.parse

import requests
from bs4 import BeautifulSoup

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

STANDINGS_DIR = os.path.join(PROJECT_ROOT, "standings")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.fotmob.com/",
}

# ── FotMob league/competition IDs ──────────────────────────────────────────
LEAGUE_CONFIGS = [
    {"name": "Premier League",  "file": "pl",         "fotmob_id": "47"},
    {"name": "La Liga",         "file": "laliga",     "fotmob_id": "87"},
    {"name": "Bundesliga",      "file": "bundesliga", "fotmob_id": "54"},
    {"name": "Serie A",         "file": "seriea",     "fotmob_id": "55"},
    {"name": "Ligue 1",         "file": "ligue1",     "fotmob_id": "53"},
]

EUROPEAN_CONFIGS = [
    {"name": "Champions League", "file": "ucl", "fotmob_id": "42"},
    {"name": "Europa League",    "file": "uel", "fotmob_id": "73"},
]

# ── Name normalisation ──────────────────────────────────────────────────────
# FotMob table names → names used in player stat CSVs (TeamName column).
# Add entries here whenever a new mismatch is found.
TEAM_NAME_MAP = {
    # Premier League
    "AFC Bournemouth":              "Bournemouth",
    "Brighton & Hove Albion":       "Brighton and Hove Albion",
    "West Ham United":              "West Ham United",
    "Wolverhampton Wanderers":      "Wolverhampton Wanderers",
    "Sheffield United":             "Sheffield United",
    "Luton Town":                   "Luton Town",
    "Burnley":                      "Burnley",

    # Serie A
    "Inter":                        "Internazionale",
    "AC Milan":                     "Milan",
    "Hellas Verona":                "Verona",
    "AC Monza":                     "Monza",

    # La Liga
    "Atlético de Madrid":           "Atlético Madrid",
    "Deportivo Alavés":             "Deportivo Alavés",
    "Celta Vigo":                   "Celta de Vigo",
    "RC Celta":                     "Celta de Vigo",

    # Bundesliga
    "Bayer Leverkusen":             "Bayer 04 Leverkusen",
    "Mainz":                        "1. FSV Mainz 05",
    "Mainz 05":                     "1. FSV Mainz 05",
    "1. FC Mainz 05":               "1. FSV Mainz 05",
    "Köln":                         "1. FC Köln",
    "1. FC Cologne":                "1. FC Köln",
    "Union Berlin":                 "1. FC Union Berlin",
    "Freiburg":                     "Sport-Club Freiburg",
    "SC Freiburg":                  "Sport-Club Freiburg",
    "Werder Bremen":                "SV Werder Bremen",
    "Hoffenheim":                   "TSG 1899 Hoffenheim",
    "TSG Hoffenheim":               "TSG 1899 Hoffenheim",
    "Augsburg":                     "FC Augsburg",
    "Paderborn":                    "SC Paderborn 07",
    "Elversberg":                   "SV 07 Elversberg",
    "Hamburger SV":                 "Hamburger SV",

    # Ligue 1
    "Stade Brestois 29":            "Brest",
    "Stade de Reims":               "Reims",
    "RC Lens":                      "Lens",
    "LOSC Lille":                   "Lille",
    "Olympique Lyonnais":           "Lyon",
    "Olympique de Marseille":       "Marseille",
    "AS Monaco":                    "Monaco",
    "OGC Nice":                     "Nice",
    "Paris Saint-Germain":          "Paris Saint-Germain",
    "Stade Rennais FC":             "Rennes",
    "RC Strasbourg":                "Strasbourg",
    "Toulouse FC":                  "Toulouse",
    "Le Havre AC":                  "Le Havre",

    # UCL / UEL names
    "Sporting CP":                  "Sporting Lisbon",
    "Sporting":                     "Sporting Lisbon",
    "FC Internazionale":            "Internazionale",
    "RB Salzburg":                  "FC Red Bull Salzburg",
    "Red Bull Salzburg":            "FC Red Bull Salzburg",
    "Sturm Graz":                   "SK Puntigamer Sturm Graz",
    "Anderlecht":                   "RSC Anderlecht",
    "Union SG":                     "Union Saint-Gilloise",
    "Qarabağ FK":                   "Qarabağ FK",
    "Newcastle":                    "Newcastle United",
    "Tottenham":                    "Tottenham Hotspur",
    "Man City":                     "Manchester City",
    "Man United":                   "Manchester United",
    "Chelsea FC":                   "Chelsea",
    "Arsenal FC":                   "Arsenal",
    "Liverpool FC":                 "Liverpool",
    "Bayern Munich":                "Bayern München",
    "Bayern München":               "Bayern München",
    "Bor. Dortmund":                "Borussia Dortmund",
    "BVB":                          "Borussia Dortmund",
    "Atlético Madrid":              "Atlético Madrid",
    "Atlético":                     "Atlético Madrid",
    "Benfica":                      "Benfica",
    "SL Benfica":                   "Benfica",
    "Galatasaray SK":               "Galatasaray",
    "Bodø/Glimt":                   "Bodø/Glimt",
    "Club Brugge":                  "Club Brugge",
    "PSG":                          "Paris Saint-Germain",
    "Juventus FC":                  "Juventus",
    "Atalanta BC":                  "Atalanta",
    "AC Atalanta":                  "Atalanta",
    "Olympiacos":                   "Olympiakos",
    "Olympiakos FC":                "Olympiakos",
}

# UCL/UEL: FotMob stage names → our canonical round keys
STAGE_TO_ROUND = {
    "final":    "final",
    "1/2":      "semi",
    "1/4":      "quarter",
    "1/8":      "r16",
    # Some seasons have extra pre-R16 qualifying rounds — we skip those
    "playoff":  None,   # UCL league phase playoff (not a KO bonus round)
    "group":    None,
    "league":   None,
}


def normalise(name: str) -> str:
    """Normalise a FotMob team name to the CSV TeamName."""
    return TEAM_NAME_MAP.get(name, name)


def _fotmob_page(league_id: str, season: str) -> dict:
    url = f"https://www.fotmob.com/api/leagues/{league_id}?season={urllib.parse.quote(season)}"
    res = requests.get(url, headers=HEADERS, timeout=15)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__")
    if not script:
        raise ValueError(f"Could not parse FotMob page for league {league_id}")
    page_data = json.loads(script.string)
    return page_data.get("props", {}).get("pageProps", {})


def season_suffix(season_str: str) -> str:
    """'2025/2026' -> '2025_2026'"""
    return season_str.replace("/", "_")


# ── League table fetcher ────────────────────────────────────────────────────

def fetch_league_table(config: dict, season: str) -> dict:
    """
    Fetch a domestic league table from FotMob.
    Returns a standings dict ready to write as JSON.
    """
    print(f"  📋 Fetching {config['name']} table for {season}...")
    props = _fotmob_page(config["fotmob_id"], season)

    table_blocks = props.get("table", [])
    if not table_blocks:
        raise ValueError(f"No table data for {config['name']} {season}")

    # Use the first block (full table / 'all')
    rows = table_blocks[0]["data"]["table"]["all"]

    standings = []
    for row in rows:
        pos = row.get("idx") or row.get("pos")
        name = normalise(row.get("name", "").strip())
        if pos and name:
            standings.append({"position": int(pos), "team": name})

    standings.sort(key=lambda x: x["position"])

    return {
        "season": season,
        "league": config["name"],
        "standings": standings,
    }


# ── European knockout fetcher ───────────────────────────────────────────────

def fetch_european_knockout(config: dict, season: str) -> dict:
    """
    Fetch UCL or UEL knockout bracket from FotMob.
    Returns a results dict ready to write as JSON.

    Logic:
    - For each KO round, the LOSERS of that round are tagged at that round.
    - The winner of the final is tagged 'winner'; the loser is tagged 'final'.
    - Teams only appearing in non-KO rounds (group/league/playoff) are skipped.
    """
    print(f"  🏆 Fetching {config['name']} knockout for {season}...")
    props = _fotmob_page(config["fotmob_id"], season)

    playoff_data = props.get("playoff", {})
    rounds = playoff_data.get("rounds", [])

    if not rounds:
        raise ValueError(f"No playoff/knockout data for {config['name']} {season}")

    results = {
        "winner":  None,
        "final":   None,
        "semi":    [],
        "quarter": [],
        "r16":     [],
    }

    for rnd in rounds:
        stage = rnd.get("stage", "")
        round_key = STAGE_TO_ROUND.get(stage)

        if round_key is None:
            # Non-KO round (group stage / league phase / playoff entry) — skip
            continue

        for matchup in rnd.get("matchups", []):
            winner_id = matchup.get("winner")
            home_id   = matchup.get("homeTeamId")
            away_id   = matchup.get("awayTeamId")
            home_name = normalise(matchup.get("homeTeam", "").strip())
            away_name = normalise(matchup.get("awayTeam", "").strip())

            # Skip if the match hasn't been played yet
            if winner_id is None:
                continue

            loser_name  = away_name if winner_id == home_id else home_name
            winner_name = home_name if winner_id == home_id else away_name

            if round_key == "final":
                results["winner"] = winner_name
                results["final"]  = loser_name
            elif round_key in ("semi", "quarter", "r16"):
                if loser_name not in results[round_key]:
                    results[round_key].append(loser_name)

    # Clean up empty lists
    results = {k: v for k, v in results.items() if v not in (None, [])}

    return {
        "season":      season,
        "competition": config["name"],
        "results":     results,
    }


# ── Writers ─────────────────────────────────────────────────────────────────

def write_json(path: str, data: dict):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"    ✅ Saved → {os.path.relpath(path, PROJECT_ROOT)}")


# ── Main ─────────────────────────────────────────────────────────────────────

def fetch_all_standings(season: str):
    suffix = season_suffix(season)
    leagues_dir = os.path.join(STANDINGS_DIR, "leagues")
    europe_dir  = os.path.join(STANDINGS_DIR, "europe")

    print(f"\n{'='*58}")
    print(f"  Fetching standings for season {season}")
    print(f"{'='*58}")

    # ── Domestic leagues ──────────────────────────────────────────────
    print(f"\n── Domestic League Tables ───────────────────────────────")
    for cfg in LEAGUE_CONFIGS:
        try:
            data = fetch_league_table(cfg, season)
            out  = os.path.join(leagues_dir, f"{cfg['file']}_{suffix}.json")
            write_json(out, data)
            time.sleep(0.4)
        except Exception as e:
            print(f"    ❌ {cfg['name']}: {e}")

    # ── European competitions ─────────────────────────────────────────
    print(f"\n── European Knockout Results ─────────────────────────────")
    for cfg in EUROPEAN_CONFIGS:
        try:
            data = fetch_european_knockout(cfg, season)
            out  = os.path.join(europe_dir, f"{cfg['file']}_{suffix}.json")
            write_json(out, data)
            time.sleep(0.4)
        except Exception as e:
            print(f"    ❌ {cfg['name']}: {e}")

    print(f"\n{'='*58}")
    print(f"  Done! Standings saved to standings/")
    print(f"  Run: python scripts/recalculate_all_elo.py --season {season}")
    print(f"{'='*58}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Fetch standings + knockout data from FotMob"
    )
    parser.add_argument(
        "--season", type=str, default="2025/2026",
        help="Season to fetch (e.g. '2025/2026'). Default: 2025/2026"
    )
    args = parser.parse_args()
    fetch_all_standings(args.season)


if __name__ == "__main__":
    main()
