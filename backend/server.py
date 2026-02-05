from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from sync_all_leagues import sync_league

app = Flask(__name__)
CORS(app)

SYNC_TIMESTAMP_FILE = 'last_sync.json'

def get_last_sync():
    if os.path.exists(SYNC_TIMESTAMP_FILE):
        with open(SYNC_TIMESTAMP_FILE, 'r') as f:
            data = json.load(f)
            return data.get('lastSync')
    return None

def update_last_sync():
    with open(SYNC_TIMESTAMP_FILE, 'w') as f:
        json.dump({'lastSync': datetime.now().isoformat()}, f)

@app.route('/api/last-sync', methods=['GET'])
def last_sync():
    last_sync_time = get_last_sync()
    return jsonify({'lastSync': last_sync_time})

@app.route('/api/sync-all', methods=['POST'])
def sync_all():
    try:
        data = request.json
        leagues = data.get('leagues', [])
        
        results = {}
        
        for league in leagues:
            league_id = league['id']
            api_id = league['apiId']
            
            try:
                sync_league(league_id, api_id)
                results[league_id] = {'status': 'success'}
            except Exception as e:
                results[league_id] = {'status': 'error', 'message': str(e)}
        
        update_last_sync()
        
        return jsonify({
            'success': True,
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)