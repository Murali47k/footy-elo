#!/usr/bin/env python3
"""
scripts/apply_bonuses.py
────────────────────────────────────────────────────────────────
Apply league & European standings bonuses to player ELO ratings.

Reads from:  standings/leagues/*.json  +  standings/europe/*.json
Writes to:   public/elo_tables/*_elo_bonus_<season>.csv

Usage:
  # Apply bonuses for all seasons that have standings data
  python scripts/apply_bonuses.py

  # Only a specific season
  python scripts/apply_bonuses.py --season 2025/2026

  # Only a specific league
  python scripts/apply_bonuses.py --season 2025/2026 --league pl

  # Dry-run: show team bonuses but don't write files
  python scripts/apply_bonuses.py --dry-run
"""

import os
import sys
import glob
import json
import argparse
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from elo.apply_standings_bonus import (
    build_team_bonus_map,
    apply_bonuses_for_season,
    _season_suffix,
    LEAGUE_FILE_MAP,
    EUROPEAN_FILE_MAP,
)

STANDINGS_DIR = os.path.join(PROJECT_ROOT, "standings")
ELO_DIR       = os.path.join(PROJECT_ROOT, "public", "elo_tables")


def discover_seasons(standings_dir: str) -> list[str]:
    """Return sorted list of unique season strings found in all standings JSON files."""
    seasons = set()
    for sub in ("leagues", "europe"):
        for path in glob.glob(os.path.join(standings_dir, sub, "*.json")):
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            season = data.get("season")
            if season:
                seasons.add(season)
    return sorted(seasons, reverse=True)


def dry_run(standings_dir: str, season_filter: str = None):
    """Print team bonus map without writing any files."""
    print("\n" + "=" * 60)
    print("  DRY RUN — Team Bonus Preview")
    print("=" * 60)
    team_bonus = build_team_bonus_map(standings_dir)

    if season_filter:
        # Re-build filtered to single season
        from elo.apply_standings_bonus import ROUND_ORDER
        from elo.def_elo import LEAGUE_POSITION_BONUS, EUROPEAN_BONUS
        suffix = _season_suffix(season_filter)
        team_bonus = {}
        for sub in ("leagues", "europe"):
            for path in glob.glob(os.path.join(standings_dir, sub, "*.json")):
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
                if _season_suffix(data.get("season", "")) != suffix:
                    continue
                if sub == "leagues":
                    for entry in data.get("standings", []):
                        pos  = entry.get("position")
                        team = entry.get("team", "").strip()
                        bonus = LEAGUE_POSITION_BONUS.get(pos, 0)
                        if bonus and team:
                            team_bonus[team] = team_bonus.get(team, 0) + bonus
                elif sub == "europe":
                    results = data.get("results", {})
                    team_round = {}
                    for rnd in ROUND_ORDER:
                        val = results.get(rnd)
                        if val is None:
                            continue
                        teams_in_round = [val] if isinstance(val, str) else list(val)
                        for team in teams_in_round:
                            team = team.strip()
                            if team and team not in team_round:
                                team_round[team] = rnd
                    for team, rnd in team_round.items():
                        bonus = EUROPEAN_BONUS.get(rnd, 0)
                        if bonus:
                            team_bonus[team] = team_bonus.get(team, 0) + bonus

    print(f"\n{'Team':<35} {'Total Bonus':>12}")
    print("-" * 50)
    for team, bonus in sorted(team_bonus.items(), key=lambda x: -x[1]):
        print(f"  {team:<33} +{bonus:>4}")
    print(f"\n  {len(team_bonus)} teams with non-zero bonus\n")


def main():
    parser = argparse.ArgumentParser(
        description="Apply league & European standings ELO bonuses"
    )
    parser.add_argument(
        "--season", type=str, default=None,
        help="Season to process, e.g. '2025/2026' (default: all seasons with data)"
    )
    parser.add_argument(
        "--league", type=str, default=None,
        help="League prefix to filter output, e.g. 'pl', 'cl', 'el'"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show team bonus totals without writing files"
    )
    args = parser.parse_args()

    if args.dry_run:
        dry_run(STANDINGS_DIR, season_filter=args.season)
        return

    seasons = [args.season] if args.season else discover_seasons(STANDINGS_DIR)

    if not seasons:
        print("❌ No standings JSON files found in standings/. "
              "Run standings/generate_sample_standings.py first.")
        return

    print("\n" + "=" * 60)
    print("  Footy ELO — Standings Bonus Applicator")
    print(f"  Seasons found : {seasons}")
    print(f"  Standings dir : {STANDINGS_DIR}")
    print(f"  Output dir    : {ELO_DIR}")
    print("=" * 60)

    total_files = 0
    start = time.time()

    for season in seasons:
        print(f"\n── Season: {season} ──────────────────────────────────────")
        summary = apply_bonuses_for_season(
            season_str=season,
            standings_dir=STANDINGS_DIR,
            elo_dir=ELO_DIR,
            league_filter=args.league,
        )

        if not summary:
            print(f"  ⚠️  No ELO tables found for {season}. "
                  "Run recalculate_all_elo.py first.")
            continue

        for filename, player_count in summary.items():
            print(f"  ✅ {filename:<50}  ({player_count} players)")
        total_files += len(summary)

    elapsed = time.time() - start
    print(f"\n{'─' * 60}")
    print(f"  Done! {total_files} bonus file(s) written in {elapsed:.2f}s")
    print(f"{'─' * 60}\n")


if __name__ == "__main__":
    main()
