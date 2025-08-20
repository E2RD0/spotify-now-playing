import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import querystring from 'querystring';
import cors from 'cors';


const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  ALLOWED_ORIGIN_DOMAIN,
} = process.env;

console.log('Environment Variables:', {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
});
const app = express();

const domainRegex = new RegExp(`^https:\\/\\/([a-zA-Z0-9-]+\\.)*${ALLOWED_ORIGIN_DOMAIN.replace('.', '\\.')}(?::\\d+)?$`);
const localhostRegex = /^http:\/\/localhost(?::\d+)?$/;app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (domainRegex.test(origin) || localhostRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

async function getAccessToken() {
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Token error ${response.status}: ${t}`);
  }
  return response.json();
}

app.get('/api/now-playing', async (_req, res) => {
  try {
    const { access_token } = await getAccessToken();

    const r = await fetch(NOW_PLAYING_ENDPOINT, { headers: { Authorization: `Bearer ${access_token}` } });

    if (r.status === 204) return res.status(204).json({ error: 'Currently Not Playing' });

    if (!r.ok) return res.status(r.status).json({ error: 'Unable to Fetch Song' });

    const song = await r.json();
    res.json({
      albumImageUrl: song.item?.album?.images?.[0]?.url ?? null,
      artist: (song.item?.artists ?? []).map(a => a.name).join(', '),
      isPlaying: song.is_playing ?? false,
      songUrl: song.item?.external_urls?.spotify ?? null,
      title: song.item?.name ?? null,
      timePlayed: song.progress_ms ?? 0,
      timeTotal: song.item?.duration_ms ?? 0,
      artistUrl: song.item?.album?.artists?.[0]?.external_urls?.spotify ?? null,
    });
  } catch (e) {
    console.error(e);
    console.log("error")
    res.status(500).json({ error: 'Internal Error' });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Now Playing API listening on http://localhost:${PORT}`));
