import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Music, MapPin, User, LogIn, Disc, X, Heart, Star, Shield, ShieldAlert, ArrowRight, Zap } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Helper to add "fuzz" to coordinates (random offset of ~500m to 1km)
const generateFuzzOffset = () => {
    const scale = 0.006; 
    return [(Math.random() - 0.5) * scale, (Math.random() - 0.5) * scale];
};

function MapViewUpdater({ coords }) {
    const map = useMap();
    const hasCentered = useRef(false);

    useEffect(() => {
        if (coords && !hasCentered.current) {
            map.setView(coords, 14);
            hasCentered.current = true;
        }
    }, [coords, map]);

    return null;
}

function App() {
    const [authStatus, setAuthStatus] = useState({ loggedIn: false, username: null });
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [tempUsername, setTempUsername] = useState('');
    
    const [allUsers, setAllUsers] = useState([]);
    const [myTrack, setMyTrack] = useState(null);
    const [fuzzedCoords, setFuzzedCoords] = useState(null); 
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState(null);

    // Persistent fuzz offset for this session
    const fuzzOffset = useRef(generateFuzzOffset());
    const trackRef = useRef(null);
    const coordsRef = useRef(null);

    useEffect(() => { trackRef.current = myTrack; }, [myTrack]);
    useEffect(() => { coordsRef.current = fuzzedCoords; }, [fuzzedCoords]);

    // 1. Check Login Status
    useEffect(() => {
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                setAuthStatus(data);
                if (data.loggedIn && !data.username) {
                    setIsSettingUp(true);
                }
            })
            .catch(() => console.log("Not logged in"));
    }, []);

    // 2. Start Location Tracking
    useEffect(() => {
        if (!authStatus.username) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const fuzzed = [
                    pos.coords.latitude + fuzzOffset.current[0], 
                    pos.coords.longitude + fuzzOffset.current[1]
                ];
                setFuzzedCoords(fuzzed);
            },
            (err) => setError("Location access denied."),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [authStatus.username]);

    // 3. Heartbeat Sync
    useEffect(() => {
        if (!authStatus.username) return;

        const heartbeat = async () => {
            if (!coordsRef.current) return;
            try {
                await fetch('/api/update-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        coords: coordsRef.current, 
                        track: trackRef.current 
                    })
                });
                const res = await fetch('/api/active-users');
                const data = await res.json();
                setAllUsers(data);
            } catch (err) {
                console.error("Heartbeat failed", err);
            }
        };

        const interval = setInterval(heartbeat, 5000);
        heartbeat();
        return () => clearInterval(interval);
    }, [authStatus.username]);

    // 4. Poll for MY track
    useEffect(() => {
        if (!authStatus.username) return;

        const fetchMyTrack = async () => {
            try {
                const res = await fetch('/api/currently-playing');
                const data = await res.json();
                setMyTrack(data);
            } catch (err) {
                console.error("Failed to fetch track", err);
            }
        };

        fetchMyTrack();
        const interval = setInterval(fetchMyTrack, 5000);
        return () => clearInterval(interval);
    }, [authStatus.username]);

    const handleLogin = () => {
        window.location.href = '/api/login';
    };

    const handleSetUsername = async () => {
        if (tempUsername.length < 3) return;
        try {
            const res = await fetch('/api/set-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: tempUsername })
            });
            if (res.ok) {
                const data = await res.json();
                setAuthStatus({ loggedIn: true, username: data.username });
                setIsSettingUp(false);
            }
        } catch (err) {
            console.error("Failed to set username", err);
        }
    };

    // Create a custom icon with the album art
    const createCustomIcon = (user) => {
        const isPlaying = user.track?.status === 'playing';
        const imageUrl = isPlaying ? user.track.album_art : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop';
        const isMe = user.username === authStatus.username;
        
        const html = `
            <div class="relative group cursor-pointer">
                <div class="w-12 h-12 rounded-full border-4 ${isMe ? 'border-spotify-green shadow-spotify-green/40' : 'border-white'} overflow-hidden shadow-lg transition-transform hover:scale-110 bg-zinc-800 flex items-center justify-center">
                    <img src="${imageUrl}" class="w-full h-full object-cover ${!isPlaying ? 'opacity-50 grayscale' : ''}" />
                    ${!isPlaying ? '<div class="absolute inset-0 flex items-center justify-center text-white/30"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div>' : ''}
                </div>
                <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md border border-zinc-700 whitespace-nowrap shadow-xl">
                    ${user.username}
                </div>
            </div>
        `;
        return L.divIcon({ html, className: 'custom-div-icon', iconSize: [48, 48], iconAnchor: [24, 24] });
    };

    if (isSettingUp) {
        return (
            <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center p-6 font-sans text-zinc-100">
                <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-8 animate-in zoom-in duration-300">
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-16 h-16 bg-spotify-green/10 rounded-2xl flex items-center justify-center text-spotify-green mb-4 border border-spotify-green/20">
                            <Shield size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">Privacy First</h1>
                        <p className="text-zinc-400 text-sm">Join SpotiMirror without revealing your identity.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Pick a pseudonym</label>
                            <input 
                                type="text" 
                                value={tempUsername}
                                onChange={(e) => setTempUsername(e.target.value)}
                                placeholder="e.g. NeonVibe"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-spotify-green transition-colors"
                            />
                        </div>

                        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex gap-3 items-start">
                            <ShieldAlert className="text-spotify-green shrink-0" size={18} />
                            <div className="space-y-1">
                                <p className="text-zinc-100 text-xs font-bold uppercase">Location Fuzzing</p>
                                <p className="text-zinc-400 text-xs leading-relaxed">
                                    Your real location never leaves this browser. We automatically add a random 500m offset before sending your pin to the map.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSetUsername}
                        disabled={tempUsername.length < 3}
                        className="w-full flex items-center justify-center gap-2 bg-spotify-green hover:bg-[#1ed760] disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-all active:scale-95 group"
                    >
                        Join the Map
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-zinc-950">
            <MapContainer center={[20, 0]} zoom={3} className="h-full w-full" zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                {allUsers.map(user => (
                    <Marker 
                        key={user.username} 
                        position={user.coords} 
                        icon={createCustomIcon(user)}
                        eventHandlers={{ click: () => setSelectedUser(user) }}
                    >
                        <Popup>
                            <div className="text-zinc-900 p-1">
                                <p className="font-bold flex items-center gap-1 mb-1"><User size={14} /> {user.username}</p>
                                <p className="text-xs text-zinc-500 italic">Click to view profile</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                <MapViewUpdater coords={fuzzedCoords} />
            </MapContainer>

            {/* Main UI Overlay */}
            <div className="absolute top-6 right-6 z-[1000] w-full max-w-sm pointer-events-none">
                <div className="pointer-events-auto bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl p-6 font-sans">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-spotify-green/20 rounded-lg">
                            <Zap className="text-spotify-green" size={24} fill="currentColor" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-100 tracking-tighter">SpotiMirror</h1>
                    </div>

                    {!authStatus.username ? (
                        <div className="space-y-4 text-zinc-400">
                            <p className="text-sm leading-relaxed">Share your currently playing track on a global map anonymously.</p>
                            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-2 bg-spotify-green hover:bg-[#1ed760] text-black font-bold py-3 px-6 rounded-full transition-all shadow-lg shadow-spotify-green/20">
                                <LogIn size={18} /> Login with Spotify
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700"><User size={20} /></div>
                                    <div>
                                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Pseudonym</p>
                                        <p className="text-zinc-100 font-bold">{authStatus.username}</p>
                                    </div>
                                </div>
                                <div className={`h-2 w-2 rounded-full ${fuzzedCoords ? 'bg-spotify-green shadow-[0_0_8px_rgba(29,185,84,0.6)]' : 'bg-zinc-600'}`}></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider"><Music size={12} /><span>My Vibe</span></div>
                                {myTrack?.status === 'playing' ? (
                                    <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-800/50 flex items-center gap-3">
                                        <img src={myTrack.album_art} className="w-10 h-10 rounded shadow-md" alt="art" />
                                        <div className="overflow-hidden">
                                            <p className="text-zinc-100 font-semibold truncate leading-tight">{myTrack.track_name}</p>
                                            <p className="text-zinc-500 text-sm truncate">{myTrack.artist_name}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-800/50 flex items-center gap-3 opacity-60">
                                        <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-600">
                                            <Disc size={20} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-zinc-400 font-medium text-sm leading-tight">Quiet Hours</p>
                                            <p className="text-zinc-600 text-xs truncate">Vibing in silence</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => window.location.href = '/api/logout'} className="w-full mt-4 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 text-xs font-bold py-2 rounded-xl transition-all border border-zinc-700 hover:border-red-900/50 font-sans">
                                <X size={14} /> Logout Session
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Sidebar */}
            {selectedUser && (
                <div className="absolute top-0 left-0 z-[2000] h-screen w-full max-w-md bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 shadow-2xl animate-in slide-in-from-left duration-500 font-sans">
                    <div className="p-8 h-full overflow-y-auto">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors pointer-events-auto"><X size={24} /></button>
                        <div className="flex flex-col items-center mb-10">
                            <div className="w-24 h-24 rounded-full bg-spotify-green/10 flex items-center justify-center text-spotify-green mb-4 border border-spotify-green/20"><User size={48} /></div>
                            <h2 className="text-3xl font-black text-white tracking-tight">{selectedUser.username}</h2>
                            <p className="text-zinc-500 font-medium">Listening from the map</p>
                        </div>
                        {/* Top Artists */}
                        <div className="mb-10">
                            <div className="mb-4 text-zinc-100 uppercase tracking-widest text-xs font-bold"><Star size={14} className="inline mr-2 text-spotify-green" /> Top Artists</div>
                            <div className="grid gap-3">
                                {selectedUser.stats?.top_artists?.map((a, i) => (
                                    <a 
                                        key={i} 
                                        href={a.external_urls?.spotify} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 hover:border-spotify-green/50 hover:bg-zinc-900 transition-all group"
                                    >
                                        <img src={a.images[0]?.url} className="w-12 h-12 rounded-full object-cover shadow-lg" alt="art" />
                                        <span className="text-white font-bold group-hover:text-spotify-green transition-colors">{a.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Top Tracks */}
                        <div>
                            <div className="text-zinc-100 uppercase tracking-widest text-xs font-bold mb-4"><Heart size={14} className="inline mr-2 text-red-500" /> Favorite Tracks</div>
                            <div className="space-y-4">
                                {selectedUser.stats?.top_tracks?.map((t, i) => (
                                    <a 
                                        key={i} 
                                        href={t.external_urls?.spotify} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 group p-2 -mx-2 rounded-xl hover:bg-zinc-900 transition-all"
                                    >
                                        <img src={t.album?.images[0]?.url} className="w-14 h-14 rounded-lg shadow-lg group-hover:scale-105 transition-transform" alt="art" />
                                        <div className="overflow-hidden">
                                            <p className="text-white font-bold truncate group-hover:text-spotify-green transition-colors">{t.name}</p>
                                            <p className="text-zinc-500 text-sm truncate">{t.artists.map(a => a.name).join(', ')}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Spotify Shoutout Overlay */}
            <a 
                href="https://open.spotify.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute bottom-6 left-6 z-[1000] flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full py-2.5 px-4 shadow-2xl hover:bg-zinc-800 transition-all group pointer-events-auto"
            >
                <div className="text-spotify-green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.501 17.291c-.221.361-.689.469-1.05.249-2.793-1.706-6.307-2.091-10.452-1.143-.411.093-.819-.163-.912-.573-.093-.411.163-.819.573-.912 4.545-1.04 8.441-.595 11.592 1.33.361.221.469.689.249 1.05zm1.472-3.26c-.279.453-.872.599-1.325.32-3.195-1.963-8.067-2.531-11.848-1.383-.509.154-1.052-.136-1.206-.645-.154-.509.136-1.052.645-1.206 4.316-1.31 9.688-.675 13.414 1.614.453.279.599.872.32 1.325zm.126-3.413c-3.832-2.276-10.161-2.486-13.844-1.368-.588.178-1.21-.157-1.388-.745-.178-.588.157-1.21.745-1.388 4.237-1.287 11.219-1.036 15.65 1.594.53.314.7.997.386 1.527-.314.53-.997.7-1.527.386z"/>
                    </svg>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-100 transition-colors uppercase tracking-wider">
                    Shoutouts to <span className="text-spotify-green">Spotify</span> For making API
                </span>
            </a>
        </div>
    );
}

export default App;
