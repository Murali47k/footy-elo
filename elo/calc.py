import pandas as pd
import os
import sys
import glob
import json

# Add project root to path for imports
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from elo.def_elo import (
    BASE_ELO,
    ELO_CONFIG,
    get_stat_weight,
    LEAGUE_POSITION_BONUS,
    EUROPEAN_BONUS,
    COMPETITION_IMPORTANCE,   # Future hook: per-tier K-factor multiplier
    CONFIDENCE_THRESHOLDS,    # Future hook: Glicko-style confidence bands
)


# Round priority order (deepest round = highest bonus)
_ROUND_ORDER = ["winner", "final", "semi", "quarter", "r16"]


# Which standings folder feeds the bonus for each kind of competition table
_BONUS_SOURCE = {
    "league": "leagues",   # domestic league tables  -> league finish bonus ONLY
    "europe": "europe",    # UCL / UEL tables        -> knockout round bonus ONLY
}

# File prefixes of the tables that are European competitions
_EUROPEAN_PREFIXES = ("cl", "el")


def _infer_kind(input_csv: str) -> str:
    """Infer 'league' or 'europe' from a stats filename like pl_2025_2026.csv / cl.csv."""
    prefix = os.path.splitext(os.path.basename(input_csv))[0].split("_")[0].lower()
    return "europe" if prefix in _EUROPEAN_PREFIXES else "league"


def _load_team_bonus_for_season(season_str: str, kind: str = "league") -> dict:
    """
    Scan standings/ JSON files for a specific season and build a
    { team_name -> bonus } map. Returns empty dict if no data found.

    kind = "league" -> only standings/leagues/ (league finish bonus)
    kind = "europe" -> only standings/europe/  (UCL/UEL knockout bonus)
    """
    if kind not in _BONUS_SOURCE:
        raise ValueError(f"Unknown competition kind '{kind}'. Use 'league' or 'europe'.")

    standings_dir = os.path.join(project_root, "standings")
    suffix = season_str.replace("/", "_")
    team_bonus: dict[str, int] = {}

    for sub in (_BONUS_SOURCE[kind],):
        pattern = os.path.join(standings_dir, sub, f"*_{suffix}.json")
        for path in glob.glob(pattern):
            try:
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                continue

            file_season = data.get("season", "").replace("/", "_")
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
                for rnd in _ROUND_ORDER:
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

    return team_bonus


def calculate_elo(input_csv, output_csv, season: str = None, team_bonus: dict = None,
                  kind: str = None):
    """
    Calculate ELO ratings from a stats CSV and write to output_csv.

    The standings bonus is competition-specific and applied automatically when
    standings data exists for the season:
      - domestic league tables -> league finish bonus only
      - UCL / UEL tables       -> UCL/UEL knockout round bonus only

    Args:
        input_csv    : path to raw stats CSV (tables/*.csv)
        output_csv   : path to write ELO output CSV
        season       : season string used to look up standings, e.g. '2025/2026'.
                       If None the function tries to infer it from the filename.
        team_bonus   : optional pre-built { team -> bonus } dict (overrides
                       auto-loading from standings/).  Pass {} to skip bonuses.
        kind         : 'league' or 'europe'. Decides which bonus is applied.
                       If None it is inferred from the filename (cl*/el* -> 'europe',
                       everything else -> 'league').
    """
    print(f"Calculating ELO from {input_csv}...")

    df = pd.read_csv(input_csv)

    required_cols = {"ParticipantName", "TeamName", "Position"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df.fillna(0)

    # ── Raw ELO ──────────────────────────────────────────────────────────
    def compute_raw_elo(row):
        position = row["Position"]
        elo_delta = 0.0
        for stat, value in row.items():
            if stat in ("ParticipantName", "TeamName", "Position"):
                continue
            weight = get_stat_weight(position, stat)
            if weight != 0:
                elo_delta += value * weight
        return BASE_ELO + (ELO_CONFIG["K_FACTOR"] * elo_delta)

    df["ELO_RAW"] = df.apply(compute_raw_elo, axis=1)

    # ── Position-normalised ELO ───────────────────────────────────────────
    df["ELO"] = 0.0
    for pos in df["Position"].unique():
        mask = df["Position"] == pos
        pos_mean = df.loc[mask, "ELO_RAW"].mean()
        df.loc[mask, "ELO"] = BASE_ELO + (df.loc[mask, "ELO_RAW"] - pos_mean)

    df["ELO"] = (
        df["ELO"]
        .clip(lower=ELO_CONFIG["MIN_ELO"])
        .round()
        .astype(int)
    )

    # ── Standings bonus ───────────────────────────────────────────────────
    # Resolve which team_bonus map to use
    if team_bonus is None:
        # Try to infer season from filename: tables/pl_2025_2026.csv -> '2025/2026'
        if season is None:
            base = os.path.splitext(os.path.basename(input_csv))[0]  # e.g. pl_2025_2026
            parts = base.split("_")
            # Look for a YYYY_YYYY pattern at the end
            if len(parts) >= 3 and parts[-2].isdigit() and parts[-1].isdigit():
                season = f"{parts[-2]}/{parts[-1]}"
            else:
                # Current season files have no suffix (e.g. pl.csv -> 2026/2027)
                season = "2026/2027"
        if kind is None:
            kind = _infer_kind(input_csv)
        team_bonus = _load_team_bonus_for_season(season, kind)

    if team_bonus:
        df["STANDINGS_BONUS"] = df["TeamName"].map(team_bonus).fillna(0).astype(int)
        teams_with_bonus = df.loc[df["STANDINGS_BONUS"] > 0, "TeamName"].unique()
        if len(teams_with_bonus):
            print(f"  📊 {kind or 'custom'} bonus applied to {len(teams_with_bonus)} team(s): "
                  f"{', '.join(sorted(teams_with_bonus))}")
    else:
        df["STANDINGS_BONUS"] = 0

    df["ELO_FINAL"] = df["ELO"] + df["STANDINGS_BONUS"]

    # ── Final table ───────────────────────────────────────────────────────
    out_cols = ["ParticipantName", "TeamName", "Position", "ELO", "STANDINGS_BONUS", "ELO_FINAL"]
    elo_df = (
        df[out_cols]
        .sort_values("ELO_FINAL", ascending=False)
        .reset_index(drop=True)
    )

    os.makedirs(os.path.dirname(os.path.abspath(output_csv)), exist_ok=True)
    elo_df.to_csv(output_csv, index=False)

    print(f"✅ ELO saved to {output_csv}")
    print(f"   Players: {elo_df.shape[0]}")
    print(f"\nTop 10 (ELO_FINAL):")
    print(elo_df.head(10).to_string(index=False))

    return elo_df


if __name__ == '__main__':
    # Test
    calculate_elo("tables/pl.csv", "public/elo_tables/pl_elo.csv")