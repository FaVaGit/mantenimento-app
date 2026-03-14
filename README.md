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

## Compliance GDPR e legale (checklist operativa)
Questa checklist aiuta a ridurre rischi di non conformita per istanze pubblicate in Italia/UE.

1. Governance e ruoli
- Definisci il titolare del trattamento per ogni istanza pubblicata.
- Se usi fornitori cloud, verifica nomina a responsabile del trattamento (DPA) dove richiesto.

2. Documentazione minima
- Mantieni aggiornate `privacy.html`, `cookie.html` e `termini.html`.
- Mantieni un registro dei trattamenti (art. 30 GDPR) se applicabile alla tua organizzazione.

3. Basi giuridiche e minimizzazione
- Tratta solo dati necessari al calcolo e alle funzioni richieste.
- Documenta base giuridica per account, sincronizzazione e sicurezza.

4. Sicurezza
- Non salvare segreti backend nel frontend.
- Mantieni cifratura lato client del profilo cloud.
- Applica controllo accessi, backup e monitoraggio su infrastruttura server.

5. Conservazione e diritti interessati
- Definisci tempi/criteri di retention per dati cloud e log tecnici.
- Predisponi processo per richieste di accesso, rettifica, cancellazione e opposizione.

6. Cookie e storage locale
- Usa storage locale solo per finalita tecniche necessarie.
- In caso di strumenti analytics/marketing futuri, valuta banner e consenso dove richiesto.

7. Licenze software
- Verifica compatibilita licenze di dipendenze e librerie terze.
- Mantieni file `LICENSE` e attribuzioni necessarie nei materiali distribuiti.

8. Ambito medico-legale
- Questo progetto NON e un dispositivo medico e non fornisce pareri legali.
- Evita claim diagnostici/clinici o automatismi decisionali su diritti soggettivi.
