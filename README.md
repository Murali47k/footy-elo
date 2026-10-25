# <img src="images/icon.png" alt="Footy ELO Logo" width="36" height="36" align="center" valign="middle" /> FOOTY ELO

A position-weighted football player rating engine and analytics dashboard.

**Live Web Application:** [https://footy-elo.vercel.app/](https://footy-elo.vercel.app/)

---

## Overview

Traditional football player rating systems exhibit heavy bias toward attacking metrics, disproportionately rewarding goals and assists over defensive discipline and midfield control.

**Footy ELO** introduces a position-weighted rating engine that evaluates player performance within specific tactical roles, calibrates ratings against a 1500 baseline across Europe's top competitions, and incorporates team success through competition-specific standings bonuses.

### Live Deployment
The web dashboard is hosted and accessible at:  
**[https://footy-elo.vercel.app/](https://footy-elo.vercel.app/)**

---

## Screenshots

<p align="center">
  <img src="images/ui_1.png" alt="Footy ELO Rankings and Podium Dashboard" width="100%" />
</p>

<p align="center">
  <img src="images/ui_2.png" alt="Footy ELO Player Analytics and Role Distribution" width="100%" />
</p>

---

## Key Features

- **Multi-Competition Coverage**: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UEFA Champions League, and UEFA Europa League.
- **11-Season Database**: Comprehensive historical archives spanning from 2016/17 through the current 2026/27 campaign.
- **EA FC Tactical Role Resolution**: Pitch-coordinate mapping into 8 distinct tactical roles (`CB`, `FB`, `CDM`, `CM`, `CAM`, `WING`, `ST`, `GK`), ensuring players are measured directly against peers in equivalent positions.
- **Position-Mean Normalization**: Neutralizes attacking bias by centering each positional category around a 1500 baseline score.
- **Competition-Specific Standings Bonus**: Applies bonuses reflecting domestic league finishes or continental knockout-stage progression without distorting positional baselines.
- **Rating Math Transparency**: An interactive calculation modal built into the interface details the complete mathematical formulation, K-factor scales, and role-specific weight matrices.

---


## Local Setup

### Prerequisites
- Node.js (v18 or higher)
- Python 3.11 (optional, for backend scraping service)

### 1. Frontend Setup
```bash
# Clone the repository
git clone https://github.com/Murali47k/footy-elo.git
cd footy-elo

# Install dependencies
npm install

# Start development server
npm start
```
The application will launch at `http://localhost:3000`.

### 2. Backend Setup (Optional)
The client interface functions independently using static datasets in `public/elo_tables/`. To run the local scraping API:
```bash
# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt

# Start Flask server
python backend/server.py
```
The backend API will start at `http://localhost:5000`.

---

<br>

*Feel free to star ⭐ the repo and expand upon this idea.*

---
