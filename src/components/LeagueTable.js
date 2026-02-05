import React from 'react';

function LeagueTable({ league, data, isActive }) {
  const top25 = data.slice(0, 25);

  return (
    <div id={league.id} className={`league-content ${isActive ? 'active' : ''}`}>
      <h2>{league.flag} {league.name} - Top 25</h2>
      <div className="table-container">
        {top25.length === 0 ? (
          <div className="no-data">Loading data...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Club</th>
                <th>Pos</th>
                <th>ELO</th>
              </tr>
            </thead>
            <tbody>
              {top25.map((player, index) => (
                <tr key={index}>
                  <td className="rank">{index + 1}</td>
                  <td><strong>{player.name}</strong></td>
                  <td>{player.club}</td>
                  <td>
                    <span className="position-badge">{player.position}</span>
                  </td>
                  <td>
                    <span className="elo-score">{player.elo.toFixed(0)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default LeagueTable;