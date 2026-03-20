# Google Map Website

Minimal starter skeleton with:

- `client`: plain HTML/CSS/JavaScript
- `server`: Node.js + Express

## Requirements

- Node.js 20+
- npm 10+

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```text
.
├── client
│   ├── css
│   │   ├── offline.css
│   │   └── styles.css
│   ├── js
│   │   └── main.js
│   ├── index.html
│   ├── offline.html
│   └── serviceWorker.js
├── server
│   ├── src
│   │   └── index.js
│   └── package.json
└── package.json
```

## Offline Support

- `serviceWorker.js` caches base files.
- `offline.html` is used as a fallback for navigation requests when the network is unavailable.
