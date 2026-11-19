# Gnomologia

A personal archive of things people say.

## What's included

- Uniform quote bubbles on a midnight-blue background
- Gray, soft-white, plum and dusty-purple bubble accents
- Add, edit, delete and favorite quotes
- Search quotes and browse by person
- Drag-and-drop rearranging (desktop) and touch rearranging (mobile)
- Local browser storage
- JSON export and import
- Installable Progressive Web App foundation with offline caching

## Run locally

For the best PWA experience, serve this folder over localhost:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

You can also open `index.html` directly for basic use, but service-worker installation requires localhost or HTTPS.

## Data

Quotes are stored in this browser's local storage. Export a backup from Settings before clearing browser data or changing devices.

## Next

This is the first personal-app version. An account system, cloud sync and social features can be added later without changing the core visual concept.
