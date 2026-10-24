import json
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup

STATS = [
    "Accurate long balls per 90",
    "Accurate passes per 90",
    "Assists",
    "Big chances created",
    "Big chances missed",
    "Blocks per 90",
    "Chances created",
    "Clean sheets",
    "Clearances per 90",
    "Expected assist (xA)",
    "Expected assist (xA) per 90",
    "Expected goals (xG)",
    "Expected goals (xG) per 90",
    "Expected goals on target (xGOT)",
    "Fouls committed per 90",
    "Goals conceded per 90",
    "Goals per 90",
    "Goals prevented",
    "Interceptions per 90",
    "Penalties conceded",
    "Penalties won",
    "Possession won final 3rd per 90",
    "Red cards",
    "Save percentage",
    "Saves per 90",
    "Shots on target per 90",
    "Successful dribbles per 90",
    "Successful tackles per 90",
    "Top scorer",
    "Yellow cards"
]

# Aliases in case FotMob renames some headers
STAT_ALIASES = {
    "Successful tackles per 90": ["Successful tackles per 90", "Tackles per 90"],
    "Goals per 90": ["Goals per 90", "Goals per 90 mins"],
    "Saves per 90": ["Saves per 90", "Saves per 90 mins"],
    "Assists": ["Assists"],
    "Top scorer": ["Top scorer", "Goals"]
}

# Comprehensive FotMob / Opta pitch formation code mapping to EA FC positions
FOTMOB_POSITION_MAP = {
    # Goalkeepers
    1: 'GK',
    11: 'GK',

    # Defenders: Centre Backs
    2: 'CB',
    34: 'CB',   # Right CB
    35: 'CB',   # Central CB
    36: 'CB',   # Left CB

    # Defenders: Fullbacks & Wing-backs
    32: 'RWB',
    33: 'RB',
    37: 'LB',
    38: 'LWB',
    49: 'RB',
    51: 'RWB',
    53: 'RB',
    57: 'LB',
    59: 'LWB',

    # Midfield: Defensive & Holding Midfielders (CDM)
    55: 'CDM',
    63: 'CDM',
    64: 'CDM',  # Right CDM
    65: 'CDM',  # Central CDM
    66: 'CDM',  # Left CDM
    67: 'CM',
    74: 'CDM',

    # Midfield: Central & Box-to-Box (CM)
    3: 'CM',
    73: 'CM',   # Right CM
    75: 'CM',   # Central CM
    76: 'CM',   # Left CM

    # Midfield & Attack: Wide Midfielders / Wingers (RM / LM / RW / LW)
    62: 'RM',
    68: 'LM',
    71: 'RM',
    72: 'RM',
    78: 'LM',
    79: 'LM',
    82: 'RW',
    83: 'RW',
    84: 'RAM',
    86: 'LAM',
    87: 'LW',
    88: 'LW',
    103: 'RW',
    107: 'LW',

    # Attack: Attacking Midfielders & Playmakers (CAM)
    77: 'CAM',
    85: 'CAM',  # Central CAM (#10)
    95: 'CAM',

    # Attack: Centre Forwards & Strikers (CF / ST)
    4: 'ST',
    104: 'CF',  # Second Striker / RF
    105: 'CF',  # Centre Forward
    106: 'CF',  # Second Striker / LF
    115: 'ST',  # Pure Striker (#9)
    116: 'ST'
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.fotmob.com/',
}

def get_position(pos_list):
    """
    Derives the EA FC position (e.g. ST, CAM, CDM, CB, RB, LB, RW, LW, GK)
    from FotMob's Opta coordinate codes.
    """
    if pos_list is None or isinstance(pos_list, float):
        return 'Unknown'

    if isinstance(pos_list, list):
        if not pos_list:
            return 'Unknown'
        pos_code = pos_list[0]
    elif isinstance(pos_list, int):
        pos_code = pos_list
    else:
        return 'Unknown'

    # Direct lookup from verified mapping
    if pos_code in FOTMOB_POSITION_MAP:
        return FOTMOB_POSITION_MAP[pos_code]

    # Dynamic fallback based on Opta (Row, Col) pitch grid
    row = pos_code // 10
    col = pos_code % 10

    if row <= 1:
        return 'GK'
    elif row in (3, 4, 5):
        if col <= 2:
            return 'RWB'
        elif col == 3:
            return 'RB'
        elif col >= 8:
            return 'LWB'
        elif col == 7:
            return 'LB'
        else:
            return 'CB'
    elif row == 6:
        if col <= 2:
            return 'RM'
        elif col >= 8:
            return 'LM'
        else:
            return 'CDM'
    elif row == 7:
        if col <= 2:
            return 'RM'
        elif col >= 8:
            return 'LM'
        elif col == 4:
            return 'CDM'
        elif col == 7:
            return 'CAM'
        else:
            return 'CM'
    elif row in (8, 9):
        if col <= 3:
            return 'RW'
        elif col >= 7:
            return 'LW'
        else:
            return 'CAM'
    elif row >= 10:
        if col <= 3:
            return 'RW'
        elif col >= 7:
            return 'LW'
        elif col in (4, 6):
            return 'CF'
        else:
            return 'ST'

    return 'CM'

def fetch_stat_catalog(league_id, season=None):
    """
    Fetch the player stats catalog from FotMob pageProps for a league and season.
    Returns a dict mapping stat title -> direct JSON URL.
    """
    import urllib.parse
    url = f"https://www.fotmob.com/api/leagues/{league_id}"
    if season:
        url += f"?season={urllib.parse.quote(season)}"
    res = requests.get(url, headers=HEADERS, timeout=12)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, 'html.parser')
    script = soup.find('script', id='__NEXT_DATA__')
    if not script:
        raise ValueError("Could not parse FotMob application data (__NEXT_DATA__ not found)")

    page_data = json.loads(script.string)
    props = page_data.get('props', {}).get('pageProps', {})
    players_stats = props.get('stats', {}).get('players', [])

    stat_map = {}
    for p in players_stats:
        header = p.get('header')
        fetch_url = p.get('fetchAllUrl')
        if header and fetch_url:
            stat_map[header] = fetch_url

    return stat_map

def fetch_league_stats(league_id, season="2026/2027", output_path=None, progress_callback=None):
    """
    Fetch all relevant stats for a league and optionally save to CSV.
    Supports real-time progress callbacks: progress_callback(current, total, stat_name, message)
    """
    print(f"Fetching stats catalog for league {league_id} (season: {season})...")
    if progress_callback:
        progress_callback(0, len(STATS), "Initializing", f"Connecting to FotMob data feed ({season})...")

    stat_map = fetch_stat_catalog(league_id, season=season)
    all_data = []
    total_stats = len(STATS)

    for idx, stat in enumerate(STATS, start=1):
        # Resolve stat URL via exact name or alias
        target_url = None
        if stat in stat_map:
            target_url = stat_map[stat]
        else:
            aliases = STAT_ALIASES.get(stat, [])
            for alias in aliases:
                if alias in stat_map:
                    target_url = stat_map[alias]
                    break

        if not target_url:
            print(f"  [Skipped] No data feed found for: {stat}")
            if progress_callback:
                progress_callback(idx, total_stats, stat, f"Skipped {stat} (not available)")
            continue

        if progress_callback:
            progress_callback(idx, total_stats, stat, f"Fetching {stat} ({idx}/{total_stats})")

        print(f"  • ({idx}/{total_stats}) {stat}")
        try:
            r = requests.get(target_url, headers=HEADERS, timeout=10)
            if r.status_code == 200:
                json_data = r.json()
                top_lists = json_data.get("TopLists", [])
                if top_lists and len(top_lists) > 0:
                    stat_items = top_lists[0].get("StatList", [])
                    if stat_items:
                        df = pd.DataFrame(stat_items)
                        df["Title"] = stat
                        all_data.append(df)
            else:
                print(f"    ⚠️ HTTP {r.status_code} for {stat}")
        except Exception as e:
            print(f"    ⚠️ Error fetching {stat}: {e}")

        # Gentle throttle to avoid flooding the CDN
        time.sleep(0.08)

    if not all_data:
        raise RuntimeError("No stats data could be fetched for this league.")

    if progress_callback:
        progress_callback(total_stats, total_stats, "Processing", "Normalizing player positions and stats...")

    # Combine all stats
    combined = pd.concat(all_data, ignore_index=True)

    # Position mapping
    combined['Position'] = combined['Positions'].apply(get_position)

    # Wide format
    wide_df = combined.pivot_table(
        index=['ParticipantName', 'TeamName', 'Position'],
        columns='Title',
        values='StatValue',
        aggfunc='first'
    ).reset_index()

    if output_path:
        import os
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        wide_df.to_csv(output_path, index=False)
        print(f"✅ Stats saved to {output_path}")
        print(f"   Players: {wide_df.shape[0]}, Columns: {wide_df.shape[1]}")

    return wide_df

if __name__ == '__main__':
    # Test fetch for Premier League
    fetch_league_stats("47", output_path="tables/pl.csv")