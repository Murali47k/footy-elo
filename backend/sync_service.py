import os
import sys
import json
import shutil
from datetime import datetime

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scraper.league_stats import fetch_league_stats
from elo.calc import calculate_elo

LEAGUE_MAPPING = {
    'premier-league': {'file': 'pl', 'name': 'Premier League', 'apiId': '47', 'flag': '🏴󠁧󠁢󠁥󠁮󠁧󠁿'},
    'la-liga': {'file': 'laliga', 'name': 'La Liga', 'apiId': '87', 'flag': '🇪🇸'},
    'bundesliga': {'file': 'bundesliga', 'name': 'Bundesliga', 'apiId': '54', 'flag': '🇩🇪'},
    'serie-a': {'file': 'seriea', 'name': 'Serie A', 'apiId': '55', 'flag': '🇮🇹'},
    'ligue-1': {'file': 'ligue1', 'name': 'Ligue 1', 'apiId': '53', 'flag': '🇫🇷'}
}

META_FILE = os.path.join(PROJECT_ROOT, "public/elo_tables/sync_meta.json")

def get_metadata():
    """Load or initialize sync metadata for all leagues."""
    if os.path.exists(META_FILE):
        try:
            with open(META_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading metadata: {e}")

    # Fallback to inspecting existing files
    meta = {}
    for lid, info in LEAGUE_MAPPING.items():
        prefix = info['file']
        csv_path = os.path.join(PROJECT_ROOT, f"public/elo_tables/{prefix}_elo.csv")
        last_updated = None
        player_count = 0

        if os.path.exists(csv_path):
            mtime = os.path.getmtime(csv_path)
            last_updated = datetime.fromtimestamp(mtime).isoformat()
            try:
                with open(csv_path, 'r') as f:
                    player_count = max(0, len(f.readlines()) - 1)
            except Exception:
                pass

        meta[lid] = {
            'id': lid,
            'name': info['name'],
            'flag': info['flag'],
            'apiId': info['apiId'],
            'filePrefix': prefix,
            'lastUpdated': last_updated,
            'playerCount': player_count,
            'status': 'ready'
        }

    save_metadata(meta)
    return meta

def save_metadata(meta):
    """Save metadata to public folder for React app consumption."""
    os.makedirs(os.path.dirname(META_FILE), exist_ok=True)
    with open(META_FILE, 'w') as f:
        json.dump(meta, f, indent=2)

def update_league_meta(league_id, **kwargs):
    """Update fields for a specific league in metadata."""
    meta = get_metadata()
    if league_id not in meta:
        meta[league_id] = {
            'id': league_id,
            'name': LEAGUE_MAPPING.get(league_id, {}).get('name', league_id),
            'flag': LEAGUE_MAPPING.get(league_id, {}).get('flag', '⚽'),
            'apiId': LEAGUE_MAPPING.get(league_id, {}).get('apiId', ''),
            'filePrefix': LEAGUE_MAPPING.get(league_id, {}).get('file', league_id)
        }
    meta[league_id].update(kwargs)
    save_metadata(meta)
    return meta[league_id]

def sync_league(league_id, progress_callback=None):
    """
    Sync a single league with progress updates:
    1. Fetch stats from FotMob feed (progress 0% -> 80%)
    2. Calculate ELO ratings (progress 80% -> 95%)
    3. Save files and update metadata (progress 100%)
    """
    if league_id not in LEAGUE_MAPPING:
        raise ValueError(f"Unknown league id: '{league_id}'")

    league_info = LEAGUE_MAPPING[league_id]
    api_id = league_info['apiId']
    name = league_info['name']
    file_prefix = league_info['file']

    stats_file = os.path.join(PROJECT_ROOT, f"tables/{file_prefix}.csv")
    elo_file = os.path.join(PROJECT_ROOT, f"elo_tables/{file_prefix}_elo.csv")
    react_elo_file = os.path.join(PROJECT_ROOT, f"public/elo_tables/{file_prefix}_elo.csv")

    os.makedirs(os.path.dirname(stats_file), exist_ok=True)
    os.makedirs(os.path.dirname(elo_file), exist_ok=True)
    os.makedirs(os.path.dirname(react_elo_file), exist_ok=True)

    update_league_meta(league_id, status='syncing')

    def scraper_progress(current, total, stat_name, message):
        if progress_callback:
            # Map scraping to 5% - 80%
            percent = 5 + int((current / max(1, total)) * 75)
            progress_callback({
                'leagueId': league_id,
                'leagueName': name,
                'status': 'scraping',
                'percent': percent,
                'currentStat': stat_name,
                'message': message
            })

    try:
        # Step 1: Scrape
        if progress_callback:
            progress_callback({
                'leagueId': league_id,
                'leagueName': name,
                'status': 'starting',
                'percent': 5,
                'message': f"Connecting to {name} data feed..."
            })

        fetch_league_stats(api_id, output_path=stats_file, progress_callback=scraper_progress)

        # Step 2: Calculate ELO
        if progress_callback:
            progress_callback({
                'leagueId': league_id,
                'leagueName': name,
                'status': 'calculating',
                'percent': 85,
                'message': "Computing ELO ratings and position baselines..."
            })

        elo_df = calculate_elo(stats_file, elo_file)

        # Step 3: Copy to public directory
        shutil.copy2(elo_file, react_elo_file)

        now_iso = datetime.now().isoformat()
        player_count = len(elo_df)

        update_league_meta(
            league_id,
            status='ready',
            lastUpdated=now_iso,
            playerCount=player_count
        )

        if progress_callback:
            progress_callback({
                'leagueId': league_id,
                'leagueName': name,
                'status': 'complete',
                'percent': 100,
                'playerCount': player_count,
                'lastUpdated': now_iso,
                'message': f"{name} updated successfully! ({player_count} players)"
            })

        return {
            'success': True,
            'leagueId': league_id,
            'leagueName': name,
            'playerCount': player_count,
            'lastUpdated': now_iso
        }

    except Exception as e:
        print(f"❌ Error syncing {name}: {e}")
        update_league_meta(league_id, status='error')
        if progress_callback:
            progress_callback({
                'leagueId': league_id,
                'leagueName': name,
                'status': 'error',
                'percent': 100,
                'message': f"Error syncing {name}: {str(e)}"
            })
        raise
