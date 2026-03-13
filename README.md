# Calcolatore Mantenimento Figli

Applicazione web standalone per il calcolo orientativo dell'assegno di mantenimento.

## Contenuto del repository
- `index.html`: applicazione completa, eseguibile direttamente nel browser
- `LICENSE`: licenza MIT

## Esecuzione locale
1. Apri `index.html` con un browser moderno.
2. Inserisci redditi, permanenze e spese dei due coniugi.
3. Il risultato si aggiorna in tempo reale.

## Funzioni principali
- Modalita `Legale-proporzionale`
- Modalita `Semplificata: differenza netti x %`
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
- I dati restano nel browser dell'utilizzatore, salvo export esplicito in JSON.
