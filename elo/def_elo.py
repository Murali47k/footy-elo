BASE_ELO = 1500

ELO_CONFIG = {
    "K_FACTOR": 10,
    "MIN_ELO": 800,  
}

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
        "Top scorer": 1.5,
        "Assists": 1.0,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
        "Clearances per 90": 1.5,
        "Blocks per 90": 1.5,
        "Interceptions per 90": 3.0,
        "Successful tackles per 90": 2.0,
        "Accurate long balls per 90": 0.2,
        "Clean sheets": 0.9,
        
    },
    "MID": {
        "Top scorer": 1.5,
        "Assists": 1.0,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
        "Accurate passes per 90": 0.1,
        "Accurate long balls per 90": 0.2,
        "Possession won final 3rd per 90": 0.6,
        "Interceptions per 90": 3.0,
        "Expected goals (xG)": 0.2,
        "Expected assist (xA)": 0.5,
    },
    "ATT": {
        "Top scorer": 1.5,
        "Assists": 1.0,
        "Fouls committed per 90": -0.9,
        "Yellow cards": -1.5,
        "Red cards": -2.0,
        "Goals per 90": 1.6,
        "Shots on target per 90": 1.0,
        "Successful dribbles per 90": 1.2,
        "Big chances missed": -0.8,
    }
}

def get_stat_weight(position, stat_name):
    """
    Get the weight for a stat given a position
    """
    if position in STAT_WEIGHTS:
        return STAT_WEIGHTS[position].get(stat_name, 0)
    return 0