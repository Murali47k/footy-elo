import pandas as pd
from reus.fotmob.fm_season_stats import fm_season_stats

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

POSITION_RANGES = [
    (10, 19, 'GK'),
    (20, 49, 'DEF'),
    (50, 79, 'MID'),
    (80, 119, 'ATT')
]

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

def fetch_league_stats(league_id, season, output_path):
    """
    Fetch all stats for a league and save to CSV
    """
    print(f"Fetching stats for league {league_id}, season {season}...")
    all_data = []

    for stat in STATS:
        print(f"  • {stat}")
        try:
            df = fm_season_stats(
                league_id=league_id,
                team_or_player="players",
                stat_name=[stat],
                season=season
            )
            all_data.append(df)
        except Exception as e:
            print(f"    ⚠️ Error fetching {stat}: {e}")
            continue

    if not all_data:
        raise Exception("No stats data fetched")

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

    # Save to CSV
    wide_df.to_csv(output_path, index=False)

    print(f"✅ Stats saved to {output_path}")
    print(f"   Players: {wide_df.shape[0]}, Columns: {wide_df.shape[1]}")
    
    return wide_df

if __name__ == '__main__':
    # Test
    fetch_league_stats("47", "2025/2026", "tables/pl.csv")