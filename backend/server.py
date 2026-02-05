from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
from datetime import datetime

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from backend.sync_all_leagues import sync_league

app = Flask(__name__)
CORS(app)

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
                print(f"Error syncing {league_id}: {str(e)}")
                results[league_id] = {'status': 'error', 'message': str(e)}
        
        return jsonify({
            'success': True,
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Sync all error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)