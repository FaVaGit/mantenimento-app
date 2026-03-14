# Calcolatore Mantenimento Figli

Applicazione web standalone per il calcolo orientativo dell'assegno di mantenimento.

## Contenuto del repository
- `index.html`: applicazione completa, eseguibile direttamente nel browser
- `supabase-config.js`: configurazione client per autenticazione/profile cloud KeyLock
- `supabase/`: progetto Supabase locale/versionato nello stesso workspace
- `LICENSE`: licenza MIT

## Esecuzione locale
1. Apri `index.html` con un browser moderno.
2. Inserisci redditi, permanenze e spese dei due coniugi.
3. Il risultato si aggiorna in tempo reale.

## KeyLock multi-device
L'app usa Supabase per registrazione/login e per il profilo cloud cifrato dell'utente.

### Cosa e gia incluso nel workspace
- `supabase/config.toml`: configurazione progetto locale Supabase
- `supabase/migrations/202603140001_init_keylock_profiles.sql`: schema tabella e policy RLS
- `supabase-config.js`: file client da valorizzare con URL e anon key del progetto Supabase

### Avvio locale backend
Prerequisiti:
- Docker Desktop
- Supabase CLI

Comandi:

```powershell
supabase start
supabase db reset
supabase status
```

Poi copia `API URL` e `anon key` mostrati da `supabase status` dentro `supabase-config.js`.

### Deploy pubblico con GitHub Pages
GitHub Pages puo ospitare solo il frontend statico.
Per avere KeyLock multi-device funzionante sull'URL pubblico serve un progetto Supabase ospitato.

Passi minimi:
1. Crea un progetto Supabase.
2. In Supabase esegui la migration contenuta in `supabase/migrations/202603140001_init_keylock_profiles.sql`.
3. In `Authentication > Providers > Email` disattiva la conferma email.
4. Inserisci URL progetto e anon key pubblica in `supabase-config.js`.
5. Pubblica normalmente `index.html` su GitHub Pages.

## Funzioni principali
- Modalita `Legale-proporzionale`
- Modalita `Semplificata: differenza netti x %`
- Registrazione/login KeyLock multi-device con profilo cloud cifrato
- Salvataggio locale dei dati iniziali nel browser
- Export e import JSON
- Export PDF tramite stampa del browser
- Interfaccia responsive per desktop e mobile

## Publish statica
L'app non richiede backend, build o dipendenze.
Può essere pubblicata direttamente su:
- GitHub Pages
- Netlify
- Vercel come sito statico
- qualunque web server statico

## Publish su GitHub Pages
1. Crea un nuovo repository vuoto su GitHub.
2. Apri un terminale nella cartella del progetto.
3. Esegui:

```powershell
git init --initial-branch=main
git add .
git commit -m "Initial publish"
git remote add origin https://github.com/<utente>/<repo>.git
git push -u origin main
```

4. Su GitHub vai in `Settings > Pages`.
5. In `Build and deployment`, seleziona `Deploy from a branch`.
6. Scegli branch `main` e cartella `/ (root)`.
7. L'app sarà pubblicata all'URL:

```text
https://<utente>.github.io/<repo>/
```

## Note
- Strumento orientativo, non sostituisce una valutazione legale o professionale.
- Il profilo cloud KeyLock e cifrato lato client prima del salvataggio su Supabase.
- I dati restano nel browser dell'utilizzatore, salvo export esplicito in JSON o salvataggio cloud del profilo.
