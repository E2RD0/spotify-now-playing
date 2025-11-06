import 'dotenv/config';
import express from 'express';
import querystring from 'node:querystring';
import cors from 'cors';

const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  ALLOWED_ORIGIN_DOMAIN,
  PORT = 80,
} = process.env;

// Validate environment variables
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const app = express();

// Configure CORS
const corsOptions = ALLOWED_ORIGIN_DOMAIN
  ? {
      origin: (origin, callback) => {
        const domainRegex = new RegExp(`^https:\\/\\/([a-zA-Z0-9-]+\\.)*${ALLOWED_ORIGIN_DOMAIN.replace('.', '\\.')}(?::\\d+)?$`);
        const localhostRegex = /^http:\/\/localhost(?::\d+)?$/;
        
        if (!origin || domainRegex.test(origin) || localhostRegex.test(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
    }
  : {};

app.use(cors(corsOptions));

// Get Spotify access token
const getAccessToken = async () => {
  const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token error: ${response.status}`);
  }

  return response.json();
};

// Format song data
const formatSongData = (song) => ({
  isPlaying: song.is_playing ?? false,
  title: song.item?.name ?? null,
  artist: (song.item?.artists ?? []).map(a => a.name).join(', '),
  artistUrl: song.item?.album?.artists?.[0]?.external_urls?.spotify ?? null,
  albumImageUrl: song.item?.album?.images?.[0]?.url ?? null,
  songUrl: song.item?.external_urls?.spotify ?? null,
  timePlayed: song.progress_ms ?? 0,
  timeTotal: song.item?.duration_ms ?? 0,
});

// Now Playing endpoint
app.get('/api/now-playing', async (_req, res) => {
  try {
    const { access_token } = await getAccessToken();
    const response = await fetch(SPOTIFY_NOW_PLAYING_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (response.status === 204 || response.status > 400) {
      return res.status(200).json({ isPlaying: false });
    }

    const song = await response.json();
    return res.status(200).json(formatSongData(song));
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Spotify Now Playing API running on http://localhost:${PORT}`);
});
