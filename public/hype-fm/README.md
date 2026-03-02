Place your music files in station folders to use them in HYPE CAT radio.

How to add tunes:
1. Copy audio files (for example `.mp3` or `.ogg`) into:
   - `public/hype-fm/hype/` for **HYPE FM**
   - `public/hype-fm/night/` for **NITE FM**
2. Edit `public/hype-fm/library2.json` manually.

The `library2.json` format is:

```json
{
  "stations": {
    "hype": [
      { "title": "Lo-Fi Cat", "file": "hype/lofi-cat.mp3" },
      { "title": "Purrwave", "file": "hype/purrwave.ogg" }
    ],
    "night": [
      { "title": "Moon Nap", "file": "night/moon-nap.mp3" }
    ]
  }
}
```

Notes:
- `file` must include station folder prefix: `hype/` or `night/`.
- After changing files or `library2.json`, refresh the app.
- If a station has no valid tracks, that station falls back to the built-in synth radio.
