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

POSITION_RANGES = [
    (10, 19, 'GK'),
    (20, 49, 'DEF'),
    (50, 79, 'MID'),
    (80, 119, 'ATT')
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.fotmob.com/',
}

def get_position(pos_list):
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

    for low, high, label in POSITION_RANGES:
        if low <= pos_code <= high:
            return label

    return f'Code_{pos_code}'

def fetch_stat_catalog(league_id):
    """
    Fetch the player stats catalog from FotMob pageProps for a league.
    Returns a dict mapping stat title -> direct JSON URL.
    """
    url = f"https://www.fotmob.com/api/leagues/{league_id}"
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

def fetch_league_stats(league_id, season="2025/2026", output_path=None, progress_callback=None):
    """
    Fetch all relevant stats for a league and optionally save to CSV.
    Supports real-time progress callbacks: progress_callback(current, total, stat_name, message)
    """
    print(f"Fetching stats catalog for league {league_id}...")
    if progress_callback:
        progress_callback(0, len(STATS), "Initializing", "Connecting to FotMob data feed...")

    stat_map = fetch_stat_catalog(league_id)
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