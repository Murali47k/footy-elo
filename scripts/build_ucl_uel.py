#!/usr/bin/env python3
"""
Script to fetch and compute ELO for Champions League (42) and Europa League (73)
from 2016/17 season onwards (through current 2026/27 season).
"""

import os
import sys
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scraper.league_stats import fetch_league_stats
from elo.calc import calculate_elo

COMPETITIONS = [
    {'id': 'champions-league', 'file': 'cl', 'name': 'Champions League', 'apiId': '42'},
    {'id': 'europa-league', 'file': 'el', 'name': 'Europa League', 'apiId': '73'},
]

SEASONS = [
    ('current', None),
    ('2025/2026', '2025_2026'),
    ('2024/2025', '2024_2025'),
    ('2023/2024', '2023_2024'),
    ('2022/2023', '2022_2023'),
    ('2021/2022', '2021_2022'),
    ('2020/2021', '2020_2021'),
    ('2019/2020', '2019_2020'),
    ('2018/2019', '2018_2019'),
    ('2017/2018', '2017_2018'),
    ('2016/2017', '2016_2017'),
]

def build_competition(comp, season_label, season_suffix):
    prefix = comp['file']
    api_id = comp['apiId']
    name = comp['name']

    if season_suffix is None:
        stats_file = os.path.join(PROJECT_ROOT, f"tables/{prefix}.csv")
        elo_file = os.path.join(PROJECT_ROOT, f"public/elo_tables/{prefix}_elo.csv")
        season_query = "2026/2027"
    else:
        stats_file = os.path.join(PROJECT_ROOT, f"tables/{prefix}_{season_suffix}.csv")
        elo_file = os.path.join(PROJECT_ROOT, f"public/elo_tables/{prefix}_elo_{season_suffix}.csv")
        season_query = season_label

    if os.path.exists(elo_file) and os.path.getsize(elo_file) > 500:
        print(f"⏩ {name} {season_label} already exists. Skipping.")
        return True

    print(f"\n⚡ Fetching {name} for {season_label} (FotMob ID {api_id}, season {season_query})...")
    try:
        fetch_league_stats(api_id, season=season_query, output_path=stats_file)
        calculate_elo(stats_file, elo_file)
        print(f"✅ Successfully built {name} {season_label}")
        return True
    except Exception as e:
        print(f"❌ Failed to build {name} {season_label}: {e}")
        return False

def main():
    print("=" * 60)
    print("  Footy ELO - European Competitions Builder (UCL & UEL)")
    print("  Seasons: 2016/17 through 2026/27 (11 seasons each)")
    print("=" * 60)

    total = len(COMPETITIONS) * len(SEASONS)
    done = 0

    for comp in COMPETITIONS:
        for season_label, season_suffix in SEASONS:
            done += 1
            print(f"\n[{done}/{total}] Processing {comp['name']} ({season_label})...")
            build_competition(comp, season_label, season_suffix)
            time.sleep(0.5)

    print("\n" + "=" * 60)
    print("  🎉 Completed European Competitions Build!")
    print("=" * 60)

if __name__ == '__main__':
    main()
