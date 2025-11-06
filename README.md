# 🎵 Spotify Now Playing API 🎵

Simple API to fetch your currently playing track from Spotify.

## 🚀 Quick Start

```bash
npm install
npm start
```

## 🔑 Setup

### 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **"Create app"**
3. Fill in app name and description
4. Set **Redirect URI**: `https://example.com/callback`
5. Save and copy your **Client ID** and **Client Secret**

### 2. Get Refresh Token

#### Authorization URL
Replace `YOUR_CLIENT_ID` and visit this URL:
```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://example.com/callback&scope=user-read-currently-playing
```

After authorizing, you'll be redirected to a URL like:
```
https://example.com/callback?code=AQD...
```

Copy the **code** parameter.

#### Exchange for Refresh Token

```bash
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Authorization: Basic $(echo -n CLIENT_ID:CLIENT_SECRET | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=YOUR_CODE&redirect_uri=https://example.com/callback"
```

Copy the **refresh_token** from the response.

### 3. Configure Environment

Create `.env` file:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

Optional:
```env
ALLOWED_ORIGIN_DOMAIN=yourdomain.com  # CORS: Restricts API access to your domain only
PORT=80  # Default is 80
```

## 🌐 API

### GET `/api/now-playing`

**Playing response:**
```json
{
  "isPlaying": true,
  "title": "Song Name",
  "artist": "Artist Name",
  "artistUrl": "https://open.spotify.com/artist/...",
  "albumImageUrl": "https://i.scdn.co/image/...",
  "songUrl": "https://open.spotify.com/track/...",
  "timePlayed": 45000,
  "timeTotal": 180000
}
```

**If nothing is being played:**
```json
{
  "isPlaying": false
}
```

## 🎧 Usage Example

```javascript
fetch('http://localhost:80/api/now-playing')
  .then(res => res.json())
  .then(data => {
    if (data.isPlaying) {
      console.log(`${data.title} by ${data.artist}`);
    }
  });
```