# Deploy Guide

Questa cartella contiene esempi ripetibili per pubblicare l'app Node dietro Nginx.

## Opzione 1: Docker Compose

File principali:
- `../Dockerfile`
- `docker-compose.yml`
- `nginx/mantenimento-app-docker.conf`
- `.env.production.example`

Avvio:

```bash
cd deploy
docker compose up -d --build
```

Effetto:
- `app` espone Node sulla rete interna Docker
- `nginx` pubblica la porta `80` e inoltra le richieste all'app
- rate limit e filtri metodo restano applicati su `/api/`

Nota:
- questa variante e adatta a un reverse proxy o load balancer TLS esterno
- se vuoi terminare TLS direttamente in Nginx host, usa la configurazione `nginx/mantenimento-app.conf`

## Opzione 2: systemd + Nginx host

File principali:
- `systemd/mantenimento-app.service`
- `nginx/mantenimento-app.conf`
- `.env.production.example`
- `vps-checklist.md`
- `logrotate/mantenimento-app`

Passi tipici:

```bash
sudo mkdir -p /opt/mantenimento-app
sudo cp -R . /opt/mantenimento-app
cd /opt/mantenimento-app
npm ci
npm run build:frontend
sudo cp deploy/systemd/mantenimento-app.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mantenimento-app
sudo cp deploy/nginx/mantenimento-app.conf /etc/nginx/conf.d/mantenimento-app.conf
sudo nginx -t
sudo systemctl reload nginx
```

Nota:
- aggiorna `server_name` e percorsi certificati TLS nel file Nginx host
- crea `/opt/mantenimento-app/.env` per le variabili runtime opzionali partendo da `.env.production.example`

## Variabili runtime utili

- `PORT`
- `ACCESS_LOG_ENABLED`
- `ACCESS_LOG_SALT`
- `CALCULATE_RATE_WINDOW_MS`
- `CALCULATE_RATE_MAX_REQUESTS`

## Retention log

Per host Linux con Nginx puoi installare `logrotate/mantenimento-app` in `/etc/logrotate.d/` per:
- ruotare i log giornalmente
- comprimere gli archivi
- mantenere 7 rotazioni

## Checklist VPS

Per un bootstrap piu rigoroso usa `vps-checklist.md`.

## Verifiche rapide

```bash
curl -I http://localhost/api/health
curl -I http://localhost/
```