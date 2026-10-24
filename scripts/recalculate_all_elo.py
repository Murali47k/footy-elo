#!/usr/bin/env python3
"""
Footy ELO - Bulk Recalculate Script
Recalculates all player ELO ratings from the raw statistics files in tables/
and writes the updated ratings directly to public/elo_tables/.

Run this script anytime changes are made to the ELO formula in elo/calc.py or def_elo.py.
No network requests are made; all calculations use local table data.

Usage:
    python scripts/recalculate_all_elo.py                  # Recalculate all 55 tables
    python scripts/recalculate_all_elo.py --league pl      # Only Premier League
    python scripts/recalculate_all_elo.py --season 2026/27 # Only current season
"""

import os
import sys
import argparse
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from elo.calc import calculate_elo

LEAGUES = [
    {'id': 'premier-league', 'file': 'pl', 'name': 'Premier League'},
    {'id': 'la-liga', 'file': 'laliga', 'name': 'La Liga'},
    {'id': 'bundesliga', 'file': 'bundesliga', 'name': 'Bundesliga'},
    {'id': 'serie-a', 'file': 'seriea', 'name': 'Serie A'},
    {'id': 'ligue-1', 'file': 'ligue1', 'name': 'Ligue 1'},
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

def recalculate_tables(league_filter=None, season_filter=None):
    tables_dir = os.path.join(PROJECT_ROOT, "tables")
    public_elo_dir = os.path.join(PROJECT_ROOT, "public/elo_tables")
    os.makedirs(public_elo_dir, exist_ok=True)

    leagues_to_process = LEAGUES
    if league_filter:
        leagues_to_process = [
            l for l in LEAGUES
            if league_filter.lower() in (l['id'], l['file'], l['name'].lower())
        ]
        if not leagues_to_process:
            print(f"Error: Unknown league '{league_filter}'. Valid options: pl, laliga, bundesliga, seriea, ligue1")
            return

    seasons_to_process = SEASONS
    if season_filter:
        clean_season = season_filter.replace('-', '_').replace('/', '_')
        seasons_to_process = [
            s for s in SEASONS
            if season_filter.lower() in (s[0].lower(), str(s[1]).lower())
            or clean_season in str(s[1])
        ]
        if not seasons_to_process:
            print(f"Error: Unknown season '{season_filter}'. Valid examples: current, 2025_2026, 2024-25, 2016/2017")
            return

    total_tasks = len(leagues_to_process) * len(seasons_to_process)
    print(f"\n=======================================================")
    print(f"  Footy ELO Recalculation Engine")
    print(f"  Target: {len(leagues_to_process)} leagues x {len(seasons_to_process)} seasons = {total_tasks} tables")
    print(f"  Output directory: {public_elo_dir}")
    print(f"=======================================================\n")

    start_time = time.time()
    success_count = 0
    missing_count = 0

    task_idx = 0
    for league in leagues_to_process:
        prefix = league['file']
        league_name = league['name']

        for season_label, season_suffix in seasons_to_process:
            task_idx += 1
            if season_suffix is None:
                # Current season 2026/27
                raw_filename = f"{prefix}.csv"
                out_filename = f"{prefix}_elo.csv"
                display_season = "2026/27 (Current)"
            else:
                raw_filename = f"{prefix}_{season_suffix}.csv"
                out_filename = f"{prefix}_elo_{season_suffix}.csv"
                display_season = season_label

            raw_path = os.path.join(tables_dir, raw_filename)
            out_path = os.path.join(public_elo_dir, out_filename)

            if not os.path.exists(raw_path):
                print(f"[{task_idx:2d}/{total_tasks:2d}] SKIP: Missing raw table: {raw_filename}")
                missing_count += 1
                continue

            try:
                # Supress verbose print during bulk recalculate
                elo_df = calculate_elo(raw_path, out_path)
                player_count = len(elo_df)
                top_player = elo_df.iloc[0]['ParticipantName'] if len(elo_df) > 0 else 'N/A'
                top_elo = round(elo_df.iloc[0]['ELO']) if len(elo_df) > 0 else 0
                print(f"[{task_idx:2d}/{total_tasks:2d}] OK: {league_name:<15} ({display_season:<17}) -> {player_count} players (Top: {top_player} {top_elo})")
                success_count += 1
            except Exception as e:
                print(f"[{task_idx:2d}/{total_tasks:2d}] ERROR: {league_name} ({display_season}): {e}")

    elapsed = time.time() - start_time
    print(f"\n-------------------------------------------------------")
    print(f"  Finished in {elapsed:.2f}s")
    print(f"  Successfully recalculated: {success_count}/{total_tasks}")
    if missing_count > 0:
        print(f"  Skipped (missing raw stats): {missing_count}")
    print(f"-------------------------------------------------------\n")

def main():
    parser = argparse.ArgumentParser(
        description="Recalculate all Footy ELO ratings from existing tables/ data without scraping"
    )
    parser.add_argument(
        '--league',
        type=str,
        default=None,
        help="Optional: Filter by league (pl, laliga, bundesliga, seriea, ligue1)"
    )
    parser.add_argument(
        '--season',
        type=str,
        default=None,
        help="Optional: Filter by season (e.g. current, 2025_2026, 2020/2021)"
    )
    args = parser.parse_args()
    recalculate_tables(league_filter=args.league, season_filter=args.season)

if __name__ == '__main__':
    main()
