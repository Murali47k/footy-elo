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
    1:  70,   # Champion
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

# ─────────────────────────────────────────────
# UCL / UEL knockout round bonuses
# Applied to every player in the squad that
# reached that round (cumulative best round).
# UCL and UEL share the same bonus scale.
# ─────────────────────────────────────────────

EUROPEAN_BONUS = {
    "winner":      130,
    "final":        70,
    "semi":         38,
    "quarter":      20,
    "r16":          10,
}

# ─────────────────────────────────────────────
# Positional Stat Weights (EA FC Tactical Roles)
# ─────────────────────────────────────────────

STAT_WEIGHTS = {
    # ── GOALKEEPER ────────────────────────────
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

    # ── CENTRE BACK (CB) ──────────────────────
    "CB": {
        "Top scorer": 2.0,
        "Assists": 1.5,
        "Clearances per 90": 1.8,
        "Blocks per 90": 2.5,
        "Interceptions per 90": 3.0,
        "Successful tackles per 90": 2.0,
        "Clean sheets": 1.4,
        "Accurate long balls per 90": 0.7,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
    },

    # ── FULLBACKS & WING-BACKS (RB / LB / RWB / LWB) ──
    "FB": {
        "Top scorer": 2.0,
        "Assists": 1.5,
        "Successful tackles per 90": 1.8,
        "Interceptions per 90": 2.0,
        "Clearances per 90": 1.0,
        "Clean sheets": 1.2,
        "Accurate long balls per 90": 0.7,
        "Possession won final 3rd per 90": 0.6,
        "Expected assist (xA)": 0.5,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
    },

    # ── DEFENSIVE MIDFIELDER (CDM) ────────────
    "CDM": {
        "Top scorer": 1.5,
        "Assists": 1.0,
        "Interceptions per 90": 3.0,
        "Successful tackles per 90": 2.0,
        "Possession won final 3rd per 90": 0.6,
        "Accurate passes per 90": 0.1,
        "Accurate long balls per 90": 0.3,
        "Blocks per 90": 1.0,
        "Clean sheets": 0.6,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
    },

    # ── CENTRAL MIDFIELDER (CM) ───────────────
    "CM": {
        "Top scorer": 1.5,
        "Assists": 1.0,
        "Accurate passes per 90": 0.1,
        "Accurate long balls per 90": 0.3,
        "Possession won final 3rd per 90": 0.6,
        "Interceptions per 90": 2.0,
        "Successful tackles per 90": 1.4,
        "Expected goals (xG)": 0.2,
        "Expected assist (xA)": 0.5,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
    },

    # ── ATTACKING MIDFIELDER (CAM / LAM / RAM) ─
    "CAM": {
        "Top scorer": 1.5,
        "Assists": 1.0,
        "Accurate passes per 90": 0.1,
        "Possession won final 3rd per 90": 0.5,
        "Shots on target per 90": 0.5,
        "Expected assist (xA)": 0.4,
        "Expected goals (xG)": 0.2,
        "Successful dribbles per 90": 0.2,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
    },

    # ── WINGERS (RW / LW / RM / LM) ───────────
    "WING": {
        "Top scorer": 1.5,
        "Assists": 0.8,
        "Shots on target per 90": 0.8,
        "Successful dribbles per 90": 0.5,
        "Expected goals (xG)": 0.2,
        "Expected assist (xA)": 0.3,
        "Big chances missed": -0.5,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
    },

    # ── STRIKER & CENTRE FORWARD (ST / CF) ────
    "ST": {
        "Top scorer": 1.7,
        "Assists": 0.8,
        "Shots on target per 90": 0.9,
        "Successful dribbles per 90": 0.25,
        "Expected goals (xG)": 0.2,
        "Expected assist (xA)": 0.2,
        "Big chances missed": -0.7,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
    },

    # ── LEGACY 4-CORE FALLBACKS ───────────────
    "DEF": {
        "Top scorer": 2.0,
        "Assists": 1.5,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
        "Clearances per 90": 1.5,
        "Blocks per 90": 1.5,
        "Interceptions per 90": 2.0,
        "Successful tackles per 90": 1.8,
        "Accurate long balls per 90": 0.5,
        "Clean sheets": 1.2,
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

# Maps specific EA FC positions to their tactical role weight profile
ROLE_MAP = {
    'GK': 'GK',
    
    # Defenders
    'CB': 'CB',
    'RB': 'FB',
    'LB': 'FB',
    'RWB': 'FB',
    'LWB': 'FB',
    'DEF': 'DEF',

    # Midfielders
    'CDM': 'CDM',
    'CM': 'CM',
    'CAM': 'CAM',
    'RAM': 'CAM',
    'LAM': 'CAM',
    'MID': 'MID',

    # Wide Attackers / Wingers
    'RW': 'WING',
    'LW': 'WING',
    'RM': 'WING',
    'LM': 'WING',

    # Strikers
    'ST': 'ST',
    'RF': 'WING',
    'LF': 'WING',
    'ATT': 'ATT',
}

def get_stat_weight(position, stat_name):
    """
    Get the weight for a stat given a position or role.
    Resolves specific positions (e.g. 'RB', 'CAM', 'ST') to their profile.
    """
    role = ROLE_MAP.get(position, position)
    if role in STAT_WEIGHTS:
        return STAT_WEIGHTS[role].get(stat_name, 0)
    if position in STAT_WEIGHTS:
        return STAT_WEIGHTS[position].get(stat_name, 0)
    return 0