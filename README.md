# SpotiMirror

A real-time, privacy-focused global map that visualizes what people are listening to on Spotify right now. Discover new music and see the collective vibe of the world through an anonymous, interactive experience.

![SpotiMirror Demo](https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1200&auto=format&fit=crop)

## ⚡ Features

- **Live Global Map**: Interactive Leaflet-based map showing real-time listening activity across the globe.
- **Privacy-First Design**: 
    - **Pseudonyms**: Join the map using a custom handle instead of your Spotify profile name.
    - **Location Fuzzing**: Your precise location never leaves your browser. A random ~500m to 1km offset is applied locally before your coordinates are shared.
- **Spotify Integration**: Automatically syncs your "Currently Playing" track and shares your top tracks/artists with those who discover your pin.
- **Seamless Auth**: Simple OAuth flow through the Spotify Developer API.
- **Modern UI**: A dark-themed, glassmorphic interface built with Tailwind CSS and Framer-inspired animations.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Leaflet (React-Leaflet).
- **Backend**: Python (Flask) served via Vercel Serverless Functions.
- **Database**: Supabase (PostgreSQL) for real-time user status and geolocation.
- **API**: Spotify Web API for user authentication and music metadata.

## 🚀 Getting Started

### Prerequisites

- A [Spotify Developer](https://developer.spotify.com/dashboard) account.
- A [Supabase](https://supabase.com/) project.
- Python 3.9+ and Node.js 18+.

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aazhs/SpotiMirror.git
   cd SpotiMirror
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # Spotify Credentials
   SPOTIFY_CLIENT_ID=your_id
   SPOTIFY_CLIENT_SECRET=your_secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/api/callback

   # Flask Secret
   FLASK_SECRET_KEY=your_random_string

   # Supabase Credentials
   SUPABASE_URL=your_project_url
   SUPABASE_KEY=your_anon_key
   ```

3. **Install Dependencies**:
   ```bash
   # Install Frontend
   npm install

   # Install Backend
   pip install -r requirements.txt
   ```

4. **Run Locally**:
   You'll need two terminals:
   ```bash
   # Terminal 1: Flask Backend
   python api/index.py

   # Terminal 2: Vite Frontend
   npm run dev
   ```

## 🌐 Deployment

The project is optimized for deployment on **Vercel**. 

- The backend is located in the `/api` folder to automatically serve as serverless functions.
- The `vercel.json` ensures API requests are routed correctly to the Flask application.

### Important Note for Spotify Dev Mode
If the app is in "Development Mode" on your Spotify Dashboard:
1. Go to **User Management**.
2. Manually whitelist the emails of users you want to allow to log in.

## 🛡️ Privacy

SpotiMirror was built on the principle of sharing music without sacrificing safety.
- **No storage of personal data**: We don't save your Spotify email or profile name.
- **Browser-side fuzzing**: The logic to offset your location runs in your browser, so our database never even "sees" your exact house or building.

---
Built with 💚 for music lovers.
