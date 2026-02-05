import sys
import os
import pandas as pd

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.league_stats import fetch_league_stats
from elo.calc import calculate_elo

LEAGUE_MAPPING = {
    'premier-league': {'file': 'pl', 'name': 'Premier League'},
    'la-liga': {'file': 'laliga', 'name': 'La Liga'},
    'bundesliga': {'file': 'bundesliga', 'name': 'Bundesliga'},
    'serie-a': {'file': 'seriea', 'name': 'Serie A'},
    'ligue-1': {'file': 'ligue1', 'name': 'Ligue 1'}
}

def sync_league(league_id, api_id):
    """
    Sync a single league: fetch stats and calculate ELO
    """
    print(f"\n{'='*60}")
    print(f"SYNCING {LEAGUE_MAPPING[league_id]['name']}")
    print(f"{'='*60}")
    
    file_prefix = LEAGUE_MAPPING[league_id]['file']
    
    # Step 1: Fetch stats
    stats_file = f"tables/{file_prefix}.csv"
    print(f"Fetching stats for league {api_id}...")
    fetch_league_stats(api_id, "2025/2026", stats_file)
    
    # Step 2: Calculate ELO
    elo_file = f"elo_tables/{file_prefix}_elo.csv"
    print(f"Calculating ELO...")
    calculate_elo(stats_file, elo_file)
    
    print(f"{LEAGUE_MAPPING[league_id]['name']} synced successfully!\n")
    
    return {
        'stats_file': stats_file,
        'elo_file': elo_file
    }

if __name__ == '__main__':
    # Test sync for Premier League
    sync_league('premier-league', '47')