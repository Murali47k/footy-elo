import React, { useState, useEffect } from 'react';

const STAT_WEIGHTS_DATA = {
  ATT: {
    title: 'Forward (ATT)',
    description: 'Prioritizes clinical finishing, offensive threat creation, dribbling efficiency, and shot accuracy.',
    positive: [
      { stat: 'Top scorer (Goals)', weight: '+1.5', desc: 'Primary output metric for attackers' },
      { stat: 'Successful dribbles per 90', weight: '+1.2', desc: 'Take-on success & ball carrying under pressure' },
      { stat: 'Assists', weight: '+1.0', desc: 'Direct goal creation' },
      { stat: 'Shots on target per 90', weight: '+1.0', desc: 'Target testing & offensive threat volume' },
      { stat: 'Expected goals (xG)', weight: '+0.2', desc: 'Quality of chances arrived at' },
      { stat: 'Expected assist (xA)', weight: '+0.2', desc: 'Shot-creating pass quality' },
    ],
    negative: [
      { stat: 'Big chances missed', weight: '-1.0', desc: 'Finishing inefficiency penalty' },
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Loss of team momentum deduction' },
    ]
  },
  MID: {
    title: 'Midfielder (MID)',
    description: 'Weights progressive passing, transition control, final-third ball recovery, and defensive disruption.',
    positive: [
      { stat: 'Interceptions per 90', weight: '+3.0', desc: 'Highest value disruption action in midfield' },
      { stat: 'Top scorer (Goals)', weight: '+1.5', desc: 'Goal contribution from deep' },
      { stat: 'Assists', weight: '+1.0', desc: 'Direct goal assistance' },
      { stat: 'Possession won final 3rd per 90', weight: '+0.6', desc: 'High-press execution & immediate turnover threat' },
      { stat: 'Expected assist (xA)', weight: '+0.5', desc: 'Playmaking creativity index' },
      { stat: 'Accurate long balls per 90', weight: '+0.2', desc: 'Switching play & vertical progression' },
      { stat: 'Expected goals (xG)', weight: '+0.2', desc: 'Box-crashing & scoring threat' },
      { stat: 'Accurate passes per 90', weight: '+0.1', desc: 'Tempo orchestration & circulation volume' },
    ],
    negative: [
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Unnecessary stoppage deduction' },
    ]
  },
  DEF: {
    title: 'Defender (DEF)',
    description: 'Emphasizes dual-phase defensive solidity: stopping attacks, aerial/ground clearance, and passing out.',
    positive: [
      { stat: 'Interceptions per 90', weight: '+2.5', desc: 'Anticipation and cutting off passing lanes' },
      { stat: 'Successful tackles per 90', weight: '+2.0', desc: 'Direct 1v1 ground duels won' },
      { stat: 'Clearances per 90', weight: '+1.5', desc: 'Emergency box defending & relieving pressure' },
      { stat: 'Blocks per 90', weight: '+1.5', desc: 'Shot and cross prevention' },
      { stat: 'Top scorer (Goals)', weight: '+1.5', desc: 'Set-piece aerial threat & penalties' },
      { stat: 'Assists', weight: '+1.0', desc: 'Fullback/centerback goal creation' },
      { stat: 'Clean sheets', weight: '+0.9', desc: 'Team defensive shutout baseline' },
      { stat: 'Accurate long balls per 90', weight: '+0.3', desc: 'Long-range distribution from the back' },
    ],
    negative: [
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Dangerous set-piece conceding penalty' },
    ]
  },
  GK: {
    title: 'Goalkeeper (GK)',
    description: 'Calibrated on shot-stopping overperformance, goals prevented against xG, and clean sheets.',
    positive: [
      { stat: 'Saves per 90', weight: '+1.5', desc: 'Shot-stopping activity & volume' },
      { stat: 'Clean sheets', weight: '+1.5', desc: 'Complete defensive shutout' },
      { stat: 'Goals prevented', weight: '+1.2', desc: 'Post-shot xG saved above expected' },
      { stat: 'Top scorer / Assists', weight: '+1.5 / +1.0', desc: 'Rare goalkeeper offensive contributions' },
    ],
    negative: [
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Goals conceded per 90', weight: '-0.9', desc: 'Conceding frequency penalty' },
      { stat: 'Penalties conceded', weight: '-0.7', desc: 'Fouling in penalty box deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Goalkeeping foul deduction' },
    ]
  }
};

function EloMathModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('formula');
  const [selectedPosTab, setSelectedPosTab] = useState('ATT');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content math-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-block">
            <div className="modal-icon math-modal-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h4" />
              </svg>
            </div>
            <div>
              <h2 className="modal-title">How Footy ELO is Calculated</h2>
              <p className="modal-subtitle">Mathematical formulation, positional weighting, and calibration engine</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="math-modal-nav">
          <button
            className={`math-nav-btn ${activeTab === 'formula' ? 'active' : ''}`}
            onClick={() => setActiveTab('formula')}
          >
            Core Formula
          </button>
          <button
            className={`math-nav-btn ${activeTab === 'weights' ? 'active' : ''}`}
            onClick={() => setActiveTab('weights')}
          >
            Positional Weights
          </button>
          <button
            className={`math-nav-btn ${activeTab === 'example' ? 'active' : ''}`}
            onClick={() => setActiveTab('example')}
          >
            Worked Example
          </button>
          <button
            className={`math-nav-btn ${activeTab === 'scope' ? 'active' : ''}`}
            onClick={() => setActiveTab('scope')}
          >
            Competition Scope Note
          </button>
        </div>

        {/* Tab 1: Core Formula */}
        {activeTab === 'formula' && (
          <div className="math-modal-body">
            <div className="math-step-card">
              <div className="math-step-header">
                <span className="step-pill">Step 1</span>
                <h3 className="step-title">Raw Performance Delta</h3>
              </div>
              <div className="math-formula-box">
                <code>Δ_perf = Σ (Stat_i × Weight_pos,i)</code>
              </div>
              <p className="step-description">
                For each player, each tracked metric (goals, key passes, tackles, clearances, saves, etc.) is multiplied
                by its role-specific weight for that player's position (<code>ATT</code>, <code>MID</code>, <code>DEF</code>, or <code>GK</code>).
                Positive contributions accumulate positive delta, while discipline faults and inefficiencies (cards, fouls, big chances missed) apply negative penalties.
              </p>
            </div>

            <div className="math-step-card">
              <div className="math-step-header">
                <span className="step-pill">Step 2</span>
                <h3 className="step-title">Raw ELO Computation</h3>
              </div>
              <div className="math-formula-box">
                <code>ELO_RAW = BASE_ELO + (K_FACTOR × Δ_perf)</code>
                <div className="formula-params">
                  <span>BASE_ELO = 1500</span>
                  <span>•</span>
                  <span>K_FACTOR = 10</span>
                </div>
              </div>
              <p className="step-description">
                The baseline ELO is calibrated around a standard anchor of <strong>1500</strong>. The sensitivity factor (<code>K_FACTOR = 10</code>)
                converts the performance score into traditional ELO rating points.
              </p>
            </div>

            <div className="math-step-card highlight-step">
              <div className="math-step-header">
                <span className="step-pill accent">Step 3</span>
                <h3 className="step-title">Position-Mean Normalization (Anti-Attacker Bias)</h3>
              </div>
              <div className="math-formula-box highlight">
                <code>ELO = BASE_ELO + (ELO_RAW - μ_position)</code>
                <div className="formula-params">
                  <span>where μ_position = mean(ELO_RAW across all players in that position)</span>
                </div>
              </div>
              <p className="step-description">
                <strong>Why this is crucial:</strong> In raw soccer statistics, forwards naturally accumulate higher counting stats (goals, shots)
                than defenders or goalkeepers. Without normalization, the leaderboard would be 90% strikers.
                By subtracting the mean raw score of each positional group (<code>μ_position</code>), the expected average for every position
                is centered at exactly 1500. A defender with a 1660 ELO is playing at an equally elite level among defenders as a striker with 1660 ELO among strikers.
              </p>
            </div>

            <div className="math-step-card">
              <div className="math-step-header">
                <span className="step-pill">Step 4</span>
                <h3 className="step-title">Floor Clamping & Rounding</h3>
              </div>
              <div className="math-formula-box">
                <code>Final ELO = round( max(800, ELO) )</code>
              </div>
              <p className="step-description">
                The rating is bounded at a floor of <strong>800</strong> to prevent statistical outliers from dipping into negative territory,
                and rounded to the nearest whole integer for clean display.
              </p>
            </div>

            <div className="tiers-overview-card">
              <h4 className="tiers-title">Calibrated Performance Tiers</h4>
              <div className="tiers-list-grid">
                <div className="tier-preview-card tier-worldclass-card">
                  <div className="tier-preview-header">
                    <span className="tier-badge tier-worldclass">World Class</span>
                    <span className="tier-range">1700+</span>
                  </div>
                  <p className="tier-desc">Generational, Ballon d'Or caliber performers dominating across all positional metrics.</p>
                </div>

                <div className="tier-preview-card tier-elite-card">
                  <div className="tier-preview-header">
                    <span className="tier-badge tier-elite">Elite</span>
                    <span className="tier-range">1600 - 1699</span>
                  </div>
                  <p className="tier-desc">International stars, match-winners, and top 5% performers in European football.</p>
                </div>

                <div className="tier-preview-card tier-pro-card">
                  <div className="tier-preview-header">
                    <span className="tier-badge tier-pro">Pro</span>
                    <span className="tier-range">1500 - 1599</span>
                  </div>
                  <p className="tier-desc">Consistent first-team starters operating above league-median performance.</p>
                </div>

                <div className="tier-preview-card tier-solid-card">
                  <div className="tier-preview-header">
                    <span className="tier-badge tier-solid">Solid</span>
                    <span className="tier-range">&lt; 1500</span>
                  </div>
                  <p className="tier-desc">Squad rotation players, developing talents, or defensive containment baselines.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Positional Weights */}
        {activeTab === 'weights' && (
          <div className="math-modal-body">
            <div className="pos-selector-pill-row">
              {['ATT', 'MID', 'DEF', 'GK'].map(pos => (
                <button
                  key={pos}
                  className={`pos-pill-btn ${selectedPosTab === pos ? 'active' : ''}`}
                  onClick={() => setSelectedPosTab(pos)}
                >
                  {STAT_WEIGHTS_DATA[pos].title}
                </button>
              ))}
            </div>

            <div className="pos-detail-card">
              <div className="pos-detail-header">
                <h3 className="pos-detail-title">{STAT_WEIGHTS_DATA[selectedPosTab].title}</h3>
                <p className="pos-detail-desc">{STAT_WEIGHTS_DATA[selectedPosTab].description}</p>
              </div>

              <h4 className="weights-section-title positive">Positive Contribution Weights (+)</h4>
              <div className="weights-table-container">
                <table className="weights-table">
                  <thead>
                    <tr>
                      <th>Tracked Metric</th>
                      <th>Weight</th>
                      <th>Tactical Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STAT_WEIGHTS_DATA[selectedPosTab].positive.map((w, idx) => (
                      <tr key={idx}>
                        <td className="weight-metric-name">{w.stat}</td>
                        <td className="weight-val positive">{w.weight}</td>
                        <td className="weight-desc">{w.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="weights-section-title negative">Penalties & Disciplinary Deductions (-)</h4>
              <div className="weights-table-container">
                <table className="weights-table">
                  <thead>
                    <tr>
                      <th>Tracked Metric</th>
                      <th>Weight</th>
                      <th>Tactical Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STAT_WEIGHTS_DATA[selectedPosTab].negative.map((w, idx) => (
                      <tr key={idx}>
                        <td className="weight-metric-name">{w.stat}</td>
                        <td className="weight-val negative">{w.weight}</td>
                        <td className="weight-desc">{w.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Worked Example */}
        {activeTab === 'example' && (
          <div className="math-modal-body">
            <div className="example-intro-box">
              <div className="example-avatar">⚽</div>
              <div>
                <h3 className="example-title">Sample Calculation: Elite Striker (ATT)</h3>
                <p className="example-sub">Walk-through showing exact arithmetic from raw match stats to final ELO rating.</p>
              </div>
            </div>

            <div className="calculation-step-flow">
              <div className="calc-flow-item">
                <div className="calc-flow-num">1</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Raw Stats Input</div>
                  <div className="calc-stats-grid">
                    <span className="stat-chip">Top Scorer: <strong>24</strong></span>
                    <span className="stat-chip">Assists: <strong>6</strong></span>
                    <span className="stat-chip">Shots on target/90: <strong>2.1</strong></span>
                    <span className="stat-chip">Dribbles/90: <strong>1.8</strong></span>
                    <span className="stat-chip">xG: <strong>19.4</strong></span>
                    <span className="stat-chip">xA: <strong>4.8</strong></span>
                    <span className="stat-chip penalty">Big chances missed: <strong>12</strong></span>
                    <span className="stat-chip penalty">Yellow cards: <strong>3</strong></span>
                    <span className="stat-chip penalty">Fouls/90: <strong>1.1</strong></span>
                  </div>
                </div>
              </div>

              <div className="calc-flow-item">
                <div className="calc-flow-num">2</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Sum of Weighted Deltas (Δ_perf)</div>
                  <div className="calc-code-line">
                    Δ_perf = (24 × 1.5) + (6 × 1.0) + (2.1 × 1.0) + (1.8 × 1.2) + (19.4 × 0.2) + (4.8 × 0.2)
                    - (12 × 1.0) - (3 × 1.5) - (1.1 × 0.9)
                  </div>
                  <div className="calc-result-badge">
                    Δ_perf = <strong>+33.15</strong>
                  </div>
                </div>
              </div>

              <div className="calc-flow-item">
                <div className="calc-flow-num">3</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Calculate ELO_RAW</div>
                  <div className="calc-code-line">
                    ELO_RAW = BASE_ELO + (K_FACTOR × Δ_perf) = 1500 + (10 × 33.15)
                  </div>
                  <div className="calc-result-badge">
                    ELO_RAW = <strong>1831.5</strong>
                  </div>
                </div>
              </div>

              <div className="calc-flow-item">
                <div className="calc-flow-num">4</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Apply Positional Normalization</div>
                  <div className="calc-code-line">
                    Suppose the average ELO_RAW for all rated forwards in this league is μ_ATT = 1650.0:
                    <br />
                    ELO = 1500 + (1831.5 - 1650.0) = 1500 + 181.5 = <strong>1681.5</strong>
                  </div>
                </div>
              </div>

              <div className="calc-flow-item final-step">
                <div className="calc-flow-num">5</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Final Clamping & Rating</div>
                  <div className="calc-code-line">
                    Final ELO = round(1681.5) = <strong>1682</strong> • <span className="tier-badge tier-elite">Elite (1600+)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Scope Note */}
        {activeTab === 'scope' && (
          <div className="math-modal-body">
            <div className="scope-notice-hero">
              <div className="scope-icon-box">📌</div>
              <div>
                <h3 className="scope-hero-title">League & Competition Specific Only</h3>
                <p className="scope-hero-sub">Stats and ratings are isolated within each distinct tournament or league campaign.</p>
              </div>
            </div>

            <div className="scope-points-container">
              <div className="scope-point-card">
                <div className="scope-point-header">
                  <span className="scope-point-number">1</span>
                  <h4>Strict Isolation Per Competition</h4>
                </div>
                <p>
                  A player's ELO rating in the <strong>UEFA Champions League</strong> is computed exclusively from their performance in UEFA Champions League matches during that season.
                  It does <strong>not</strong> blend or combine with their Premier League, La Liga, or domestic cup performances.
                </p>
              </div>

              <div className="scope-point-card">
                <div className="scope-point-header">
                  <span className="scope-point-number">2</span>
                  <h4>Pure Tournament Comparisons</h4>
                </div>
                <p>
                  Tournament football operates with different tactical intensities, qualification criteria, and game sample sizes than 38-game domestic seasons.
                  Keeping statistics competition-specific prevents sample-size distortion and provides an authentic look at who actually dominated European nights versus domestic campaigns.
                </p>
              </div>

              <div className="scope-point-card">
                <div className="scope-point-header">
                  <span className="scope-point-number">3</span>
                  <h4>Independent Multi-League Scouting</h4>
                </div>
                <p>
                  Star players (e.g., Erling Haaland, Kylian Mbappé, or Vinícius Júnior) hold independent ratings in their domestic league and in European competitions.
                  You can compare how their performance differs when competing against Europe's continental elite versus their weekly domestic opponents.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <div className="math-footer-note">
            <span>Formula standard: <strong>Footy ELO v2.1</strong> • 30 Positional Metrics • 1500 Baseline</span>
          </div>
          <button className="btn-modal-close-action" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default EloMathModal;
