import os
import sys
import json
import time
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from queue import Queue

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.sync_service import sync_league, get_metadata, LEAGUE_MAPPING

app = Flask(__name__)
CORS(app)

@app.route('/api/status', methods=['GET'])
def get_status():
    """Health check endpoint."""
    return jsonify({
        'status': 'online',
        'serverTime': datetime.now().isoformat(),
        'availableLeagues': list(LEAGUE_MAPPING.keys())
    })

@app.route('/api/metadata', methods=['GET'])
def metadata():
    """Return latest sync timestamps and player counts for all leagues."""
    try:
        data = get_metadata()
        return jsonify({
            'success': True,
            'metadata': data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sync/<league_id>', methods=['POST'])
def sync_single(league_id):
    """Sync a single league synchronously via standard REST."""
    if league_id not in LEAGUE_MAPPING:
        return jsonify({
            'success': False,
            'error': f"Unknown league: {league_id}. Valid options: {list(LEAGUE_MAPPING.keys())}"
        }), 400

    season = request.args.get('season') or (request.json.get('season') if request.is_json and request.json else '2026/2027')
    try:
        result = sync_league(league_id, season=season)
        return jsonify({
            'success': True,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sync/stream/<league_id>', methods=['GET'])
def sync_stream(league_id):
    """
    Stream real-time progress for syncing a league using Server-Sent Events (SSE).
    Allows the frontend to show an accurate live progress bar without crashing or polling.
    """
    if league_id not in LEAGUE_MAPPING:
        return jsonify({'error': f"Invalid league id: {league_id}"}), 400

    season = request.args.get('season', '2026/2027')

    def generate_events():
        event_queue = Queue()

        def on_progress(event):
            event_queue.put(event)

        import threading
        def worker():
            try:
                sync_league(league_id, season=season, progress_callback=on_progress)
            except Exception as ex:
                event_queue.put({
                    'leagueId': league_id,
                    'status': 'error',
                    'percent': 100,
                    'message': str(ex)
                })
            finally:
                event_queue.put(None)  # Sentinel to end stream

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()

        # Send initial event
        yield f"data: {json.dumps({'status': 'connecting', 'percent': 0, 'message': 'Connecting to server...'})}\n\n"

        while True:
            event = event_queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"
            if event.get('status') in ('complete', 'error'):
                break

    return Response(
        generate_events(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )

@app.route('/api/sync-all', methods=['POST'])
def sync_all():
    """
    Sequential per-league sync with safe delays to prevent network rate limits.
    """
    try:
        results = {}
        for idx, (league_id, info) in enumerate(LEAGUE_MAPPING.items()):
            if idx > 0:
                time.sleep(2)  # Safe 2s pause between leagues
            try:
                res = sync_league(league_id)
                results[league_id] = {'status': 'success', 'details': res}
            except Exception as e:
                results[league_id] = {'status': 'error', 'message': str(e)}

        return jsonify({
            'success': True,
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Footy ELO backend on port {port}...")
    app.run(debug=True, port=port, host='0.0.0.0', threaded=True)