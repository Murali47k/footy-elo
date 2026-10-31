BASE_ELO = 1500

ELO_CONFIG = {
    "K_FACTOR":  10,
    "MIN_ELO":   800,
}

# Glicko-style Rating Deviation config.
# RD = BASE_RD / sqrt(max(appearances, 1)), clamped to [MIN_RD, BASE_RD].
# Players with few appearances have high RD (uncertain rating);
# full-season regulars converge toward MIN_RD (established rating).
GLICKO_CONFIG = {
    "BASE_RD": 350,   # starting RD for a player with 0 appearances
    "MIN_RD":   50,   # floor — even 38-game players retain some uncertainty
    "C":        15,   # RD grows by C per match without data (volatility)
}

# Per-tier K-factor multiplier applied when per-match competition data is available.
COMPETITION_IMPORTANCE = {
    "ucl_knockout": 1.4,
    "ucl_group":    1.2,
    "uel_knockout": 1.1,
    "uel_group":    1.0,
    "domestic":     1.0,
    "domestic_cup": 0.8,
}

# League finish bonuses (additive, applied after position normalisation).
LEAGUE_POSITION_BONUS = {
    1:  70,
    2:  50,
    3:  38,
    4:  32,
    5:  24,
    6:  20,
    7:  16,
    8:  12,
    9:   8,
    10:  4,
}

# UCL / UEL knockout round bonuses (best round reached per player).
EUROPEAN_BONUS = {
    "winner":  130,
    "final":    70,
    "semi":     38,
    "quarter":  20,
    "r16":      10,
}

# ---------------------------------------------------------------------------
# Positional Stat Weights  (EA FC Tactical Roles)
#
# Columns available in every stats CSV:
#   Accurate long balls per 90 | Accurate passes per 90 | Assists
#   Big chances created | Big chances missed | Blocks per 90
#   Chances created | Clean sheets | Clearances per 90
#   Expected assist (xA) | Expected assist (xA) per 90
#   Expected goals (xG) | Expected goals (xG) per 90
#   Expected goals on target (xGOT) | Fouls committed per 90
#   Goals conceded per 90 | Goals per 90 | Goals prevented
#   Interceptions per 90 | Penalties conceded | Penalties won
#   Possession won final 3rd per 90 | Red cards | Save percentage
#   Saves per 90 | Shots on target per 90 | Successful dribbles per 90
#   Successful tackles per 90 | Top scorer | Yellow cards
# ---------------------------------------------------------------------------

STAT_WEIGHTS = {

    # ── GOALKEEPER ────────────────────────────────────────────────────────
    "GK": {
        "Saves per 90":                   1.5,
        "Clean sheets":                   1.5,
        "Goals prevented":                1.2,
        "Save percentage":                0.1,   # bonus for shot-stopping %
        "Top scorer":                     1.5,
        "Assists":                        1.0,
        "Penalties won":                  0.3,
        "Goals conceded per 90":         -0.9,
        "Fouls committed per 90":        -0.9,
        "Penalties conceded":            -0.7,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },

    # ── CENTRE BACK ───────────────────────────────────────────────────────
    "CB": {
        "Interceptions per 90":           3.0,
        "Blocks per 90":                  2.5,
        "Successful tackles per 90":      2.0,
        "Top scorer":                     2.0,
        "Assists":                        1.5,
        "Clearances per 90":              1.8,
        "Clean sheets":                   1.4,
        "Accurate long balls per 90":     0.7,
        "Accurate passes per 90":         0.1,
        "Penalties won":                  0.2,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },

    # ── FULLBACK & WING-BACK ──────────────────────────────────────────────
    "FB": {
        "Interceptions per 90":           2.0,
        "Successful tackles per 90":      1.8,
        "Top scorer":                     2.0,
        "Assists":                        1.5,
        "Clearances per 90":              1.0,
        "Clean sheets":                   1.2,
        "Accurate long balls per 90":     0.7,
        "Possession won final 3rd per 90":0.6,
        "Expected assist (xA)":           0.5,
        "Expected assist (xA) per 90":    0.2,
        "Chances created":                0.1,
        "Penalties won":                  0.2,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },

    # ── DEFENSIVE MIDFIELDER ─────────────────────────────────────────────
    "CDM": {
        "Interceptions per 90":           3.0,
        "Successful tackles per 90":      2.0,
        "Top scorer":                     1.5,
        "Assists":                        1.0,
        "Blocks per 90":                  1.0,
        "Clean sheets":                   0.6,
        "Possession won final 3rd per 90":0.6,
        "Accurate long balls per 90":     0.3,
        "Accurate passes per 90":         0.1,
        "Chances created":                0.1,
        "Expected goals (xG) per 90":     0.1,
        "Penalties won":                  0.2,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },

    # ── CENTRAL MIDFIELDER ───────────────────────────────────────────────
    "CM": {
        "Interceptions per 90":           2.0,
        "Top scorer":                     1.5,
        "Successful tackles per 90":      1.4,
        "Assists":                        1.0,
        "Possession won final 3rd per 90":0.6,
        "Expected assist (xA)":           0.5,
        "Expected assist (xA) per 90":    0.2,
        "Accurate long balls per 90":     0.3,
        "Chances created":                0.2,
        "Big chances created":            0.3,
        "Expected goals (xG)":            0.2,
        "Expected goals (xG) per 90":     0.1,
        "Goals per 90":                   0.2,
        "Accurate passes per 90":         0.1,
        "Penalties won":                  0.2,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },

    # ── ATTACKING MIDFIELDER ─────────────────────────────────────────────
    "CAM": {
        "Top scorer":                     1.5,
        "Assists":                        1.0,
        "Shots on target per 90":         0.5,
        "Expected assist (xA)":           0.4,
        "Expected assist (xA) per 90":    0.2,
        "Possession won final 3rd per 90":0.5,
        "Big chances created":            0.5,
        "Chances created":                0.2,
        "Successful dribbles per 90":     0.2,
        "Expected goals (xG)":            0.2,
        "Expected goals on target (xGOT)":0.2,
        "Goals per 90":                   0.3,
        "Accurate passes per 90":         0.1,
        "Penalties won":                  0.3,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },

    # ── WINGER ───────────────────────────────────────────────────────────
    "WING": {
        "Top scorer":                     1.5,
        "Assists":                        0.8,
        "Shots on target per 90":         0.8,
        "Successful dribbles per 90":     0.5,
        "Expected goals (xG)":            0.2,
        "Expected goals on target (xGOT)":0.3,
        "Expected goals (xG) per 90":     0.1,
        "Expected assist (xA)":           0.3,
        "Expected assist (xA) per 90":    0.2,
        "Big chances created":            0.4,
        "Chances created":                0.1,
        "Goals per 90":                   0.3,
        "Penalties won":                  0.3,
        "Big chances missed":            -0.5,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },

    # ── STRIKER ──────────────────────────────────────────────────────────
    "ST": {
        "Top scorer":                     1.7,
        "Shots on target per 90":         0.9,
        "Assists":                        0.8,
        "Expected goals on target (xGOT)":0.5,
        "Expected goals (xG)":            0.2,
        "Expected goals (xG) per 90":     0.2,
        "Goals per 90":                   0.4,
        "Successful dribbles per 90":     0.25,
        "Big chances created":            0.2,
        "Expected assist (xA)":           0.2,
        "Penalties won":                  0.4,
        "Big chances missed":            -0.7,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },

    # ── LEGACY FALLBACKS (DEF / MID / ATT) ───────────────────────────────
    "DEF": {
        "Top scorer":                     2.0,
        "Assists":                        1.5,
        "Clearances per 90":              1.5,
        "Blocks per 90":                  1.5,
        "Interceptions per 90":           2.0,
        "Successful tackles per 90":      1.8,
        "Accurate long balls per 90":     0.5,
        "Clean sheets":                   1.2,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },
    "MID": {
        "Top scorer":                     1.5,
        "Assists":                        1.0,
        "Accurate passes per 90":         0.1,
        "Accurate long balls per 90":     0.3,
        "Possession won final 3rd per 90":0.6,
        "Interceptions per 90":           3.0,
        "Expected goals (xG)":            0.2,
        "Expected assist (xA)":           0.5,
        "Chances created":                0.1,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },
    "ATT": {
        "Top scorer":                     1.5,
        "Assists":                        0.8,
        "Shots on target per 90":         0.9,
        "Successful dribbles per 90":     0.7,
        "Expected goals (xG)":            0.2,
        "Expected goals on target (xGOT)":0.3,
        "Expected assist (xA)":           0.2,
        "Goals per 90":                   0.3,
        "Big chances missed":            -1.0,
        "Fouls committed per 90":        -0.9,
        "Yellow cards":                  -1.5,
        "Red cards":                     -2.0,
    },
}

ROLE_MAP = {
    "GK":  "GK",
    "CB":  "CB",
    "RB":  "FB",
    "LB":  "FB",
    "RWB": "FB",
    "LWB": "FB",
    "DEF": "DEF",
    "CDM": "CDM",
    "CM":  "CM",
    "CAM": "CAM",
    "RAM": "CAM",
    "LAM": "CAM",
    "MID": "MID",
    "RW":  "WING",
    "LW":  "WING",
    "RM":  "WING",
    "LM":  "WING",
    "ST":  "ST",
    "RF":  "WING",
    "LF":  "WING",
    "ATT": "ATT",
}


def get_stat_weight(position: str, stat_name: str) -> float:
    role = ROLE_MAP.get(position, position)
    if role in STAT_WEIGHTS:
        return STAT_WEIGHTS[role].get(stat_name, 0.0)
    if position in STAT_WEIGHTS:
        return STAT_WEIGHTS[position].get(stat_name, 0.0)
    return 0.0