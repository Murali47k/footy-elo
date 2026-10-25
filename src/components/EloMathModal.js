import React, { useState, useEffect } from 'react';

const STAT_WEIGHTS_DATA = {
  ST: {
    title: 'Striker (ST)',
    description: 'Calibrated on lethal penalty-box finishing, shot volume, efficiency against xG, and hold-up play.',
    positive: [
      { stat: 'Top scorer (Goals)', weight: '+1.7', desc: 'Primary output metric for central goalscorers' },
      { stat: 'Shots on target per 90', weight: '+0.9', desc: 'Consistent threat testing opposition goalkeepers' },
      { stat: 'Assists', weight: '+0.8', desc: 'Flick-ons, layoff passes, and box combination assists' },
      { stat: 'Successful dribbles per 90', weight: '+0.25', desc: 'Beating markers in tight 1v1 box situations' },
      { stat: 'Expected goals (xG)', weight: '+0.2', desc: 'Getting into high-probability scoring positions' },
      { stat: 'Expected assist (xA)', weight: '+0.2', desc: 'Quality of chances laid off for teammates' },
    ],
    negative: [
      { stat: 'Big chances missed', weight: '-0.7', desc: 'Costly finishing inefficiency penalty' },
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Loss of momentum / attacking foul deduction' },
    ]
  },
  WING: {
    title: 'Winger / Wide Attacker (RW, LW, RM, LM)',
    description: 'Rewards 1v1 take-ons, crosses, wide creativity, direct goal threat, and high-tempo pressing.',
    positive: [
      { stat: 'Top scorer (Goals)', weight: '+1.5', desc: 'Inside cutting & back-post goal threat' },
      { stat: 'Shots on target per 90', weight: '+0.8', desc: 'Direct goal threat volume from wide angles' },
      { stat: 'Successful dribbles per 90', weight: '+0.5', desc: 'Wide isolation 1v1 take-on success' },
      { stat: 'Assists', weight: '+0.8', desc: 'Crosses, cutbacks, and final-third deliveries' },
      { stat: 'Expected assist (xA)', weight: '+0.3', desc: 'Incisive wide chance creation' },
      { stat: 'Expected goals (xG)', weight: '+0.2', desc: 'Box-crashing & inward runs into scoring zones' },
    ],
    negative: [
      { stat: 'Big chances missed', weight: '-0.5', desc: 'Wasteful finishing deduction' },
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Disruption deduction' },
    ]
  },
  CAM: {
    title: 'Attacking Midfielder / Playmaker (CAM, RAM, LAM)',
    description: 'Weights incisive vision, through-balls, final-third creativity, and box arriving threat.',
    positive: [
      { stat: 'Top scorer (Goals)', weight: '+1.5', desc: 'Critical second-line goal contributions' },
      { stat: 'Assists', weight: '+1.0', desc: 'Key playmaker output and direct goal creation' },
      { stat: 'Successful dribbles per 90', weight: '+0.2', desc: 'Tight-space pocket dribbling between lines' },
      { stat: 'Shots on target per 90', weight: '+0.5', desc: 'Direct goal threat volume from wide angles' },
      { stat: 'Possession won final 3rd per 90', weight: '+0.5', desc: 'Immediate counter-pressing recoveries' },
      { stat: 'Expected assist (xA)', weight: '+0.4', desc: 'Playmaking creativity index' },
      { stat: 'Expected goals (xG)', weight: '+0.2', desc: 'Box-crashing & late run threat' },
      { stat: 'Accurate passes per 90', weight: '+0.1', desc: 'Circulation & progressive ball movement' },
    ],
    negative: [
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Tactical foul deduction' },
    ]
  },
  CM: {
    title: 'Central Midfielder / Box-to-Box (CM)',
    description: 'Balances tempo orchestration, long-range switching, ball progression, and defensive recoveries.',
    positive: [
      { stat: 'Interceptions per 90', weight: '+2.0', desc: 'Cutting transition passing lanes in the middle' },
      { stat: 'Top scorer (Goals)', weight: '+1.5', desc: 'Crucial goal contributions from deep' },
      { stat: 'Successful tackles per 90', weight: '+1.4', desc: 'Ground duels won in the engine room' },
      { stat: 'Assists', weight: '+1.0', desc: 'Progressive assists into the forward line' },
      { stat: 'Possession won final 3rd per 90', weight: '+0.6', desc: 'High-press execution & turnover generation' },
      { stat: 'Expected assist (xA)', weight: '+0.5', desc: 'Quality of progressive penetrating passes' },
      { stat: 'Accurate long balls per 90', weight: '+0.3', desc: 'Switching play and vertical ball progression' },
      { stat: 'Expected goals (xG)', weight: '+0.2', desc: 'Late arrivals into the box' },
      { stat: 'Accurate passes per 90', weight: '+0.1', desc: 'Tempo orchestration & circulation volume' },
    ],
    negative: [
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Unnecessary stoppage deduction' },
    ]
  },
  CDM: {
    title: 'Defensive Midfielder / Anchor (CDM)',
    description: 'Prioritizes shielding the backline, aggressive turnover winning, aerial/ground duels, and recycling possession.',
    positive: [
      { stat: 'Interceptions per 90', weight: '+3.0', desc: 'Primary metric: breaking up opposition attacks' },
      { stat: 'Successful tackles per 90', weight: '+2.0', desc: 'Stopping transition counters at the source' },
      { stat: 'Top scorer (Goals)', weight: '+1.5', desc: 'Bonus reward for goals scored from holding role' },
      { stat: 'Blocks per 90', weight: '+1.0', desc: 'Shielding shots and forward penetrating passes' },
      { stat: 'Assists', weight: '+1.0', desc: 'Deep playmaking & direct turnaround assists' },
      { stat: 'Clean sheets', weight: '+0.6', desc: 'Direct contribution to defensive shutout' },
      { stat: 'Possession won final 3rd per 90', weight: '+0.6', desc: 'Counter-press turnover recovery' },
      { stat: 'Accurate long balls per 90', weight: '+0.3', desc: 'Deep ball distribution & diagonal switches' },
      { stat: 'Accurate passes per 90', weight: '+0.1', desc: 'Reliable pivot circulation volume' },
    ],
    negative: [
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Dangerous zone foul deduction' },
    ]
  },
  FB: {
    title: 'Fullback & Wing-back (RB, LB, RWB, LWB)',
    description: 'Evaluates two-way modern wide defenders: 1v1 flank stopping plus overlapping crosses and assists.',
    positive: [
      { stat: 'Top scorer (Goals)', weight: '+2.0', desc: 'High-value rare offensive contribution from wide defense' },
      { stat: 'Successful tackles per 90', weight: '+1.8', desc: 'Flank 1v1 duels won against opposing wingers' },
      { stat: 'Interceptions per 90', weight: '+2.0', desc: 'Cutting off diagonal balls and through passes' },
      { stat: 'Assists', weight: '+1.5', desc: 'Essential modern fullback output: crosses & cutbacks' },
      { stat: 'Clean sheets', weight: '+1.2', desc: 'Core defensive shutout baseline' },
      { stat: 'Clearances per 90', weight: '+1.0', desc: 'Flank containment and back-post emergency clearances' },
      { stat: 'Possession won final 3rd per 90', weight: '+0.6', desc: 'Overlapping high press and counter-press wins' },
      { stat: 'Expected assist (xA)', weight: '+0.5', desc: 'Quality of wide chances delivered into box' },
      { stat: 'Accurate long balls per 90', weight: '+0.7', desc: 'Up-the-line progression and long clearances' },
    ],
    negative: [
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Flank free-kick conceded deduction' },
    ]
  },
  CB: {
    title: 'Centre Back (CB)',
    description: 'Anchors the backline: aerial/ground clearances, shot blocks, box defending, and set-piece headers.',
    positive: [
      { stat: 'Top scorer (Goals)', weight: '+2.0', desc: 'Rare set-piece corner headers & clutch goals' },
      { stat: 'Interceptions per 90', weight: '+3.0', desc: 'Anticipation and cutting off forward through balls' },
      { stat: 'Successful tackles per 90', weight: '+2.0', desc: 'Last-man 1v1 duels and recovery challenges' },
      { stat: 'Clearances per 90', weight: '+1.8', desc: 'Box dominance & clearing danger under pressure' },
      { stat: 'Blocks per 90', weight: '+2.5', desc: 'Heroic direct shot & cross prevention' },
      { stat: 'Assists', weight: '+1.5', desc: 'Rare long diagonal passes leading to goals' },
      { stat: 'Clean sheets', weight: '+1.4', desc: 'Primary responsibility for team shutout' },
      { stat: 'Accurate long balls per 90', weight: '+0.7', desc: 'Long-range distribution starting attacks' },
    ],
    negative: [
      { stat: 'Yellow cards', weight: '-1.5', desc: 'Disciplinary deduction' },
      { stat: 'Red cards', weight: '-2.0', desc: 'Severe match disadvantage deduction' },
      { stat: 'Fouls committed per 90', weight: '-0.9', desc: 'Dangerous set-piece conceding penalty' },
    ]
  },
  GK: {
    title: 'Goalkeeper (GK)',
    description: 'Calibrated on shot-stopping volume, goals prevented vs post-shot xG, and clean sheets.',
    positive: [
      { stat: 'Clean sheets', weight: '+1.5', desc: 'Complete defensive shutout' },
      { stat: 'Saves per 90', weight: '+1.5', desc: 'Shot-stopping activity & save volume' },
      { stat: 'Top scorer (Goals)', weight: '+1.5', desc: 'Legendary goalkeeper goals' },
      { stat: 'Goals prevented', weight: '+1.2', desc: 'Post-shot xG saved above expected' },
      { stat: 'Assists', weight: '+1.0', desc: 'Long-range direct counter assists' },
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

const LEAGUE_BONUS_DATA = [
  { finish: '1st (Champion)', bonus: '+70' },
  { finish: '2nd', bonus: '+50' },
  { finish: '3rd', bonus: '+38' },
  { finish: '4th', bonus: '+32' },
  { finish: '5th', bonus: '+24' },
  { finish: '6th', bonus: '+20' },
  { finish: '7th', bonus: '+16' },
  { finish: '8th', bonus: '+12' },
  { finish: '9th', bonus: '+8' },
  { finish: '10th', bonus: '+4' },
  { finish: '11th or lower', bonus: '0' },
];

const EUROPEAN_BONUS_DATA = [
  { round: 'Winner', bonus: '+130' },
  { round: 'Finalist (lost final)', bonus: '+70' },
  { round: 'Semi-final', bonus: '+38' },
  { round: 'Quarter-final', bonus: '+20' },
  { round: 'Round of 16', bonus: '+10' },
];

function EloMathModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('formula');
  const [selectedPosTab, setSelectedPosTab] = useState('ST');

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
    <div className="modal-backdrop math-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card math-modal-content" onClick={(e) => e.stopPropagation()}>
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
            className={`math-nav-btn ${activeTab === 'bonus' ? 'active' : ''}`}
            onClick={() => setActiveTab('bonus')}
          >
            Standings Bonus
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
                by its role-specific weight for that player's tactical position (<code>CB</code>, <code>FB</code>, <code>CDM</code>, <code>CM</code>, <code>CAM</code>, <code>WING</code>, <code>ST</code>, or <code>GK</code>).
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
                The stat-based rating is bounded at a floor of <strong>800</strong> to prevent statistical outliers from dipping into negative territory,
                and rounded to the nearest whole integer for clean display.
              </p>
            </div>

            <div className="math-step-card highlight-step">
              <div className="math-step-header">
                <span className="step-pill accent">Step 5</span>
                <h3 className="step-title">Standings & European Bonus</h3>
              </div>
              <div className="math-formula-box highlight">
                <code>ELO_FINAL = ELO + STANDINGS_BONUS</code>
                <div className="formula-params">
                  <span>League tables: STANDINGS_BONUS = League Finish Bonus</span>
                  <span>•</span>
                  <span>UCL / UEL tables: STANDINGS_BONUS = Knockout Round Bonus</span>
                </div>
              </div>
              <p className="step-description">
                Player performance is only half the story: team success matters too. After the stat-based ELO is calculated,
                every player receives a <strong>team-level bonus that matches the competition being rated</strong>.
                In a <strong>domestic league table</strong> the bonus is the club's league finish (top 10 only, <strong>+2 to +50</strong>).
                In the <strong>Champions League or Europa League table</strong> it is how deep the club went in that
                knockout stage (<strong>+10 to +100</strong>). The two are never mixed. The bonus is added <em>after</em> normalization and flooring, so it never distorts
                the positional averages. See the <strong>Standings Bonus</strong> tab for the full scales.
              </p>
            </div>

            <div className="tiers-overview-card">
              <h4 className="tiers-title">Calibrated Performance Tiers (based on ELO_FINAL)</h4>
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
              {[
                { id: 'ST', label: 'Striker (ST)' },
                { id: 'WING', label: 'Winger (RW/LW)' },
                { id: 'CAM', label: 'Attacking Mid (CAM)' },
                { id: 'CM', label: 'Central Mid (CM)' },
                { id: 'CDM', label: 'Defensive Mid (CDM)' },
                { id: 'FB', label: 'Fullback (RB/LB)' },
                { id: 'CB', label: 'Centre Back (CB)' },
                { id: 'GK', label: 'Goalkeeper (GK)' },
              ].map(role => (
                <button
                  key={role.id}
                  className={`pos-pill-btn ${selectedPosTab === role.id ? 'active' : ''}`}
                  onClick={() => setSelectedPosTab(role.id)}
                >
                  {role.label}
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
                    Δ_perf = (24 × 1.5) + (6 × 0.8) + (2.1 × 0.9) + (1.8 × 0.7) + (19.4 × 0.2) + (4.8 × 0.2)
                    - (12 × 1.0) - (3 × 1.5) - (1.1 × 0.9)
                  </div>
                  <div className="calc-result-badge">
                    Δ_perf = <strong>+31.30</strong>
                  </div>
                </div>
              </div>

              <div className="calc-flow-item">
                <div className="calc-flow-num">3</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Calculate ELO_RAW</div>
                  <div className="calc-code-line">
                    ELO_RAW = BASE_ELO + (K_FACTOR × Δ_perf) = 1500 + (10 × 31.30)
                  </div>
                  <div className="calc-result-badge">
                    ELO_RAW = <strong>1813.0</strong>
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
                    ELO = 1500 + (1813.0 - 1650.0) = 1500 + 163.0 = <strong>1663</strong>
                  </div>
                </div>
              </div>

              <div className="calc-flow-item">
                <div className="calc-flow-num">5</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Floor Clamping & Rounding</div>
                  <div className="calc-code-line">
                    ELO = round(max(800, 1663.0)) = <strong>1663</strong> • <span className="tier-badge tier-elite">Elite (1600+)</span>
                  </div>
                </div>
              </div>

              <div className="calc-flow-item">
                <div className="calc-flow-num">6</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Add League Finish Bonus (league table)</div>
                  <div className="calc-code-line">
                    This is his <strong>league</strong> rating, so only the league finish counts. His club finished <strong>3rd</strong>:
                    <br />
                    STANDINGS_BONUS = <strong>+38</strong>
                    <br />
                    <em>Any Champions League run is not counted here; it only affects his separate Champions League rating.</em>
                  </div>
                </div>
              </div>

              <div className="calc-flow-item final-step">
                <div className="calc-flow-num">7</div>
                <div className="calc-flow-content">
                  <div className="calc-flow-title">Final Rating</div>
                  <div className="calc-code-line">
                    ELO_FINAL = 1663 + 38 = <strong>1701</strong> • <span className="tier-badge tier-worldclass">World Class (1700+)</span>
                    <br />
                    <em>In his Champions League table, his CL stat ELO would instead get +50 for the semi-final run, with no league bonus.</em>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Standings & European Bonus */}
        {activeTab === 'bonus' && (
          <div className="math-modal-body">
            <div className="scope-notice-hero">
              <div>
                <h3 className="scope-hero-title">Team Success Bonus</h3>
                <p className="scope-hero-sub">Each table gets only its own bonus: league finish for league ELO, knockout round for Champions League / Europa League ELO.</p>
              </div>
            </div>

            <div className="math-step-card">
              <div className="math-step-header">
                <span className="step-pill accent">Formula</span>
                <h3 className="step-title">ELO_FINAL = ELO + STANDINGS_BONUS</h3>
              </div>
              <p className="step-description">
                Every player in a squad receives the <strong>same bonus</strong> within a given table, determined by the club's result in <em>that competition</em>.
                The bonus is applied <strong>after</strong> stat-based ELO is normalized and floored, and the final rating
                (<code>ELO_FINAL</code>) is what the leaderboard, podium, and tiers use.
              </p>
            </div>

            <div className="pos-detail-card">
              <h4 className="weights-section-title positive">League Finish Bonus (Top 10) — league tables only</h4>
              <div className="weights-table-container">
                <table className="weights-table">
                  <thead>
                    <tr>
                      <th>Final League Position</th>
                      <th>Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEAGUE_BONUS_DATA.map((row, idx) => (
                      <tr key={idx}>
                        <td className="weight-metric-name">{row.finish}</td>
                        <td className="weight-val positive">{row.bonus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="weights-section-title positive">UCL / UEL Knockout Bonus — Champions League &amp; Europa League tables only</h4>
              <div className="weights-table-container">
                <table className="weights-table">
                  <thead>
                    <tr>
                      <th>Furthest Round Reached</th>
                      <th>Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EUROPEAN_BONUS_DATA.map((row, idx) => (
                      <tr key={idx}>
                        <td className="weight-metric-name">{row.round}</td>
                        <td className="weight-val positive">{row.bonus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="scope-points-container">
              <div className="scope-point-card">
                <div className="scope-point-header">
                  <span className="scope-point-number">1</span>
                  <h4>Best Round Only</h4>
                </div>
                <p>
                  For European competitions, a team is credited with <strong>only the deepest round it reached</strong>
                  (e.g., a semi-finalist gets +50, not +50 +25 +10). The Champions League and Europa League share the same scale.
                </p>
              </div>

              <div className="scope-point-card">
                <div className="scope-point-header">
                  <span className="scope-point-number">2</span>
                  <h4>Never Mixed Across Tables</h4>
                </div>
                <p>
                  A club that finishes 2nd in the league and wins the Champions League gives its players <strong>+44 in the league table</strong>
                  and <strong>+100 in the Champions League table</strong>. The two bonuses are not added together, because each
                  competition is rated separately.
                </p>
              </div>

              <div className="scope-point-card">
                <div className="scope-point-header">
                  <span className="scope-point-number">3</span>
                  <h4>Only When Standings Data Exists</h4>
                </div>
                <p>
                  Bonuses are applied automatically when standings data is available for that season. If it is missing
                  (for example, a season still in progress), the bonus is simply <strong>0</strong> and <code>ELO_FINAL = ELO</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Scope Note */}
        {activeTab === 'scope' && (
          <div className="math-modal-body">
            <div className="scope-notice-hero">
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

              <div className="scope-point-card">
                <div className="scope-point-header">
                  <span className="scope-point-number">4</span>
                  <h4>Team Bonus Follows the Competition</h4>
                </div>
                <p>
                  Both <strong>stats</strong> and the <strong>team bonus</strong> stay isolated per competition. League tables only receive the
                  club's league-finish bonus, while Champions League and Europa League tables only receive the knockout-round bonus for that
                  European run. The bonus is a flat addition on top of the stat-based ELO and never changes how a player's own statistics are scored.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <div className="math-footer-note">
            <span>Formula standard: <strong>Footy ELO v2.2</strong> • 30 Positional Metrics • 1500 Baseline • Standings Bonus</span>
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