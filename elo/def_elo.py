BASE_ELO = 1500

ELO_CONFIG = {
    "K_FACTOR": 10,
    "MIN_ELO": 800,  
}

# ─────────────────────────────────────────────
# League finish bonuses (applied per player)
# Position 1 = Champion (+50), scaled linearly
# down to Position 10 (+2). Outside top 10: 0.
# ─────────────────────────────────────────────
LEAGUE_POSITION_BONUS = {
    1:  50,   # Champion
    2:  44,
    3:  38,
    4:  32,
    5:  26,
    6:  20,
    7:  16,
    8:  12,
    9:   6,
    10:  2,
}

# ─────────────────────────────────────────────
# UCL / UEL knockout round bonuses
# Applied to every player in the squad that
# reached that round (cumulative best round).
# UCL and UEL share the same bonus scale.
# ─────────────────────────────────────────────
EUROPEAN_BONUS = {
    "winner":      100,
    "final":        75,
    "semi":         50,
    "quarter":      25,
    "r16":          10,
}

# EUROPEAN_BONUS = {
#     "winner":      120,
#     "final":        70,
#     "semi":         40,
#     "quarter":      20,
#     "r16":          10,
# }

STAT_WEIGHTS = {
    "GK": {
        "Top scorer": 1.5,
        "Assists": 1.0,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
        "Saves per 90": 1.5,
        "Goals conceded per 90": -0.9,
        "Goals prevented": 1.2,
        "Clean sheets": 1.5,
        "Penalties conceded": -0.7,
    },
    "DEF": {
        "Top scorer": 2.0,
        "Assists": 1.5,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
        "Clearances per 90": 1.5,
        "Blocks per 90": 1.5,
        "Interceptions per 90": 2.0,
        "Successful tackles per 90": 1.5,
        "Accurate long balls per 90": 0.3,
        "Clean sheets": 1.0,
    },
    "MID": {
        "Top scorer": 1.5,
        "Assists": 1.0,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
        "Accurate passes per 90": 0.1,
        "Accurate long balls per 90": 0.3,
        "Possession won final 3rd per 90": 0.6,
        "Interceptions per 90": 3.0,
        "Expected goals (xG)": 0.2,
        "Expected assist (xA)": 0.5,
    },
    "ATT": {
        "Top scorer": 1.5,
        "Assists": 0.8,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
        "Shots on target per 90": 0.9,
        "Successful dribbles per 90": 0.7,
        "Big chances missed": -1.0,
        "Expected goals (xG)": 0.2,
        "Expected assist (xA)": 0.2,
    }
}

def get_stat_weight(position, stat_name):
    """
    Get the weight for a stat given a position
    """
    if position in STAT_WEIGHTS:
        return STAT_WEIGHTS[position].get(stat_name, 0)
    return 0