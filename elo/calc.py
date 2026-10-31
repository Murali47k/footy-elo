import math
import pandas as pd
import os
import sys
import glob
import json

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from elo.def_elo import (
    BASE_ELO,
    ELO_CONFIG,
    GLICKO_CONFIG,
    COMPETITION_IMPORTANCE,
    get_stat_weight,
    LEAGUE_POSITION_BONUS,
    EUROPEAN_BONUS,
)

_ROUND_ORDER = ["winner", "final", "semi", "quarter", "r16"]

_BONUS_SOURCE = {
    "league": "leagues",
    "europe": "europe",
}

_EUROPEAN_PREFIXES = ("cl", "el")


def _infer_kind(input_csv: str) -> str:
    prefix = os.path.splitext(os.path.basename(input_csv))[0].split("_")[0].lower()
    return "europe" if prefix in _EUROPEAN_PREFIXES else "league"


def glicko_rd(appearances: int) -> float:
    """
    Compute Rating Deviation from appearance count.

    Simplified Glicko-inspired formula:
        RD = BASE_RD / sqrt(max(appearances, 1))
    Clamped to [MIN_RD, BASE_RD].

    A player with 1 appearance has near-maximum uncertainty (RD ~ BASE_RD).
    A full-season regular (38 apps) converges toward MIN_RD.
    """
    cfg = GLICKO_CONFIG
    raw = cfg["BASE_RD"] / math.sqrt(max(appearances, 1))
    return round(max(cfg["MIN_RD"], min(cfg["BASE_RD"], raw)), 1)


def glicko_confidence_label(rd: float) -> str:
    cfg = GLICKO_CONFIG
    span = cfg["BASE_RD"] - cfg["MIN_RD"]
    if rd >= cfg["BASE_RD"] - 0.1 * span:
        return "provisional"
    if rd >= cfg["BASE_RD"] - 0.4 * span:
        return "low"
    if rd >= cfg["BASE_RD"] - 0.7 * span:
        return "medium"
    return "high"


def _load_team_bonus_for_season(season_str: str, kind: str = "league") -> dict:
    if kind not in _BONUS_SOURCE:
        raise ValueError(f"Unknown competition kind '{kind}'.")

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

            if data.get("season", "").replace("/", "_") != suffix:
                continue

            if sub == "leagues":
                for entry in data.get("standings", []):
                    pos = entry.get("position")
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
                    for team in ([val] if isinstance(val, str) else list(val)):
                        team = team.strip()
                        if team and team not in team_round:
                            team_round[team] = rnd
                for team, rnd in team_round.items():
                    bonus = EUROPEAN_BONUS.get(rnd, 0)
                    if bonus:
                        team_bonus[team] = team_bonus.get(team, 0) + bonus

    return team_bonus


def calculate_elo(
    input_csv: str,
    output_csv: str,
    season: str = None,
    team_bonus: dict = None,
    kind: str = None,
    competition_tier: str = "domestic",
) -> pd.DataFrame:
    """
    Calculate ELO + Glicko-style Rating Deviation from a stats CSV.

    Pipeline
    --------
    1. Raw Score
         ELO_RAW = BASE_ELO + K × importance × Σ(stat × weight[position])
         where importance = COMPETITION_IMPORTANCE[competition_tier]

    2. Position-Mean Normalisation
         ELO = BASE_ELO + (ELO_RAW − mean(ELO_RAW for position))

    3. Glicko RD
         RD = BASE_RD / sqrt(appearances), clamped to [MIN_RD, BASE_RD]
         Confidence label: provisional / low / medium / high

    4. Standings Bonus
         ELO_FINAL = ELO + STANDINGS_BONUS

    Args
    ----
    input_csv        : path to raw stats CSV  (tables/*.csv)
    output_csv       : path to write ELO output CSV
    season           : e.g. '2025/2026'; inferred from filename if None
    team_bonus       : pre-built {team -> bonus}; pass {} to skip
    kind             : 'league' or 'europe'; inferred from filename if None
    competition_tier : key into COMPETITION_IMPORTANCE for K-factor scaling
    """
    print(f"Calculating ELO from {input_csv}...")

    df = pd.read_csv(input_csv)

    required = {"ParticipantName", "TeamName", "Position"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df.fillna(0)

    k = ELO_CONFIG["K_FACTOR"] * COMPETITION_IMPORTANCE.get(competition_tier, 1.0)

    # ── Stage 1: Raw Score ────────────────────────────────────────────────
    def _raw_elo(row):
        pos = row["Position"]
        delta = sum(
            row[stat] * get_stat_weight(pos, stat)
            for stat in row.index
            if stat not in ("ParticipantName", "TeamName", "Position")
        )
        return BASE_ELO + k * delta

    df["ELO_RAW"] = df.apply(_raw_elo, axis=1)

    # ── Stage 2: Position-Mean Normalisation ─────────────────────────────
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

    # ── Stage 3: Glicko-style Rating Deviation ────────────────────────────
    # Derive appearance proxy from Goals per 90 column availability;
    # fall back to estimating from xG total if appearances column absent.
    # When an explicit "Appearances" column exists it is used directly.
    if "Appearances" in df.columns:
        df["RD"] = df["Appearances"].apply(glicko_rd)
    elif "Goals per 90" in df.columns and "Expected goals (xG)" in df.columns:
        # Estimate appearances = xG_total / xG_per90, floored at 1.
        # This is an approximation; provide an Appearances column for accuracy.
        def _est_apps(row):
            xg_p90 = row.get("Expected goals (xG) per 90", 0)
            xg_tot = row.get("Expected goals (xG)", 0)
            if xg_p90 > 0:
                return max(1, round(xg_tot / xg_p90))
            return 1
        df["APPS_EST"] = df.apply(_est_apps, axis=1)
        df["RD"] = df["APPS_EST"].apply(glicko_rd)
        df.drop(columns=["APPS_EST"], inplace=True)
    else:
        df["RD"] = float(GLICKO_CONFIG["BASE_RD"])

    df["CONFIDENCE"] = df["RD"].apply(glicko_confidence_label)

    # ── Stage 4: Standings Bonus ──────────────────────────────────────────
    if team_bonus is None:
        if season is None:
            base = os.path.splitext(os.path.basename(input_csv))[0]
            parts = base.split("_")
            if len(parts) >= 3 and parts[-2].isdigit() and parts[-1].isdigit():
                season = f"{parts[-2]}/{parts[-1]}"
            else:
                season = "2026/2027"
        if kind is None:
            kind = _infer_kind(input_csv)
        team_bonus = _load_team_bonus_for_season(season, kind)

    if team_bonus:
        df["STANDINGS_BONUS"] = df["TeamName"].map(team_bonus).fillna(0).astype(int)
        teams_with_bonus = df.loc[df["STANDINGS_BONUS"] > 0, "TeamName"].unique()
        if len(teams_with_bonus):
            print(f"  {kind or 'custom'} bonus → {len(teams_with_bonus)} team(s): "
                  f"{', '.join(sorted(teams_with_bonus))}")
    else:
        df["STANDINGS_BONUS"] = 0

    df["ELO_FINAL"] = df["ELO"] + df["STANDINGS_BONUS"]

    # ── Output ────────────────────────────────────────────────────────────
    out_cols = [
        "ParticipantName", "TeamName", "Position",
        "ELO", "RD", "CONFIDENCE", "STANDINGS_BONUS", "ELO_FINAL",
    ]
    elo_df = (
        df[out_cols]
        .sort_values("ELO_FINAL", ascending=False)
        .reset_index(drop=True)
    )

    os.makedirs(os.path.dirname(os.path.abspath(output_csv)), exist_ok=True)
    elo_df.to_csv(output_csv, index=False)

    print(f"ELO saved → {output_csv}  ({elo_df.shape[0]} players)")
    print(f"\nTop 10 (ELO_FINAL):")
    print(elo_df.head(10).to_string(index=False))

    return elo_df


if __name__ == "__main__":
    calculate_elo("tables/pl.csv", "public/elo_tables/pl_elo.csv")