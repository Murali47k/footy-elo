import os
import sys
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scraper.league_stats import fetch_league_stats
from elo.calc import calculate_elo

LEAGUES = [
    {'id': 'premier-league', 'file': 'pl', 'name': 'Premier League', 'apiId': '47'},
    {'id': 'la-liga', 'file': 'laliga', 'name': 'La Liga', 'apiId': '87'},
    {'id': 'bundesliga', 'file': 'bundesliga', 'name': 'Bundesliga', 'apiId': '54'},
    {'id': 'serie-a', 'file': 'seriea', 'name': 'Serie A', 'apiId': '55'},
    {'id': 'ligue-1', 'file': 'ligue1', 'name': 'Ligue 1', 'apiId': '53'}
]

def build_season_elo(season_str, norm_season):
    print(f"\n==========================================")
    print(f"Building Player ELO for season {season_str}")
    print(f"==========================================")

    for l in LEAGUES:
        prefix = l['file']
        api_id = l['apiId']
        name = l['name']

        raw_csv = os.path.join(PROJECT_ROOT, f"tables/{prefix}_{norm_season}.csv")
        public_elo_csv = os.path.join(PROJECT_ROOT, f"public/elo_tables/{prefix}_elo_{norm_season}.csv")

        # Skip if already exists
        if os.path.exists(public_elo_csv) and os.path.getsize(public_elo_csv) > 1000:
            print(f"⏩ {name} ({season_str}) already exists at {public_elo_csv}. Skipping fetch.")
            continue

        print(f"\n--- Fetching {name} for {season_str} ---")
        try:
            fetch_league_stats(api_id, season=season_str, output_path=raw_csv)
            calculate_elo(raw_csv, public_elo_csv)
            print(f"✅ Finished {name} {season_str} -> {public_elo_csv}")
        except Exception as e:
            print(f"❌ Failed to fetch/calc {name} {season_str}: {e}")

        time.sleep(1)

if __name__ == '__main__':
    # Fetch 2024/2025 (the immediate previous season)
    build_season_elo('2024/2025', '2024_2025')
