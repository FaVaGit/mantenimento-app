# VPS Bootstrap Checklist

Usa questa checklist quando pubblichi l'app su una VPS Linux con Nginx davanti a Node.

## Sistema base

- aggiorna pacchetti di sistema
- crea un utente tecnico dedicato oppure usa un account di deploy non privilegiato
- abilita firewall solo per `22`, `80`, `443`
- sincronizza l'orario con `systemd-timesyncd` o equivalente

## Runtime applicativo

- installa Node.js LTS 20+
- copia l'app in `/opt/mantenimento-app`
- esegui `npm ci`
- esegui `npm run build:frontend`
- crea `/opt/mantenimento-app/.env` partendo da `deploy/.env.production.example`

## Servizio Node

- installa `deploy/systemd/mantenimento-app.service` in `/etc/systemd/system/`
- esegui `systemctl daemon-reload`
- abilita il servizio con `systemctl enable --now mantenimento-app`
- verifica con `systemctl status mantenimento-app`

## Reverse proxy e TLS

- installa Nginx
- copia `deploy/nginx/mantenimento-app.conf` in `/etc/nginx/conf.d/`
- imposta `server_name` corretto
- configura certificati TLS validi
- verifica la sintassi con `nginx -t`
- ricarica Nginx con `systemctl reload nginx`

## Logging e retention

- abilita log minimizzati lato app solo se necessari operativamente
- installa `deploy/logrotate/mantenimento-app` in `/etc/logrotate.d/`
- verifica la rotazione con `logrotate -d /etc/logrotate.d/mantenimento-app`
- mantieni retention breve e accesso limitato ai log

## Verifiche finali

- `curl -I https://example.com/api/health`
- `curl -I https://example.com/`
- verifica redirect da `http://` a `https://`
- verifica header `Strict-Transport-Security` e `X-Request-Id`