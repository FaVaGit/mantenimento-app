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
- Il frontend invia il payload di calcolo al backend via API sullo stesso dominio oppure a un endpoint esplicitamente configurato.
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
- `POST /api/calculate`: calcolo modello mantenimento server-side; il payload transita su HTTPS/TLS in produzione e la risposta applica header `Cache-Control: no-store`
- `GET /api/health`: health check

Parametri server utili:
- `CALCULATE_RATE_WINDOW_MS`: finestra del rate limit per `/api/calculate` (default `60000`)
- `CALCULATE_RATE_MAX_REQUESTS`: massimo richieste per IP nella finestra (default `30`)
- `ACCESS_LOG_ENABLED`: abilita log strutturati minimizzati, attivo di default in produzione
- `ACCESS_LOG_SALT`: sale usato per anonimizzare il riferimento client nei log applicativi
- payload JSON in ingresso limitato a `64kb`

### URL login sicuro (token monouso)
Per evitare credenziali in chiaro nel link, e disponibile un flusso `authToken` firmato server-side.

Variabili ambiente backend richieste:
- `AUTH_URL_LOGIN_SECRET`: segreto HMAC (lungo e casuale)
- `AUTH_URL_LOGIN_ALLOWED_USER`: utente consentito (default `favagit`)
- `AUTH_URL_LOGIN_SUPABASE_URL`: URL progetto Supabase
- `AUTH_URL_LOGIN_SUPABASE_ANON_KEY`: anon key Supabase
- `AUTH_URL_LOGIN_SUPABASE_EMAIL`: email account da autenticare via URL token
- `AUTH_URL_LOGIN_SUPABASE_PASSWORD`: password account da autenticare via URL token
- `AUTH_URL_LOGIN_MAX_TTL_SEC`: TTL massimo token (default `180`)
- `API_ALLOWED_ORIGINS`: origini consentite per API cross-origin (es. `https://favagit.github.io`)

Generazione token e link:

```bash
npm run auth:url-token -- --sub=favagit --ttl=120 --baseUrl=https://favagit.github.io/mantenimento-app/
```

Il comando stampa un link del tipo:

```text
https://favagit.github.io/mantenimento-app/?autologin=1&authToken=...
```

Note sicurezza:
- Il token e monouso, con scadenza breve e firma HMAC.
- I parametri sensibili vengono rimossi dalla barra URL subito dopo la lettura.
- Il login via `authPass`/`authPass64` e disabilitato per hardening.

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

Per deploy su VPS e disponibile un esempio Nginx in `deploy/nginx/mantenimento-app.conf` con:
- redirect HTTP -> HTTPS
- TLS 1.2/1.3
- rate limit e limitazione connessioni su `/api/calculate`
- filtro L7 sui metodi per `/api/`
- access log minimizzato senza query string e senza payload

Sono inclusi anche asset ops ripetibili:
- `Dockerfile` per containerizzare l'app Node con bundle frontend gia generato
- `deploy/docker-compose.yml` per eseguire Node dietro Nginx con rete interna dedicata
- `deploy/docker-compose.override.yml` per staging/production con healthcheck e logging container
- `deploy/docker-compose.tls.yml` per TLS locale o staging con certificati montati nel container Nginx
- `deploy/nginx/mantenimento-app-docker.conf` per il reverse proxy Compose
- `deploy/nginx/mantenimento-app-docker-tls.conf` per la terminazione TLS nel profilo Compose dedicato
- `deploy/systemd/mantenimento-app.service` per installazione host-based con systemd
- `deploy/.env.production.example` come base per le variabili runtime di produzione
- `deploy/vps-checklist.md` per il bootstrap host-based
- `deploy/logrotate/mantenimento-app` per retention minima dei log Nginx
- `deploy/README.md` con i passaggi operativi essenziali

## Note
- Strumento orientativo: non sostituisce valutazione legale/professionale.
- Hardening gia applicato: redirect HTTPS in produzione, HSTS su connessioni sicure, `Cache-Control: no-store` sulle risposte di calcolo, rate limit in memoria per IP, body limit JSON a `64kb`, request ID e logging applicativo minimizzato senza payload o query string.
- Per ulteriore hardening: auth server-side, WAF/CDN e storage centralizzato dei log con retention breve.

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
- Proteggi il trasporto del payload di calcolo con HTTPS/TLS end-to-end verso il backend pubblicato e considera il dato leggibile dal server applicativo durante l'elaborazione.
- Mantieni redirect HTTPS, HSTS, no-store sulle risposte di calcolo e policy di logging che non serializzino i payload sensibili.
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
