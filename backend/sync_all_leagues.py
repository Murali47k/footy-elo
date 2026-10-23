"""
Footy ELO - CLI League Sync Utility
Organized and streamlined per-league synchronization.
"""
import sys
import os
import argparse

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.sync_service import sync_league, LEAGUE_MAPPING

def main():
    parser = argparse.ArgumentParser(description="Sync Footy ELO league data")
    parser.add_argument(
        '--league',
        choices=list(LEAGUE_MAPPING.keys()) + ['all'],
        default='premier-league',
        help="League to sync (default: premier-league)"
    )
    args = parser.parse_args()

    def print_progress(event):
        percent = event.get('percent', 0)
        message = event.get('message', '')
        print(f"[{percent:3d}%] {message}")

    if args.league == 'all':
        print("Starting sequential sync for all leagues...")
        for lid, info in LEAGUE_MAPPING.items():
            print(f"\n{'='*50}\nSyncing {info['name']} ({lid})\n{'='*50}")
            sync_league(lid, progress_callback=print_progress)
    else:
        info = LEAGUE_MAPPING[args.league]
        print(f"\n{'='*50}\nSyncing {info['name']} ({args.league})\n{'='*50}")
        sync_league(args.league, progress_callback=print_progress)

    print("\n✅ Sync process finished!")

if __name__ == '__main__':
    main()