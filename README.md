# SpotiMirror

A real-time, privacy-focused global map that visualizes what people are listening to on Spotify right now. Discover new music and see the collective vibe of the world through an anonymous, interactive experience.

[![SpotiMirror Banner](https://images.unsplash.com/photo-1623018035813-9cfb5b502e04?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)](https://github.com/Aazhs/SpotiMirror)

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
- **API**: [Spotify Web API](https://developer.spotify.com/documentation/web-api) for music metadata and authentication.

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
   # Spotify Credentials (from developer.spotify.com)
   SPOTIFY_CLIENT_ID=your_id
   SPOTIFY_CLIENT_SECRET=your_secret
   # For local dev: http://127.0.0.1:5173/api/callback
   # For production: https://your-app.vercel.app/api/callback
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

## 🎨 Customization

You can easily adapt SpotiMirror to fit your own vision:

### Adjusting Privacy (Location Fuzzing)
If you want to change how much "fuzz" is added to the user's location, modify the `scale` variable in `src/App.jsx`:
```javascript
const generateFuzzOffset = () => {
    const scale = 0.006; // Increasing this makes the position less accurate (more privacy)
    return [(Math.random() - 0.5) * scale, (Math.random() - 0.5) * scale];
};
```

### Changing the Map Style
The map uses Leaflet. You can swap the TileLayer URL in `src/App.jsx` to use different styles from providers like Mapbox, Stadia, or CARTO:
```javascript
<TileLayer 
    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
    attribution='&copy; CARTO' 
/>
```

### Database Schema (Supabase)
To host this yourself, you'll need a `live_users` table in Supabase with the following columns:
- `username` (text, primary key)
- `stats` (jsonb)
- `last_seen` (int8)
- `coords` (jsonb)
- `track` (jsonb)

## 🌐 Deployment

The project is optimized for deployment on **Vercel**. 

- The backend is located in the `/api` folder to automatically serve as serverless functions.
- The `vercel.json` ensures API requests are routed correctly to the Flask application.

### Important Note for Spotify Dev Mode
If the app is in "Development Mode" on your Spotify Dashboard:
1. Go to **User Management**.
2. Manually whitelist the emails of users you want to allow to log in.
3. Once ready, apply for a **Quota Extension** on the Spotify Dashboard to go public.

## 🛡️ Privacy

SpotiMirror was built on the principle of sharing music without sacrificing safety.
- **No storage of personal data**: We don't save your Spotify email or profile name.
- **Browser-side fuzzing**: The logic to offset your location runs in your browser, so our database never even "sees" your exact house or building.

## ⚖️ Credits & Legal

- **Data Source**: Music data provided by [Spotify](https://www.spotify.com).
- **Icons**: [Lucide Icons](https://lucide.dev).
- **Maps**: [Leaflet](https://leafletjs.com) and [CARTO](https://carto.com).

This project is not affiliated with, maintained, or endorsed by Spotify. It is an independent project using the Spotify Web API.

---
Built with 💚 by Aarsh Joshi for music lovers.
