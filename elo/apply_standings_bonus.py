#!/usr/bin/env python3
"""
elo/apply_standings_bonus.py
────────────────────────────────────────────────────────────────
Reads standings JSON files from standings/ and applies ELO bonuses
to matching player ELO CSVs in public/elo_tables/.

Bonus rules (defined in elo/def_elo.py):
  League top 10  → LEAGUE_POSITION_BONUS[position]  (Champion +50 → 10th +2)
  UCL/UEL rounds → EUROPEAN_BONUS[round]             (Winner +100, R16 +10)

Output:
  public/elo_tables/<prefix>_elo_bonus_<season>.csv
  (same schema as the base ELO CSV + an "ELO_BONUS" column)
"""

import os
import sys
import json
import glob

import pandas as pd

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from elo.def_elo import LEAGUE_POSITION_BONUS, EUROPEAN_BONUS

# ── Internal helpers ────────────────────────────────────────────────────────

LEAGUE_FILE_MAP = {
    "Premier League":  "pl",
    "La Liga":         "laliga",
    "Bundesliga":      "bundesliga",
    "Serie A":         "seriea",
    "Ligue 1":         "ligue1",
}

EUROPEAN_FILE_MAP = {
    "Champions League": "cl",
    "Europa League":    "el",
}

# Canonical round order — deepest round wins (highest bonus)
ROUND_ORDER = ["winner", "final", "semi", "quarter", "r16"]


def _season_suffix(season_str: str) -> str:
    """
    '2025/2026' -> '2025_2026'
    '2025_2026' -> '2025_2026'
    """
    return season_str.replace("/", "_")


def _elo_path(prefix: str, season_suffix: str, elo_dir: str) -> str:
    """
    Return the path to the base ELO CSV for a given league + season.
    Current season (2026/27) files have no suffix: pl_elo.csv
    Historical seasons: pl_elo_2025_2026.csv
    """
    current = os.path.join(elo_dir, f"{prefix}_elo.csv")
    historical = os.path.join(elo_dir, f"{prefix}_elo_{season_suffix}.csv")
    if os.path.exists(historical):
        return historical
    if os.path.exists(current):
        return current
    return None


def _out_path(prefix: str, season_suffix: str, elo_dir: str) -> str:
    return os.path.join(elo_dir, f"{prefix}_elo_bonus_{season_suffix}.csv")


# ── Public API ───────────────────────────────────────────────────────────────

def build_team_bonus_map(standings_dir: str) -> dict:
    """
    Scan all JSON files in standings/ and build a flat map:
      { team_name -> total_bonus_points }

    Teams can receive bonuses from multiple sources (e.g. league + UCL),
    and all bonuses are summed.
    """
    team_bonus: dict[str, int] = {}

    # ── League standings ─────────────────────────────────────────────────
    for path in glob.glob(os.path.join(standings_dir, "leagues", "*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        season = data.get("season", "?")
        league = data.get("league", "?")

        for entry in data.get("standings", []):
            pos  = entry.get("position")
            team = entry.get("team", "").strip()
            bonus = LEAGUE_POSITION_BONUS.get(pos, 0)
            if bonus and team:
                team_bonus[team] = team_bonus.get(team, 0) + bonus
                print(f"  [League] {team:<30} pos {pos:2d}  +{bonus}  ({league} {season})")

    # ── European competitions ────────────────────────────────────────────
    for path in glob.glob(os.path.join(standings_dir, "europe", "*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        season = data.get("season", "?")
        comp   = data.get("competition", "?")
        results = data.get("results", {})

        # Build team → best round reached
        team_round: dict[str, str] = {}

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
                print(f"  [Europe] {team:<30} {rnd:<8}  +{bonus}  ({comp} {season})")

    return team_bonus


def apply_bonus_to_elo(
    elo_csv: str,
    team_bonus: dict,
    output_csv: str,
):
    """
    Load an ELO CSV, add STANDINGS_BONUS column, write output_csv.
    Returns the modified DataFrame or None if elo_csv doesn't exist.
    """
    if not os.path.exists(elo_csv):
        return None

    df = pd.read_csv(elo_csv)

    # Map team -> bonus (0 if not in top 10 / not in Europe)
    df["STANDINGS_BONUS"] = df["TeamName"].map(team_bonus).fillna(0).astype(int)
    df["ELO_FINAL"] = df["ELO"] + df["STANDINGS_BONUS"]

    # Re-sort by ELO_FINAL
    df = df.sort_values("ELO_FINAL", ascending=False).reset_index(drop=True)

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df.to_csv(output_csv, index=False)
    return df


def apply_bonuses_for_season(
    season_str: str,
    standings_dir: str,
    elo_dir: str,
    league_filter: str = None,
) -> dict:
    """
    Given a season (e.g. '2025/2026'), build the team bonus map from all
    relevant standings files for that season, then apply to every league
    + European competition ELO table.

    Returns a summary dict { filename: player_count }.
    """
    suffix = _season_suffix(season_str)
    summary = {}

    # Filter standings files to only this season
    season_standings = os.path.join(standings_dir)
    team_bonus = {}

    for sub in ("leagues", "europe"):
        for path in glob.glob(os.path.join(season_standings, sub, "*.json")):
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            file_season = _season_suffix(data.get("season", ""))
            if file_season != suffix:
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
                team_round: dict[str, str] = {}
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

    if not team_bonus:
        print(f"  ⚠️  No standings data found for season {season_str}")
        return summary

    # Apply to all competitions
    all_prefixes = list(LEAGUE_FILE_MAP.values()) + list(EUROPEAN_FILE_MAP.values())
    if league_filter:
        all_prefixes = [p for p in all_prefixes if league_filter.lower() in p]

    for prefix in all_prefixes:
        elo_csv = _elo_path(prefix, suffix, elo_dir)
        if not elo_csv:
            continue
        out_csv = _out_path(prefix, suffix, elo_dir)
        df = apply_bonus_to_elo(elo_csv, team_bonus, out_csv)
        if df is not None:
            summary[os.path.basename(out_csv)] = len(df)

    return summary
