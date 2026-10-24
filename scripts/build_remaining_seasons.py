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

# Remaining seasons we need to build
REMAINING_SEASONS = [
    ('2022/2023', '2022_2023'),
    ('2021/2022', '2021_2022'),
    ('2020/2021', '2020_2021'),
    ('2019/2020', '2019_2020'),
    ('2018/2019', '2018_2019'),
    ('2017/2018', '2017_2018'),
    ('2016/2017', '2016_2017'),
]

def build_season_elo(season_str, norm_season):
    print(f"\n{'='*48}")
    print(f"  Building Player ELO for season {season_str}")
    print(f"{'='*48}")

    for league in LEAGUES:
        prefix = league['file']
        api_id = league['apiId']
        name = league['name']

        raw_csv = os.path.join(PROJECT_ROOT, f"tables/{prefix}_{norm_season}.csv")
        public_elo_csv = os.path.join(PROJECT_ROOT, f"public/elo_tables/{prefix}_elo_{norm_season}.csv")

        # Skip if already exists with content
        if os.path.exists(public_elo_csv) and os.path.getsize(public_elo_csv) > 500:
            print(f"  ⏩ {name} {season_str} already built. Skipping.")
            continue

        print(f"\n  --- Fetching {name} for {season_str} ---")
        try:
            fetch_league_stats(api_id, season=season_str, output_path=raw_csv)
            calculate_elo(raw_csv, public_elo_csv)
            print(f"  ✅ Done: {name} {season_str}")
        except Exception as e:
            print(f"  ❌ Failed {name} {season_str}: {e}")

        # Small throttle between league fetches
        time.sleep(0.5)

    # Pause between seasons to be polite to FotMob CDN
    print(f"\n  ⏸  Season {season_str} complete. Brief pause before next season...")
    time.sleep(2)

if __name__ == '__main__':
    print(f"\n🚀 Building ELO for {len(REMAINING_SEASONS)} seasons × {len(LEAGUES)} leagues")
    print(f"   Seasons: {[s[0] for s in REMAINING_SEASONS]}\n")

    for season_str, norm_season in REMAINING_SEASONS:
        build_season_elo(season_str, norm_season)

    print(f"\n{'='*48}")
    print(f"  🎉 All done! ELO tables built for all seasons.")
    print(f"{'='*48}\n")
