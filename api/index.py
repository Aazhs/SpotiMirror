import os
import random
import requests
import time
import json
from flask import Flask, redirect, request, session, jsonify
from dotenv import load_dotenv
from urllib.parse import urlencode
from supabase import create_client, Client

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "fallback-secret-key")

# Spotify configuration
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
API_BASE_URL = "https://api.spotify.com/v1"

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def fetch_top_music(access_token):
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        tracks_res = requests.get(f"{API_BASE_URL}/me/top/tracks?limit=5", headers=headers)
        artists_res = requests.get(f"{API_BASE_URL}/me/top/artists?limit=3", headers=headers)
        
        return {
            "top_tracks": tracks_res.json().get("items", []),
            "top_artists": artists_res.json().get("items", [])
        }
    except Exception as e:
        print(f"Error fetching top music: {e}")
        return {"top_tracks": [], "top_artists": []}

@app.route("/api/login")
def login():
    scope = "user-read-currently-playing user-read-playback-state user-top-read"
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": scope,
        "show_dialog": True
    }
    return redirect(f"{AUTH_URL}?{urlencode(params)}")

@app.route("/api/callback")
def callback():
    code = request.args.get("code")
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }
    
    response = requests.post(TOKEN_URL, data=data)
    token_info = response.json()
    
    if "access_token" in token_info:
        session["access_token"] = token_info["access_token"]
        return redirect("/")
    else:
        return jsonify({"error": "Failed to retrieve token"}), 400

@app.route("/api/me")
def get_me():
    if "access_token" not in session:
        return jsonify({"loggedIn": False}), 200
    return jsonify({
        "loggedIn": True,
        "username": session.get("username")
    })

@app.route("/api/logout")
def logout():
    username = session.get("username")
    if username and supabase:
        try:
            supabase.table("live_users").delete().eq("username", username).execute()
        except Exception as e:
            print(f"Error deleting user on logout: {e}")
    session.clear()
    return redirect("/")

@app.route("/api/set-username", methods=["POST"])
def set_username():
    if "access_token" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    new_name = request.json.get("username", "").strip()
    if not new_name or len(new_name) < 3 or len(new_name) > 20:
        return jsonify({"error": "Username must be 3-20 characters"}), 400
    
    session["username"] = new_name
    
    if supabase:
        stats = fetch_top_music(session["access_token"])
        try:
            supabase.table("live_users").upsert({
                "username": new_name,
                "stats": stats,
                "last_seen": int(time.time()),
                "coords": None,
                "track": None
            }).execute()
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"status": "success", "username": new_name})

@app.route("/api/update-status", methods=["POST"])
def update_status():
    if "username" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    username = session["username"]
    data = request.json
    
    if supabase:
        try:
            supabase.table("live_users").update({
                "coords": data.get("coords"),
                "track": data.get("track"),
                "last_seen": int(time.time())
            }).eq("username", username).execute()
        except Exception as e:
            print(f"Supabase update error: {e}")
    
    return jsonify({"status": "updated"})

@app.route("/api/active-users")
def get_active_users():
    if not supabase:
        return jsonify([])
    
    ten_minutes_ago = int(time.time()) - 600
    try:
        response = supabase.table("live_users") \
            .select("*") \
            .gt("last_seen", ten_minutes_ago) \
            .not_.is_("coords", "null") \
            .execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Supabase fetch error: {e}")
        return jsonify([])

@app.route("/api/currently-playing")
def currently_playing():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Not authenticated"}), 401

    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{API_BASE_URL}/me/player/currently-playing", headers=headers)

    if response.status_code == 204:
        return jsonify({"status": "idle"})
    
    if response.status_code == 200:
        data = response.json()
        if data.get("is_playing"):
            track = data["item"]
            return jsonify({
                "status": "playing",
                "track_name": track["name"],
                "artist_name": track["artists"][0]["name"],
                "album_art": track["album"]["images"][0]["url"] if track["album"]["images"] else None
            })
    
    return jsonify({"status": "idle"})

# Export the app for Vercel
app = app
