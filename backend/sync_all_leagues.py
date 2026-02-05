import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

import pandas as pd
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
    
    # Define paths relative to project root
    stats_file = os.path.join(project_root, f"tables/{file_prefix}.csv")
    elo_file = os.path.join(project_root, f"elo_tables/{file_prefix}_elo.csv")
    
    # Create directories if they don't exist
    os.makedirs(os.path.dirname(stats_file), exist_ok=True)
    os.makedirs(os.path.dirname(elo_file), exist_ok=True)
    
    # Step 1: Fetch stats
    print(f"Fetching stats for league {api_id}...")
    fetch_league_stats(api_id, "2025/2026", stats_file)
    
    # Step 2: Calculate ELO
    print(f"Calculating ELO...")
    calculate_elo(stats_file, elo_file)
    
    # Copy to React public folder for immediate access
    react_elo_file = os.path.join(project_root, f"public/elo_tables/{file_prefix}_elo.csv")
    os.makedirs(os.path.dirname(react_elo_file), exist_ok=True)
    
    # Read and write to copy file
    import shutil
    shutil.copy2(elo_file, react_elo_file)
    
    print(f"✅ {LEAGUE_MAPPING[league_id]['name']} synced successfully!\n")
    
    return {
        'stats_file': stats_file,
        'elo_file': elo_file
    }

if __name__ == '__main__':
    # Test sync for Premier League
    sync_league('premier-league', '47')