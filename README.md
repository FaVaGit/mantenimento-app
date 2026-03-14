# Calcolatore Mantenimento Figli

Applicazione web per il calcolo orientativo dell'assegno di mantenimento con architettura separata frontend/backend.

## Nuova architettura
- `frontend/public/index.html`: UI
- `frontend/public/app.js`: logica frontend (render, eventi, PDF)
- `backend/server.js`: server Node/Express
- `backend/calculate-model.js`: formula di calcolo server-side (`/api/calculate`)
- `scripts/build-frontend.mjs`: minificazione frontend (`app.min.js`)
- `supabase_schema.sql`: schema DB per KeyLock

## Perche questa separazione
- Il frontend non contiene piu la formula principale in chiaro: il calcolo viene fatto da backend via API.
- Il JS client e modulare (non inline) e puo essere minificato per distribuzione.

Nota importante:
Nessuna applicazione web puo essere resa "non copiabile" al 100% lato browser. La protezione reale si ottiene spostando la logica sensibile sul server e distribuendo solo client minimizzato.

## Avvio locale
1. Installa dipendenze:

```bash
npm install
```

2. Avvio sviluppo:

```bash
npm run dev
```

3. Apri:

```text
http://localhost:3000
```

## Build frontend minificato

```bash
npm run build:frontend
```

Il server serve automaticamente `app.min.js` se presente, altrimenti `app.js`.

## Avvio produzione locale

```bash
npm start
```

`npm start` esegue build frontend + avvio server.

## Endpoint backend
- `POST /api/calculate`: calcolo modello mantenimento
- `GET /api/health`: health check

## KeyLock multi-device (Supabase)
Il login cloud resta lato frontend e usa `supabase-config.js` (chiave anon pubblica).
Non inserire nel frontend segreti server o credenziali DB.

Per la registrazione utente:
- l'utente inserisce `username + email + password`
- Supabase invia email di verifica
- il login diventa disponibile dopo conferma email

In Supabase `Authentication > Providers > Email` mantieni attiva la conferma email.

## SEO e visibilita web
Sono inclusi:
- meta tag SEO/OG/Twitter in `frontend/public/index.html`
- dati strutturati JSON-LD `SoftwareApplication`
- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`

Se pubblichi su un dominio diverso da GitHub Pages, aggiorna URL canonico, `og:url`, `robots.txt` e `sitemap.xml`.

## Deploy
Con la nuova architettura non e piu un sito statico puro: serve un runtime Node.js.

Opzioni tipiche:
- Render
- Railway
- Fly.io
- VPS con Node + reverse proxy

## Note
- Strumento orientativo: non sostituisce valutazione legale/professionale.
- Per ulteriore hardening: rate limit API, auth server-side, logging audit, WAF/CDN.
