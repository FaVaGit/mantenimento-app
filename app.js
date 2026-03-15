const defaultExpenseItems = [
      { label: "Affitto", help: "Canone mensile di locazione dell'abitazione." },
      { label: "Mutuo casa", help: "Rata mensile del mutuo abitazione." },
      { label: "Casa (valore locativo)", help: "Valore locativo teorico della casa in uso, se rilevante." },
      { label: "Utenze", help: "Luce, gas, acqua, internet e altre utenze domestiche." },
      { label: "Cibo/Alimenti", help: "Spesa alimentare mensile imputabile al nucleo familiare." },
      { label: "Abbigliamento", help: "Spese medie mensili per abbigliamento dei figli." },
      { label: "Finanziamenti in corso (extra mutuo)", help: "Rate mensili di finanziamenti diversi dal mutuo." },
      { label: "Spese macchina", help: "Carburante, assicurazione, bollo, manutenzione ordinaria." },
      { label: "Amministrazione condominio", help: "Quote condominiali ordinarie e costi amministrativi ricorrenti." },
      { label: "Spese scolastiche/mensa", help: "Costi scolastici ricorrenti, mensa e contributi periodici." },
      { label: "Spese sanitarie ricorrenti", help: "Farmaci, visite periodiche e terapie ricorrenti." },
      { label: "Sport/attivita figli", help: "Costi medi mensili per sport e attivita extrascolastiche." }
    ];
    const suggestedExpenseCatalog = [
      { label: "Trasporto scolastico", help: "Abbonamenti bus/treno, navetta scolastica o carburante dedicato ai trasferimenti scuola." },
      { label: "Libri e materiale didattico", help: "Testi scolastici, quaderni, cancelleria e materiali ricorrenti per lo studio." },
      { label: "Doposcuola / ripetizioni", help: "Supporto didattico continuativo o corsi di recupero con cadenza periodica." },
      { label: "Centro estivo", help: "Quota media mensile stimata per centri estivi e attivita educative stagionali." },
      { label: "Spese mediche non coperte SSN", help: "Visite specialistiche, terapie e farmaci ricorrenti non totalmente rimborsati." },
      { label: "Attivita artistiche/musicali", help: "Corsi ricorrenti (musica, teatro, danza) e quote di frequenza periodiche." },
      { label: "Tecnologia per studio", help: "Canone internet, software didattici e strumenti digitali con costo ricorrente." },
      { label: "Abbigliamento stagionale figli", help: "Spesa periodica media per rinnovo abbigliamento in relazione alla stagione." }
    ];
    let expenseItems = defaultExpenseItems.map((item) => ({ ...item }));
    let scenarioLab = [];
    let selectedScenarioIdx = -1;
    let scenarioTransitionTimer = null;
    const SCENARIO_LAB_MAX = 3;
    const SCENARIO_LABELS = ["A", "B", "C"];

    const QUOTA_MANTENIMENTO_PERC = 35;

    const rowsSpese = document.getElementById("rowsSpese");
    const KEYLOCK_PROFILE_TABLE = "keylock_profiles";
    const CLOUD_PROFILE_FORMAT = "keylock-cloud-profile-v2";
    const CLOUD_HISTORY_MAX = 24;
    const UI_ZOOM_KEY = "keylock_ui_zoom";
    const UI_LANG_KEY = "keylock_ui_lang";
    const UI_CURRENCY_KEY = "keylock_ui_currency";
    const UI_ZOOM_MIN = 0.9;
    const UI_ZOOM_MAX = 1.5;
    const UI_ZOOM_STEP = 0.1;
    const SUPPORTED_LANGS = ["it", "en"];
    const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "CHF"];
    const CURRENCY_RATES = { EUR: 1, USD: 1.09, GBP: 0.86, CHF: 0.96 };
    const VISITOR_COUNTER_NS = "mantenimento-app-favagit";
    const VISITOR_COUNTER_KEY = "visits-total";
    const VISITOR_SESSION_FLAG = "keylock_visitor_counted";
    const VISITOR_PRESENCE_CHANNEL = "mantenimento-live-visitors";
    const VISITOR_ID_KEY = "keylock_visitor_id";
    const I18N = {
      it: {
        title: "Calcolatore Mantenimento Figli",
        heroTitle: "Calcolatore Assegno di Mantenimento",
        heroSubtitle: "Modello di calcolo orientativo adattato a <strong>reddito netto mensile/annuale</strong> oppure a <strong>CU (lordo annuale con stima del netto)</strong>, con inserimento spese separato per <strong>Coniuge 1</strong> e <strong>Coniuge 2</strong>.",
        quickActions: "Azioni rapide",
        btnReset: "Reset valori",
        btnExport: "Esporta JSON cifrato",
        btnImport: "Carica JSON cifrato",
        btnPdf: "Genera e scarica PDF",
        btnZoomReset: "Reset",
        btnZoomOutTitle: "Riduci zoom",
        btnZoomInTitle: "Aumenta zoom",
        btnZoomResetTitle: "Ripristina zoom",
        lang: "Lingua",
        currency: "Valuta",
        inputsTitle: "Risultati simulazione",
        resultsTitle: "Risultati",
        howCalc: "Come viene calcolato",
        orientative: "Questo strumento e solo orientativo e non sostituisce una valutazione legale/professionale del caso concreto.",
        authLogin: "Login",
        authHead: "KeyLock Cloud",
        authModeLogin: "Login",
        authModeSignup: "Signup",
        authEmailLabelSignup: "Email di registrazione",
        authVerifyCodeLabel: "Codice verifica email",
        authLoginBtn: "Login",
        authSignupBtn: "Registrati",
        authVerifyCodeBtn: "Verifica codice",
        calcProfileLabel: "Profilo calcolo",
        calcProfileHint: "Selezione unica che combina riferimento normativo/territoriale e motore di calcolo.",
        calcProfileNational: "Italia nazionale - Legale proporzionale (v2026.1)",
        calcProfileGenova: "Italia - Genova guideline (v2026.1)",
        modeGuidelinePrefix: "Riferimento modalita selezionata:",
        modeGuidelineLink: "Linee guida del Tribunale di Genova (PDF)",
        redditoAnnuale: "Reddito annuale netto",
        redditoMensile: "Reddito mensile netto",
        redditoCu: "Reddito lordo annuale CU (Certif. Unica)",
        incomeHintCu: "Reddito lordo annuale da Certificazione Unica di {spouse}: il sistema stima il netto mensile deducendo IRPEF, INPS dipendente e addizionali (stima orientativa).",
        pdfIncomeCuBase: "CU – Lordo annuale (netto stimato)",
        pdfCuMonthlyConv: "Netto mensile stimato da CU (÷IRPEF/INPS)",
        cuNetNoteText: "il netto mensile è stimato dal lordo CU applicando aliquote IRPEF 2025, contributi INPS dipendente (9,19%) e addizionali medie (1,73%). Stima orientativa, non sostitutiva di calcolo professionale.",
        coffeeHero: "Offrimi un caffè",
        authUserPrefix: "Utente",
        authNotAuthenticated: "Non autenticato.",
        authHistoryNone: "Nessuna versione storica disponibile al momento.",
        authHistoryVersion: "Versione",
        authDateUnavailable: "Data non disponibile",
        authRestore: "Ripristina",
        authDeleteVersion: "Elimina",
        authDeleteVersionConfirm: "Eliminare definitivamente questa versione dallo storico cloud?",
        authHistoryDeleteDone: "Versione storica rimossa dal cloud.",
        authHistoryDeleteFailed: "Impossibile eliminare la versione storica: {message}",
        authRateLimitActive: "Rate limit Supabase attivo. Attendi {seconds}s prima di riprovare Login/Registrati.",
        authNeedValidUserOrEmail: "Inserisci un utente valido o una email valida.",
        authRateLimitRetry: "Rate limit Supabase. Attendi {seconds}s e riprova.",
        authLoginAs: "Login effettuato come {username}.",
        authUnsupportedBrowser: "KeyLock non supportato da questo browser.",
        authConfigureSupabase: "Configura Supabase in supabase-config.js prima di {actionLabel}.",
        authOperationInProgress: "Operazione auth gia in corso, attendi qualche secondo.",
        authInvalidUsernameLong: "Nome utente non valido: usa 3-40 caratteri tra lettere minuscole, numeri, punto, trattino o underscore.",
        authInvalidEmail: "Email non valida: inserisci un indirizzo corretto.",
        authShortPassword: "Password troppo corta: minimo 6 caratteri.",
        authRegisterRateLimit: "Rate limit Supabase su Registrati. Attendi {seconds}s e riprova.",
        authRegisterFailed: "Registrazione fallita: {message}",
        authRegisterVerifyEmail: "Registrazione avviata. Abbiamo inviato una email di verifica a {email}. Conferma la email e poi effettua il login.",
        authRegisterLoginRateLimit: "Rate limit Supabase su registrazione/login. Se l'utente esiste, attendi 1-2 minuti e riprova Login. Se e nuovo, attendi e riprova Registrati.",
        authRegisterIncomplete: "Registrazione non completata o credenziali non corrette. Riprova Login.",
        authRegisterNoAutoLogin: "Registrazione eseguita ma login non completato. In Supabase disattiva la conferma email per usare KeyLock con solo utente/password.",
        authRegisterRateLimitedLoggedIn: "Rate limit registrazione rilevato, ma accesso effettuato: {loginMsg}",
        authRegisteredAndLogged: "Utente {username} registrato e login effettuato.",
        authNeedSignupVerification: "Completa prima la registrazione in modalita Signup.",
        authNeedVerificationCode: "Inserisci il codice di verifica ricevuto via email.",
        authVerifyCodeFailed: "Verifica codice fallita: {message}",
        authVerifyCodeSuccess: "Email verificata. Account attivato come {username}.",
        authInvalidUsername: "Nome utente non valido.",
        authNeedUserOrEmail: "Inserisci utente oppure email per il login.",
        authLoginRateLimit: "Troppi tentativi ravvicinati. Attendi 1-2 minuti e riprova il Login.",
        authEmailNotVerified: "Email non verificata. Apri la mail di conferma e completa la verifica, poi riprova il login.",
        authInvalidCredentials: "Login fallito: credenziali non valide o utente non presente nel nuovo cloud. Usa Registrati solo se l'utente non e mai stato creato su Supabase.",
        authLoginFailed: "Login fallito: {message}",
        authUserFallback: "utente",
        authLogoutDone: "Logout eseguito.",
        authLoginRequired: "Effettua prima il login.",
        authSaveFailed: "Salvataggio profilo fallito: {message}",
        authCloudSaved: "Profilo cloud salvato. Versioni storiche: {count}.",
        authLoadFailed: "Caricamento profilo fallito: {message}",
        authNoCloudProfile: "Nessun profilo cloud salvato per questo utente.",
        authLoadedFromLogin: "Login effettuato e ultimo profilo cloud caricato. Versioni storiche: {count}.",
        authLoaded: "Profilo cloud caricato. Versioni storiche: {count}.",
        authDecryptFailed: "Impossibile decifrare il profilo: credenziali errate o formato profilo non compatibile.",
        authHistoryRestored: "Versione storica ripristinata nel form. Salva profilo cloud per renderla corrente.",
        pdfReportTitle: "Report Mantenimento",
        pdfAppTitle: "Calcolo Mantenimento Figli",
        pdfAppSubtitle: "Stima indicativa a supporto della negoziazione assistita",
        pdfGeneratedOn: "Generato il",
        pdfBannerLbl: "Assegno mensile suggerito dal modello",
        pdfPerMonth: "/ mese",
        pdfPerMonthShort: "{currency}/mese",
        pdfPerChild: "per figlio",
        pdfNoSupport: "✓ Nessun assegno di mantenimento necessario",
        pdfLiveTitle: "Impatto in Tempo Reale sul Netto",
        pdfNetAvailable: "Netto disponibile",
        pdfParity: "Parità",
        pdfNetAdvantage: "Vantaggio netto",
        pdfDelta: "Delta",
        pdfSuggestedSupport: "Assegno suggerito",
        pdfInputSection: "Parametri di Input",
        pdfGeneralSettings: "Impostazioni Generali",
        pdfCalcMode: "Modalità di calcolo",
        pdfNormProfile: "Profilo normativo",
        pdfCalcProfile: "Profilo di calcolo",
        pdfIncomeBase: "Base reddito",
        pdfIncomeAnnualBase: "Annuale (÷12 per mensile)",
        pdfIncomeMonthlyBase: "Mensile",
        pdfChildrenCount: "Numero figli",
        pdfPermanence: "Permanenza",
        pdfItem: "Voce",
        pdfNetIncome: "Reddito netto",
        pdfYearlySuffix: " annuo",
        pdfMonthlySuffix: " mensile",
        pdfMonthlyConv: "Reddito netto mensile (÷12)",
        pdfSupportReceived: "Assegno percepito",
        pdfSupportPaid: "Assegno pagato",
        pdfDirectExpenses: "Spese dirette",
        pdfFamilyBenefits: "Assegni familiari / INPS",
        pdfExpenseSection: "Voci di Spesa",
        pdfExpenseItem: "Voce",
        pdfTotalMonthly: "Totale {currency}/mese",
        pdfTotal: "TOTALE",
        pdfComparison: "Analisi Economica Comparativa",
        pdfWeight: "Peso contributivo",
        pdfPostSupport: "Disponibilità post-assegno",
        pdfKpiSection: "Indicatori Chiave",
        pdfTotalExpenses: "Totale spese",
        pdfEstimatedChildrenNeeds: "Fabbisogno figli stimato",
        pdfAmountPerChild: "Importo per figlio",
        pdfTheoreticalShare: "Quota teorica",
        pdfDirectShareC1C2: "Quota diretta C1 / C2",
        pdfScenarioSection: "Scenario Lab",
        pdfNegotiationSection: "Report negoziale avanzato",
        pdfNegotiationOption: "Opzione",
        pdfNegotiationAmount: "Assegno",
        pdfNegotiationPayerPost: "Post-assegno pagante ({spouse})",
        pdfNegotiationReceiverPost: "Post-assegno beneficiario ({spouse})",
        pdfNegotiationLow: "Conservativa (-10%)",
        pdfNegotiationTarget: "Target modello",
        pdfNegotiationHigh: "Espansiva (+10%)",
        pdfNegotiationNoTransfer: "Nessun assegno: scenario neutro",
        pdfScenarioName: "Scenario",
        pdfScenarioBaseline: "Base",
        pdfScenarioDelta: "Delta vs base",
        pdfFooter: "Calcolatore Mantenimento Figli — Uso privato e riservato — {date}",
        pdfNoTransfer: "Nessun trasferimento",
        pdfMethodology: "Note metodologiche",
        pdfMethodologyText: "Documento generato automaticamente con finalità illustrativa e non costituisce parere legale.",
        pdfModeText: "Modalità di calcolo",
        pdfNeedEstimate: "Il fabbisogno figli è stimato come il 35% delle spese totali inserite.",
        pdfAnnualNote: "I redditi inseriti in base annuale sono stati convertiti in mensili (÷12).",
        pdfResultsDepend: "I risultati dipendono esclusivamente dai dati immessi e non sostituiscono la valutazione di un professionista.",
        pdfPopupBlocked: "Il popup è stato bloccato dal browser. Consenti i popup per questo sito e riprova.",
        authLoginBeforeExportStatus: "Effettua il login KeyLock prima di esportare JSON cifrato.",
        authLoginBeforeExportAlert: "Per esportare, devi prima fare login KeyLock.",
        authInvalidJsonFormat: "Formato JSON non valido: e richiesto un export cifrato KeyLock",
        authLoginBeforeImport: "Effettua prima il login KeyLock per importare il file cifrato",
        authFileOwnedByOther: "Questo file appartiene a un altro utente KeyLock",
        authDecryptedContentInvalid: "Contenuto decifrato non valido",
        authEncryptedJsonImported: "JSON cifrato importato correttamente.",
        authEncryptedJsonLoaded: "Dati caricati da JSON cifrato.",
        authImportFailedStatus: "Import JSON fallito: {message}",
        authImportFailedAlert: "Impossibile caricare il JSON: {message}",
        spouse1Default: "Coniuge 1",
        spouse2Default: "Coniuge 2",
        expenseCountNote: "Elenco spese compilabili: {count} voci.",
        expensePartialLabel: "Tot",
        expensePartialTitle: "Somma parziale progressiva",
        expenseDetailBtn: "Dettaglio",
        expenseDetailTitle: "Apri dettaglio voce spesa",
        expenseDetailPlaceholder: "Scrivi qui il dettaglio di questa cifra (es. mesi, quota, riferimento).",
        expenseRemoveTitle: "Rimuovi voce spesa",
        expenseRemoveBtn: "Rimuovi",
        expenseMinOneAlert: "Deve restare almeno una voce spesa.",
        simplePercTitleEnabled: "Percentuale usata nella formula semplificata.",
        simplePercTitleDisabled: "Campo inattivo: viene usato solo nella modalita semplificata.",
        incomeHintAnnual: "Entrate nette annuali di {spouse}: il sistema converte automaticamente in quota mensile (/12).",
        incomeHintMonthly: "Entrate nette mensili disponibili di {spouse}.",
        liveNetAvailablePerson: "Netto disponibile {spouse}",
        liveNetPostSupportPerson: "Netto post-assegno {spouse}",
        liveDaysWithSpouse: "{days} gg con {spouse}",
        langDaysSuffix: "gg",
        permCalendarTitle: "Calendario permanenza reale",
        permCalendarNote: "Assegna ogni giorno al coniuge con cui il minore pernotta: la percentuale si aggiorna automaticamente.",
        permCalendarMonthLabel: "Mese",
        permCalendarResetBtn: "Reset mese",
        permCalendarLegendC1: "Coniuge 1",
        permCalendarLegendC2: "Coniuge 2",
        permCalendarSummary: "{month}: {d1} {daysSuffix} con {spouse1} ({p1}%) · {d2} {daysSuffix} con {spouse2} ({p2}%)",
        permCalendarUnknownMonth: "mese selezionato",
        extraBoxTitle: "Spese straordinarie (base)",
        extraBoxNote: "Inserisci i costi straordinari annuali stimati: il sistema li converte in quota mensile da includere nel modello.",
        extraAnnLabel1: "Straordinarie annue {spouse} ({currency}/anno)",
        extraAnnLabel2: "Straordinarie annue {spouse} ({currency}/anno)",
        extraAnnHint1: "Quota annuale straordinaria stimata a carico di {spouse} (es. sanitarie non ricorrenti, scolastiche extra, attività non ordinarie).",
        extraAnnHint2: "Quota annuale straordinaria stimata a carico di {spouse} (es. sanitarie non ricorrenti, scolastiche extra, attività non ordinarie).",
        extraMonthlyEstimate: "Quota mensile stimata: {amount}",
        pdfExtraordinaryRow: "Spese straordinarie (quota mensile da annuo)",
        liveTotalIncome: "Entrate totali (reddito + assegni + INPS)",
        livePaidToOther: "Assegno mantenimento pagato all'altro coniuge",
        livePaidExternal: "Assegno mantenimento pagato esterno",
        liveTotalExpensesEntered: "Totale spese inserite",
        liveTotalOutflows: "Uscite totali",
        liveEquivalentNets: "Netti equivalenti",
        liveNetAdvantageSpouse: "Vantaggio netto: {spouse}",
        calcModeLegalName: "Legale-proporzionale",
        calcModeSimpleName: "Semplificata ({perc}%)",
        calcModeGenovaName: "Linee guida Tribunale di Genova",
        calcSimpleRuleTitle: "Regola specifica modalita semplificata",
        calcSimpleRule1: "1) Differenza netti = |Disponibilita C1 - Disponibilita C2| = {value}.",
        calcSimpleRule2: "2) Assegno suggerito = differenza netti x {perc}%.",
        calcSimpleRule3: "3) Paga il coniuge con disponibilita netta maggiore.",
        calcGenovaRuleTitle: "Regola specifica linee guida Genova",
        calcGenovaRule1: "1) Collocatario stimato: Coniuge {coll} (maggiore permanenza).",
        calcGenovaRule2: "2) Non collocatario: Coniuge {nonColl}.",
        calcGenovaRule3: "3) Costo giornaliero medio figli = fabbisogno figli / 30 = {value}.",
        calcGenovaRule4: "4) Quota diretta non collocatario = costo giornaliero x giorni di permanenza presso non collocatario.",
        calcGenovaRule5: "5) Assegno suggerito = max(0, quota teorica non collocatario - quota diretta non collocatario).",
        calcLegalRuleTitle: "Regola specifica modalita legale-proporzionale",
        calcLegalRule1: "1) Quota teorica = fabbisogno figli x peso contributivo del coniuge.",
        calcLegalRule2: "2) Quota diretta = fabbisogno figli x permanenza presso quel coniuge.",
        calcLegalRule3: "3) Saldo = quota teorica - quota diretta.",
        calcLegalRule4: "4) L'assegno e il saldo positivo del coniuge debitore verso l'altro.",
        calcGeneralTitle: "Impostazione generale del calcolo",
        calcActiveMode: "Modalita attiva",
        calcGeneral1: "Disponibilita netta C1 = reddito netto C1 + assegni percepiti C1 + assegni familiari C1 - assegni pagati C1 - spese C1.",
        calcGeneral2: "Disponibilita netta C2 = reddito netto C2 + assegni percepiti C2 + assegni familiari C2 - assegni pagati C2 - spese C2.",
        calcGeneral3: "Peso contributivo = disponibilita positiva del coniuge / somma disponibilita positive.",
        calcGeneral4: "Fabbisogno figli stimato = totale spese inserite x 35%.",
        calcInputMeaningTitle: "Significato delle principali voci richieste in input",
        calcInput1: "- Reddito: inserisci reddito netto mensile, netto annuale o lordo annuale CU (con conversione orientativa a netto mensile).",
        calcInput2: "- Assegno percepito: importo ricevuto mensilmente dal coniuge.",
        calcInput3: "- Assegno pagato: importo versato mensilmente dal coniuge.",
        calcInput4: "- Assegni familiari/INPS: componenti assistenziali percepite.",
        calcInput5: "- Permanenza figli (%): ripartizione dei giorni medi mensili tra i due coniugi.",
        calcInput6: "- Spese per voce: costi mensili attribuiti a ciascun coniuge.",
        calcKpiReadTitle: "Lettura dei risultati e KPI",
        calcKpi1: "- Netto disponibile: situazione prima del nuovo assegno calcolato dal modello.",
        calcKpi2: "- Totale spese inserite: somma C1 + C2 delle voci compilate.",
        calcKpi3: "- Quota teorica: quota di fabbisogno figli attribuita in base al peso economico.",
        calcKpi4: "- Post-assegno: netto disponibile dopo applicazione dell'assegno suggerito.",
        calcKpi5: "- Importo per figlio: assegno mensile suggerito diviso per numero figli.",
        calcKpi6: "- Assegno pagato esterno: quota pagata non compensata da assegni percepiti dell'altro coniuge (non accreditata all'altro).",
        calcIncomeBaseNote: "Nota base reddito:",
        calcIncomeBaseNoteText: "base Annuale: i redditi netti annuali sono convertiti in mensili (/12). Base CU: dal lordo annuale viene stimato il netto mensile con IRPEF/INPS/addizionali (stima orientativa).",
        calcNoTransferSuggested: "Nessun trasferimento suggerito",
        kpiActiveMode: "Modalita attiva",
        kpiIncomeBase: "Base reddito",
        kpiIncomeBaseAnnual: "Annuale (convertito in mensile)",
        kpiIncomeBaseMonthly: "Mensile",
        kpiIncomeBaseCu: "CU lordo annuale (netto stimato)",
        kpiCuNetGrossRatioSpouse: "Rapporto netto/lordo CU {spouse}",
        scenarioLabTitle: "Scenario Lab",
        scenarioLabSaveBtn: "Salva scenario corrente",
        scenarioLabClearBtn: "Azzera scenari",
        scenarioLabEmpty: "Nessuno scenario salvato. Configura i parametri e clicca \u00abSalva scenario corrente\u00bb.",
        scenarioLabMaxReached: "Massimo 3 scenari salvabili. Rimuovi uno scenario per salvarne un altro.",
        scenarioLabSelectBtn: "Seleziona",
        scenarioLabSelectedBtn: "Selezionato",
        scenarioLabSelectedFlag: "Scenario selezionato",
        scenarioLabRemoveBtn: "Rimuovi",
        scenarioColMetric: "Metrica",
        scenarioColMode: "Modalit\u00e0",
        scenarioColAssegno: "Assegno",
        scenarioColDisp1: "Netto C1",
        scenarioColDisp2: "Netto C2",
        scenarioColPost1: "Post-ass. C1",
        scenarioColPost2: "Post-ass. C2",
        scenarioColFabb: "Fabbis. figli",
        scenarioDeltaLabel: "\u0394 vs A",
        spiegTitle: "Perch\u00e9 questo risultato?",
        spiegRedditiLabel: "Redditi (peso contributivo)",
        spiegSpeseLabel: "Spese \u2192 fabbisogno figli",
        spiegPermLabel: "Permanenza \u2192 quota diretta",
        spiegResultLabel: "Come si forma l'assegno",
        spiegTooltipTrigger: "Dettaglio calcolo",
        spiegDetailIncome: "Si parte dal netto disponibile di ciascun coniuge. Il peso contributivo e dato da netto coniuge / somma dei netti positivi.",
        spiegDetailExpense: "Il fabbisogno figli viene stimato come 35% del totale spese inserite (ordinarie + eventuali straordinarie mensilizzate).",
        spiegDetailPerm: "La quota diretta dipende dai giorni di permanenza presso ciascun coniuge: quota diretta = fabbisogno x permanenza%.",
        spiegDetailResultTransfer: "L'assegno suggerito nasce dal saldo: quota teorica del pagante - quota diretta del pagante. Se il saldo e positivo, viene trasferito all'altro coniuge.",
        spiegDetailResultNoTransfer: "Se nessun saldo risulta positivo, il modello non suggerisce trasferimenti tra coniugi.",
        footerVisitorsTotal: "Visitatori totali",
        footerVisitorsActive: "Visitatori attivi",
        footerLoggedUsers: "Utenti loggati",
        footerCounterUnavailable: "n/d"
      },
      en: {
        title: "Child Support Calculator",
        heroTitle: "Child Support Estimate Calculator",
        heroSubtitle: "Indicative calculation model based on <strong>monthly/yearly net income</strong> or <strong>CU gross yearly income (estimated monthly net)</strong>, with separate expense input for <strong>Spouse 1</strong> and <strong>Spouse 2</strong>.",
        quickActions: "Quick actions",
        btnReset: "Reset values",
        btnExport: "Export encrypted JSON",
        btnImport: "Import encrypted JSON",
        btnPdf: "Generate and download PDF",
        btnZoomReset: "Reset",
        btnZoomOutTitle: "Zoom out",
        btnZoomInTitle: "Zoom in",
        btnZoomResetTitle: "Reset zoom",
        lang: "Language",
        currency: "Currency",
        inputsTitle: "Simulation Results",
        resultsTitle: "Results",
        howCalc: "How it is calculated",
        orientative: "This tool is indicative only and does not replace legal/professional assessment of the specific case.",
        authLogin: "KeyLock Login",
        authHead: "KeyLock Cloud",
        authModeLogin: "Login",
        authModeSignup: "Signup",
        authEmailLabelSignup: "Registration email",
        authVerifyCodeLabel: "Email verification code",
        authLoginBtn: "Login",
        authSignupBtn: "Sign up",
        authVerifyCodeBtn: "Verify code",
        calcProfileLabel: "Calculation profile",
        calcProfileHint: "Single selection combining normative/territorial reference and calculation engine.",
        calcProfileNational: "Italy national - Legal proportional (v2026.1)",
        calcProfileGenova: "Italy - Genoa guideline (v2026.1)",
        modeGuidelinePrefix: "Selected mode reference:",
        modeGuidelineLink: "Genoa Court guidelines (PDF)",
        redditoAnnuale: "Annual net income",
        redditoMensile: "Monthly net income",
        redditoCu: "Gross annual income – CU (tax certificate)",
        incomeHintCu: "Gross annual income from {spouse}'s CU (Certificazione Unica): the system estimates monthly net by deducting IRPEF, employee INPS (9.19%) and average regional taxes (indicative estimate).",
        pdfIncomeCuBase: "CU – Gross yearly (estimated net)",
        pdfCuMonthlyConv: "Estimated monthly net from CU (÷IRPEF/INPS)",
        cuNetNoteText: "monthly net is estimated from CU gross income applying 2025 IRPEF brackets, employee INPS contributions (9.19%) and average regional/municipal taxes (1.73%). Indicative estimate only.",
        coffeeHero: "Buy me a coffee",
        authUserPrefix: "User",
        authNotAuthenticated: "Not authenticated.",
        authHistoryNone: "No cloud history version available right now.",
        authHistoryVersion: "Version",
        authDateUnavailable: "Date unavailable",
        authRestore: "Restore",
        authDeleteVersion: "Delete",
        authDeleteVersionConfirm: "Permanently delete this version from cloud history?",
        authHistoryDeleteDone: "History version removed from cloud.",
        authHistoryDeleteFailed: "Cannot delete history version: {message}",
        authRateLimitActive: "Supabase rate limit active. Wait {seconds}s before trying Login/Register again.",
        authNeedValidUserOrEmail: "Enter a valid username or email.",
        authRateLimitRetry: "Supabase rate limit. Wait {seconds}s and retry.",
        authLoginAs: "Logged in as {username}.",
        authUnsupportedBrowser: "KeyLock is not supported by this browser.",
        authConfigureSupabase: "Configure Supabase in supabase-config.js before {actionLabel}.",
        authOperationInProgress: "Authentication operation already in progress, wait a few seconds.",
        authInvalidUsernameLong: "Invalid username: use 3-40 chars with lowercase letters, numbers, dot, dash or underscore.",
        authInvalidEmail: "Invalid email: enter a valid email address.",
        authShortPassword: "Password too short: minimum 6 characters.",
        authRegisterRateLimit: "Supabase rate limit on registration. Wait {seconds}s and retry.",
        authRegisterFailed: "Registration failed: {message}",
        authRegisterVerifyEmail: "Registration started. We sent a verification email to {email}. Confirm it, then log in.",
        authRegisterLoginRateLimit: "Supabase rate limit on registration/login. If the user exists, wait 1-2 minutes and retry Login. If new, wait and retry Register.",
        authRegisterIncomplete: "Registration not completed or invalid credentials. Retry Login.",
        authRegisterNoAutoLogin: "Registration completed but login not completed. Keep email confirmation enabled in Supabase and verify your email.",
        authRegisterRateLimitedLoggedIn: "Registration rate limit detected, but access completed: {loginMsg}",
        authRegisteredAndLogged: "User {username} registered and logged in.",
        authNeedSignupVerification: "Complete signup mode registration first.",
        authNeedVerificationCode: "Enter the verification code received by email.",
        authVerifyCodeFailed: "Code verification failed: {message}",
        authVerifyCodeSuccess: "Email verified. Account activated as {username}.",
        authInvalidUsername: "Invalid username.",
        authNeedUserOrEmail: "Enter username or email for login.",
        authLoginRateLimit: "Too many attempts. Wait 1-2 minutes and retry Login.",
        authEmailNotVerified: "Email not verified. Open your confirmation email and complete verification, then retry login.",
        authInvalidCredentials: "Login failed: invalid credentials or user not found in this cloud. Use Register only if the user was never created in Supabase.",
        authLoginFailed: "Login failed: {message}",
        authUserFallback: "user",
        authLogoutDone: "Logout completed.",
        authLoginRequired: "Please login first.",
        authSaveFailed: "Cloud profile save failed: {message}",
        authCloudSaved: "Cloud profile saved. History versions: {count}.",
        authLoadFailed: "Cloud profile load failed: {message}",
        authNoCloudProfile: "No cloud profile saved for this user.",
        authLoadedFromLogin: "Login completed and latest cloud profile loaded. History versions: {count}.",
        authLoaded: "Cloud profile loaded. History versions: {count}.",
        authDecryptFailed: "Cannot decrypt profile: wrong credentials or unsupported profile format.",
        authHistoryRestored: "History version restored into the form. Save cloud profile to make it current.",
        pdfReportTitle: "Support Report",
        pdfAppTitle: "Child Support Calculation",
        pdfAppSubtitle: "Indicative estimate to support assisted negotiation",
        pdfGeneratedOn: "Generated on",
        pdfBannerLbl: "Model suggested monthly support",
        pdfPerMonth: "/ month",
        pdfPerMonthShort: "{currency}/month",
        pdfPerChild: "per child",
        pdfNoSupport: "✓ No child support payment required",
        pdfLiveTitle: "Real-time Net Impact",
        pdfNetAvailable: "Net available",
        pdfParity: "Parity",
        pdfNetAdvantage: "Net advantage",
        pdfDelta: "Delta",
        pdfSuggestedSupport: "Suggested support",
        pdfInputSection: "Input Parameters",
        pdfGeneralSettings: "General Settings",
        pdfCalcMode: "Calculation mode",
        pdfNormProfile: "Normative profile",
        pdfCalcProfile: "Calculation profile",
        pdfIncomeBase: "Income base",
        pdfIncomeAnnualBase: "Yearly (÷12 to monthly)",
        pdfIncomeMonthlyBase: "Monthly",
        pdfChildrenCount: "Children count",
        pdfPermanence: "Permanence",
        pdfItem: "Item",
        pdfNetIncome: "Net income",
        pdfYearlySuffix: " yearly",
        pdfMonthlySuffix: " monthly",
        pdfMonthlyConv: "Monthly net income (÷12)",
        pdfSupportReceived: "Support received",
        pdfSupportPaid: "Support paid",
        pdfDirectExpenses: "Direct expenses",
        pdfFamilyBenefits: "Family benefits / INPS",
        pdfExpenseSection: "Expense Items",
        pdfExpenseItem: "Item",
        pdfTotalMonthly: "Total {currency}/month",
        pdfTotal: "TOTAL",
        pdfComparison: "Comparative Economic Analysis",
        pdfWeight: "Contribution weight",
        pdfPostSupport: "Post-support availability",
        pdfKpiSection: "Key Indicators",
        pdfTotalExpenses: "Total expenses",
        pdfEstimatedChildrenNeeds: "Estimated children needs",
        pdfAmountPerChild: "Amount per child",
        pdfTheoreticalShare: "Theoretical share",
        pdfDirectShareC1C2: "Direct share C1 / C2",
        pdfScenarioSection: "Scenario Lab",
        pdfNegotiationSection: "Advanced negotiation report",
        pdfNegotiationOption: "Option",
        pdfNegotiationAmount: "Support",
        pdfNegotiationPayerPost: "Payer post-support ({spouse})",
        pdfNegotiationReceiverPost: "Receiver post-support ({spouse})",
        pdfNegotiationLow: "Conservative (-10%)",
        pdfNegotiationTarget: "Model target",
        pdfNegotiationHigh: "Expansion (+10%)",
        pdfNegotiationNoTransfer: "No support: neutral scenario",
        pdfScenarioName: "Scenario",
        pdfScenarioBaseline: "Baseline",
        pdfScenarioDelta: "Delta vs baseline",
        pdfFooter: "Child Support Calculator — Private and reserved use — {date}",
        pdfNoTransfer: "No transfer",
        pdfMethodology: "Methodological notes",
        pdfMethodologyText: "This document is automatically generated for illustrative purposes and does not constitute legal advice.",
        pdfModeText: "Calculation mode",
        pdfNeedEstimate: "Children needs are estimated as 35% of total entered expenses.",
        pdfAnnualNote: "Yearly incomes have been converted to monthly (÷12).",
        pdfResultsDepend: "Results depend solely on the entered data and do not replace professional evaluation.",
        pdfPopupBlocked: "The popup was blocked by the browser. Allow popups for this site and try again.",
        authLoginBeforeExportStatus: "Please login to KeyLock before exporting encrypted JSON.",
        authLoginBeforeExportAlert: "You must login to KeyLock before exporting.",
        authInvalidJsonFormat: "Invalid JSON format: an encrypted KeyLock export is required",
        authLoginBeforeImport: "Login to KeyLock before importing the encrypted file",
        authFileOwnedByOther: "This file belongs to another KeyLock user",
        authDecryptedContentInvalid: "Invalid decrypted content",
        authEncryptedJsonImported: "Encrypted JSON imported successfully.",
        authEncryptedJsonLoaded: "Data loaded from encrypted JSON.",
        authImportFailedStatus: "JSON import failed: {message}",
        authImportFailedAlert: "Unable to load JSON: {message}",
        spouse1Default: "Spouse 1",
        spouse2Default: "Spouse 2",
        expenseCountNote: "Editable expense items: {count} entries.",
        expensePartialLabel: "Tot",
        expensePartialTitle: "Progressive partial sum",
        expenseDetailBtn: "Detail",
        expenseDetailTitle: "Open expense detail",
        expenseDetailPlaceholder: "Write details for this amount (e.g. months, share, reference).",
        expenseRemoveTitle: "Remove expense item",
        expenseRemoveBtn: "Remove",
        expenseMinOneAlert: "At least one expense item must remain.",
        simplePercTitleEnabled: "Percentage used in the simplified formula.",
        simplePercTitleDisabled: "Inactive field: used only in simplified mode.",
        incomeHintAnnual: "Yearly net income for {spouse}: automatically converted to monthly amount (/12).",
        incomeHintMonthly: "Available monthly net income for {spouse}.",
        liveNetAvailablePerson: "Net available {spouse}",
        liveNetPostSupportPerson: "Post-support net {spouse}",
        liveDaysWithSpouse: "{days} days with {spouse}",
        langDaysSuffix: "d",
        permCalendarTitle: "Real permanence calendar",
        permCalendarNote: "Assign each day to the spouse where the child stays overnight: percentages update automatically.",
        permCalendarMonthLabel: "Month",
        permCalendarResetBtn: "Reset month",
        permCalendarLegendC1: "Spouse 1",
        permCalendarLegendC2: "Spouse 2",
        permCalendarSummary: "{month}: {d1} {daysSuffix} with {spouse1} ({p1}%) · {d2} {daysSuffix} with {spouse2} ({p2}%)",
        permCalendarUnknownMonth: "selected month",
        extraBoxTitle: "Extraordinary expenses (base)",
        extraBoxNote: "Enter estimated yearly extraordinary costs: the system converts them to a monthly share included in the model.",
        extraAnnLabel1: "Yearly extraordinary {spouse} ({currency}/year)",
        extraAnnLabel2: "Yearly extraordinary {spouse} ({currency}/year)",
        extraAnnHint1: "Estimated yearly extraordinary share for {spouse} (e.g., non-recurring medical, extra school, non-ordinary activities).",
        extraAnnHint2: "Estimated yearly extraordinary share for {spouse} (e.g., non-recurring medical, extra school, non-ordinary activities).",
        extraMonthlyEstimate: "Estimated monthly share: {amount}",
        pdfExtraordinaryRow: "Extraordinary expenses (monthly share from yearly)",
        liveTotalIncome: "Total income (income + support + INPS)",
        livePaidToOther: "Support paid to the other spouse",
        livePaidExternal: "External support paid",
        liveTotalExpensesEntered: "Total entered expenses",
        liveTotalOutflows: "Total outflows",
        liveEquivalentNets: "Equivalent nets",
        liveNetAdvantageSpouse: "Net advantage: {spouse}",
        calcModeLegalName: "Legal-proportional",
        calcModeSimpleName: "Simplified ({perc}%)",
        calcModeGenovaName: "Genoa Court guidelines",
        calcSimpleRuleTitle: "Specific simplified mode rule",
        calcSimpleRule1: "1) Net difference = |Availability C1 - Availability C2| = {value}.",
        calcSimpleRule2: "2) Suggested support = net difference x {perc}%.",
        calcSimpleRule3: "3) The spouse with higher net availability pays.",
        calcGenovaRuleTitle: "Specific Genoa guidelines rule",
        calcGenovaRule1: "1) Estimated custodial parent: Spouse {coll} (higher permanence).",
        calcGenovaRule2: "2) Non-custodial parent: Spouse {nonColl}.",
        calcGenovaRule3: "3) Average daily children cost = children needs / 30 = {value}.",
        calcGenovaRule4: "4) Non-custodial direct share = daily cost x days with non-custodial parent.",
        calcGenovaRule5: "5) Suggested support = max(0, non-custodial theoretical share - non-custodial direct share).",
        calcLegalRuleTitle: "Specific legal-proportional mode rule",
        calcLegalRule1: "1) Theoretical share = children needs x spouse contribution weight.",
        calcLegalRule2: "2) Direct share = children needs x permanence with that spouse.",
        calcLegalRule3: "3) Balance = theoretical share - direct share.",
        calcLegalRule4: "4) Support equals the positive balance of the debtor spouse toward the other.",
        calcGeneralTitle: "General calculation setup",
        calcActiveMode: "Active mode",
        calcGeneral1: "Net availability C1 = net income C1 + support received C1 + family benefits C1 - support paid C1 - expenses C1.",
        calcGeneral2: "Net availability C2 = net income C2 + support received C2 + family benefits C2 - support paid C2 - expenses C2.",
        calcGeneral3: "Contribution weight = spouse positive availability / sum of positive availabilities.",
        calcGeneral4: "Estimated children needs = total entered expenses x 35%.",
        calcInputMeaningTitle: "Meaning of the main required input fields",
        calcInput1: "- Income: enter monthly net, yearly net, or CU gross yearly income (with indicative conversion to monthly net).",
        calcInput2: "- Support received: monthly amount received by the spouse.",
        calcInput3: "- Support paid: monthly amount paid by the spouse.",
        calcInput4: "- Family benefits/INPS: received support components.",
        calcInput5: "- Children permanence (%): split of average monthly days between spouses.",
        calcInput6: "- Expense items: monthly costs assigned to each spouse.",
        calcKpiReadTitle: "How to read results and KPI",
        calcKpi1: "- Net available: status before the new support calculated by the model.",
        calcKpi2: "- Total entered expenses: sum C1 + C2 of completed items.",
        calcKpi3: "- Theoretical share: children needs quota assigned by economic weight.",
        calcKpi4: "- Post-support: net available after applying suggested support.",
        calcKpi5: "- Amount per child: suggested monthly support divided by number of children.",
        calcKpi6: "- External support paid: paid quota not offset by support received from the other spouse (not credited to the other).",
        calcIncomeBaseNote: "Income base note:",
        calcIncomeBaseNoteText: "Annual base: yearly net incomes are converted to monthly (/12). CU base: monthly net is estimated from gross yearly income using IRPEF/INPS/local taxes (indicative estimate).",
        calcNoTransferSuggested: "No suggested transfer",
        kpiActiveMode: "Active mode",
        kpiIncomeBase: "Income base",
        kpiIncomeBaseAnnual: "Yearly (converted to monthly)",
        kpiIncomeBaseMonthly: "Monthly",
        kpiIncomeBaseCu: "CU gross yearly (estimated net)",
        kpiCuNetGrossRatioSpouse: "CU net/gross ratio {spouse}",
        scenarioLabTitle: "Scenario Lab",
        scenarioLabSaveBtn: "Save current scenario",
        scenarioLabClearBtn: "Clear all scenarios",
        scenarioLabEmpty: "No scenario saved yet. Configure parameters and click \u00abSave current scenario\u00bb.",
        scenarioLabMaxReached: "Maximum 3 scenarios. Remove one to save another.",
        scenarioLabSelectBtn: "Select",
        scenarioLabSelectedBtn: "Selected",
        scenarioLabSelectedFlag: "Selected scenario",
        scenarioLabRemoveBtn: "Remove",
        scenarioColMetric: "Metric",
        scenarioColMode: "Mode",
        scenarioColAssegno: "Support",
        scenarioColDisp1: "Net C1",
        scenarioColDisp2: "Net C2",
        scenarioColPost1: "Post-supp. C1",
        scenarioColPost2: "Post-supp. C2",
        scenarioColFabb: "Children needs",
        scenarioDeltaLabel: "\u0394 vs A",
        spiegTitle: "Why this result?",
        spiegRedditiLabel: "Income (contribution weight)",
        spiegSpeseLabel: "Expenses \u2192 children needs",
        spiegPermLabel: "Permanence \u2192 direct share",
        spiegResultLabel: "How the support is formed",
        spiegTooltipTrigger: "Calculation details",
        spiegDetailIncome: "The model starts from each spouse's available net. Contribution weight is spouse net / sum of positive nets.",
        spiegDetailExpense: "Children needs are estimated as 35% of total entered expenses (regular + any extraordinary annual costs converted to monthly).",
        spiegDetailPerm: "Direct share depends on permanence days with each spouse: direct share = children needs x permanence%.",
        spiegDetailResultTransfer: "Suggested support comes from the balance: payer theoretical share - payer direct share. If the balance is positive, it is transferred to the other spouse.",
        spiegDetailResultNoTransfer: "If no balance is positive, the model suggests no transfer between spouses.",
        footerVisitorsTotal: "Total visitors",
        footerVisitorsActive: "Active visitors",
        footerLoggedUsers: "Logged users",
        footerCounterUnavailable: "n/a"
      }
    };
    const SUPABASE_URL = String(window.KEYLOCK_SUPABASE_URL || "").trim();
    const SUPABASE_ANON_KEY = String(window.KEYLOCK_SUPABASE_ANON_KEY || "").trim();
    const supabaseClient = window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
      && !SUPABASE_URL.includes("YOUR_PROJECT")
      && !SUPABASE_ANON_KEY.includes("YOUR_PUBLIC_ANON_KEY")
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          })
        : null;
    const authSession = {
      username: null,
      userId: null,
      keyBits: null
    };
    const authUiState = {
      mode: "login",
      pendingVerification: null
    };
    const cloudProfileSession = {
      loaded: null,
      history: []
    };
    const uiViewState = {
      spiegOpen: true,
      formulaOpen: false,
      permCalendarOpen: true,
      cloudHistoryOpen: false
    };
    let netDiffFabricCanvas = null;
    let authFlowInProgress = false;
    let authRateLimitedUntilTs = 0;
    const visitorStatsState = {
      total: null,
      active: null,
      logged: 0,
      sessionId: `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      visitorId: null,
      presenceChannel: null
    };
    let incomeModeLast = "monthly";
    const incomeValuesByMode = {
      monthly: null,
      annual: null,
      cu: null
    };
    const permanenceCalendarState = {
      month: "",
      byMonth: {}
    };
    let currentLang = "it";
    let currentCurrency = "EUR";
      const CALC_API_BASE_STORAGE_KEY = "keylock_calc_api_base";
      const FRONTEND_VARIANT_ENVS = window.KEYLOCK_FRONTEND_VARIANT_ENVS && typeof window.KEYLOCK_FRONTEND_VARIANT_ENVS === "object"
        ? window.KEYLOCK_FRONTEND_VARIANT_ENVS
        : {};
      const CALC_API_ENVS = window.KEYLOCK_CALC_API_ENVS && typeof window.KEYLOCK_CALC_API_ENVS === "object"
        ? window.KEYLOCK_CALC_API_ENVS
        : {};

      function normalizeApiBase(rawValue) {
        return String(rawValue || "").trim().replace(/\/+$/, "");
      }

      function normalizeFrontendVariantUrl(rawValue) {
        return String(rawValue || "").trim();
      }

      function maybeRedirectFrontendVariant() {
        try {
          const params = new URLSearchParams(window.location.search || "");
          const variant = String(params.get("frontend") || "").trim().toLowerCase();
          if (!variant || variant === "prod" || variant === "default" || variant === "reset") return;

          const targetBase = normalizeFrontendVariantUrl(FRONTEND_VARIANT_ENVS[variant] || "");
          if (!targetBase) return;

          const target = new URL(targetBase, window.location.href);
          const current = new URL(window.location.href);

          if (target.href === current.href) return;
          if (target.origin === current.origin && target.pathname === current.pathname) return;

          ["env", "apiBase"].forEach((k) => {
            if (params.has(k)) target.searchParams.set(k, String(params.get(k)));
          });

          window.location.replace(target.toString());
        } catch (_) {
          // Ignore malformed URLs and continue with default frontend.
        }
      }

      maybeRedirectFrontendVariant();

      function resolveNamedApiBase(envName) {
        const key = String(envName || "").trim().toLowerCase();
        if (!key) return "";
        return normalizeApiBase(CALC_API_ENVS[key] || "");
      }

      function resolveCalculationApiBase() {
        const configBase = normalizeApiBase(window.KEYLOCK_CALC_API_BASE || "");
        let storedBase = "";

        try {
          storedBase = normalizeApiBase(localStorage.getItem(CALC_API_BASE_STORAGE_KEY) || "");
        } catch (_) {
          storedBase = "";
        }

        try {
          const params = new URLSearchParams(window.location.search || "");
          if (params.has("env")) {
            const envName = String(params.get("env") || "").trim().toLowerCase();
            const disable = envName === "off" || envName === "default" || envName === "reset" || envName === "prod";
            const envBase = disable ? "" : resolveNamedApiBase(envName);
            try {
              if (disable || !envBase) {
                localStorage.removeItem(CALC_API_BASE_STORAGE_KEY);
              } else {
                localStorage.setItem(CALC_API_BASE_STORAGE_KEY, envBase);
              }
            } catch (_) {}
            return envBase;
          }

          if (params.has("apiBase")) {
            const queryBaseRaw = String(params.get("apiBase") || "").trim();
            const disable = queryBaseRaw === "off" || queryBaseRaw === "default" || queryBaseRaw === "reset";
            const queryBase = disable ? "" : normalizeApiBase(queryBaseRaw);
            try {
              if (disable || !queryBase) {
                localStorage.removeItem(CALC_API_BASE_STORAGE_KEY);
              } else {
                localStorage.setItem(CALC_API_BASE_STORAGE_KEY, queryBase);
              }
            } catch (_) {}
            return queryBase;
          }
        } catch (_) {}

        return storedBase || configBase;
      }

      function getRuntimeVariantLabels() {
        const labels = [];

        try {
          const params = new URLSearchParams(window.location.search || "");
          const frontendVariant = String(params.get("frontend") || "").trim().toLowerCase();
          const envVariant = String(params.get("env") || "").trim().toLowerCase();
          const apiBaseVariant = String(params.get("apiBase") || "").trim();

          if (frontendVariant === "dev" || window.location.host.includes("githack.com")) {
            labels.push("dev-frontend");
          }
          if (envVariant === "dev" || !!apiBaseVariant) {
            labels.push("dev-api");
          }
        } catch (_) {}

        return labels;
      }

      function renderRuntimeBadge() {
        const heroTools = document.querySelector(".hero-tools");
        if (!heroTools) return;

        const labels = getRuntimeVariantLabels();
        let badge = document.getElementById("runtimeEnvBadge");

        if (!labels.length) {
          if (badge) badge.remove();
          return;
        }

        if (!badge) {
          badge = document.createElement("div");
          badge.id = "runtimeEnvBadge";
          badge.className = "runtime-badge";
          heroTools.prepend(badge);
        }

        badge.innerHTML = labels.map((label) => {
          if (label === "dev-frontend") {
            return '<span class="runtime-badge-chip runtime-badge-chip--frontend">DEV FRONTEND</span>';
          }
          return '<span class="runtime-badge-chip runtime-badge-chip--api">DEV API</span>';
        }).join("");
      }

    function getRuntimeVariantLabels() {
      const labels = [];

      try {
        const params = new URLSearchParams(window.location.search || "");
        const frontendVariant = String(params.get("frontend") || "").trim().toLowerCase();
        const envVariant = String(params.get("env") || "").trim().toLowerCase();
        const apiBaseVariant = String(params.get("apiBase") || "").trim();

        if (frontendVariant === "dev" || window.location.host.includes("githack.com")) {
          labels.push("dev-frontend");
        }
        if (envVariant === "dev" || !!apiBaseVariant) {
          labels.push("dev-api");
        }
      } catch (_) {}

      return labels;
    }

    function renderRuntimeBadge() {
      const heroTools = document.querySelector(".hero-tools");
      if (!heroTools) return;

      const labels = getRuntimeVariantLabels();
      let badge = document.getElementById("runtimeEnvBadge");

      if (!labels.length) {
        if (badge) badge.remove();
        return;
      }

      if (!badge) {
        badge = document.createElement("div");
        badge.id = "runtimeEnvBadge";
        badge.className = "runtime-badge";
        heroTools.prepend(badge);
      }

      badge.innerHTML = labels.map((label) => {
        if (label === "dev-frontend") {
          return '<span class="runtime-badge-chip runtime-badge-chip--frontend">DEV FRONTEND</span>';
        }
        return '<span class="runtime-badge-chip runtime-badge-chip--api">DEV API</span>';
      }).join("");
    }

    function tr(key) {
      const table = I18N[currentLang] || I18N.it;
      return table[key] || I18N.it[key] || key;
    }

    function msg(key, vars = {}) {
      let out = tr(key);
      Object.keys(vars).forEach((k) => {
        out = out.replaceAll(`{${k}}`, String(vars[k]));
      });
      return out;
    }

    function getCurrentLocale() {
      return currentLang === "en" ? "en-US" : "it-IT";
    }

    function convertedMoney(v) {
      const n = Number(v || 0);
      const rate = CURRENCY_RATES[currentCurrency] || 1;
      return n * rate;
    }

    function resolveCalculationApiUrl() {
        const calcApiBase = resolveCalculationApiBase();
        if (calcApiBase) return `${calcApiBase}/api/calculate`;
      return "/api/calculate";
    }

    function patchFabricTextBaselineTypo() {
      if (!window.fabric || !window.fabric.Text || !window.fabric.Text.prototype) return;
      const proto = window.fabric.Text.prototype;
      if (proto.__keylockBaselinePatched) return;

      // Fabric 5 in this bundle uses the non-standard baseline value "alphabetical".
      proto._setTextStyles = function(ctx, styleDeclaration, forMeasuring) {
        if (!ctx) return;
        ctx.textBaseline = "alphabetic";
        if (this.path) {
          switch (this.pathAlign) {
            case "center":
              ctx.textBaseline = "middle";
              break;
            case "ascender":
              ctx.textBaseline = "top";
              break;
            case "descender":
              ctx.textBaseline = "bottom";
              break;
            default:
              break;
          }
        }
        ctx.font = this._getFontDeclaration(styleDeclaration, forMeasuring);
      };
      proto.__keylockBaselinePatched = true;
    }

    function normalizeUiZoom(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return 1;
      const clamped = Math.min(UI_ZOOM_MAX, Math.max(UI_ZOOM_MIN, n));
      return Math.round(clamped * 10) / 10;
    }

    function updateUiZoomButtons(zoom) {
      const btnOut = document.getElementById("btnZoomOut");
      const btnIn = document.getElementById("btnZoomIn");
      if (btnOut) btnOut.disabled = zoom <= UI_ZOOM_MIN;
      if (btnIn) btnIn.disabled = zoom >= UI_ZOOM_MAX;
    }

    function applyUiZoom(value) {
      const zoom = normalizeUiZoom(value);
      document.documentElement.style.setProperty("--ui-zoom", String(zoom));
      const level = document.getElementById("zoomLevel");
      if (level) level.textContent = `${Math.round(zoom * 100)}%`;
      updateUiZoomButtons(zoom);
      return zoom;
    }

    function setUiZoom(value, persist = true) {
      const zoom = applyUiZoom(value);
      if (persist) {
        try {
          localStorage.setItem(UI_ZOOM_KEY, String(zoom));
        } catch (_) {}
      }
      return zoom;
    }

    function getCurrentUiZoomValue() {
      const raw = document.documentElement.style.getPropertyValue("--ui-zoom");
      const n = Number(raw);
      if (!Number.isFinite(n)) return 1;
      return normalizeUiZoom(n);
    }

    function captureUiViewStateFromDom() {
      const spieg = document.querySelector("#spiegPanel details.spieg-details");
      const formula = document.getElementById("formulaDetails");
      const permCalendar = document.getElementById("permCalendarDetails");
      const cloudHistory = document.getElementById("cloudHistoryPanel");
      if (spieg) uiViewState.spiegOpen = !!spieg.open;
      if (formula) uiViewState.formulaOpen = !!formula.open;
      if (permCalendar) uiViewState.permCalendarOpen = !!permCalendar.open;
      if (cloudHistory) uiViewState.cloudHistoryOpen = !!cloudHistory.open;
    }

    function applyUiViewStateToDom() {
      const formula = document.getElementById("formulaDetails");
      const permCalendar = document.getElementById("permCalendarDetails");
      const cloudHistory = document.getElementById("cloudHistoryPanel");
      if (formula) formula.open = !!uiViewState.formulaOpen;
      if (permCalendar) permCalendar.open = !!uiViewState.permCalendarOpen;
      if (cloudHistory) cloudHistory.open = !!uiViewState.cloudHistoryOpen;
    }

    function initUiZoom() {
      let stored = null;
      try {
        stored = localStorage.getItem(UI_ZOOM_KEY);
      } catch (_) {
        stored = null;
      }
      const defaultZoom = window.matchMedia && window.matchMedia("(max-width: 640px)").matches ? 1.1 : 1;
      const base = stored == null ? defaultZoom : Number(stored);
      return setUiZoom(base, stored == null);
    }

    function initPreferences() {
      try {
        const storedLang = String(localStorage.getItem(UI_LANG_KEY) || "it").toLowerCase();
        currentLang = SUPPORTED_LANGS.includes(storedLang) ? storedLang : "it";
      } catch (_) {
        currentLang = "it";
      }

      try {
        const storedCurrency = String(localStorage.getItem(UI_CURRENCY_KEY) || "EUR").toUpperCase();
        currentCurrency = SUPPORTED_CURRENCIES.includes(storedCurrency) ? storedCurrency : "EUR";
      } catch (_) {
        currentCurrency = "EUR";
      }

      const langSelect = document.getElementById("langSelect");
      const currencySelect = document.getElementById("currencySelect");
      if (langSelect) langSelect.value = currentLang;
      if (currencySelect) currencySelect.value = currentCurrency;
    }

    function applyStaticTranslations() {
      document.documentElement.lang = currentLang;
      document.title = tr("title");

      const heroTitle = document.querySelector(".hero h1");
      const heroSubtitle = document.querySelector(".hero p");
      if (heroTitle) heroTitle.textContent = tr("heroTitle");
      if (heroSubtitle) heroSubtitle.innerHTML = tr("heroSubtitle");

      const quickActions = document.querySelector(".top-actions-trigger");
      if (quickActions) quickActions.textContent = tr("quickActions");

      const btnReset = document.getElementById("btnReset");
      const btnExport = document.getElementById("btnExportJson");
      const btnImport = document.getElementById("btnImportJson");
      const btnPdf = document.getElementById("btnPdf");
      const btnZoomReset = document.getElementById("btnZoomReset");
      const btnZoomOut = document.getElementById("btnZoomOut");
      const btnZoomIn = document.getElementById("btnZoomIn");
      const lblLang = document.getElementById("lblLang");
      const lblCurrency = document.getElementById("lblCurrency");
      const authHead = document.getElementById("authHead");
      const btnAuthModeLogin = document.getElementById("btnAuthModeLogin");
      const btnAuthModeSignup = document.getElementById("btnAuthModeSignup");
      const lblKeylockEmail = document.getElementById("lblKeylockEmail");
      const lblKeylockEmailOtp = document.getElementById("lblKeylockEmailOtp");
      const btnVerifyEmailCode = document.getElementById("btnVerifyEmailCode");
      const permCalendarTitle = document.getElementById("permCalendarTitle");
      const permCalendarNote = document.getElementById("permCalendarNote");
      const permCalendarMonthLabel = document.getElementById("permCalendarMonthLabel");
      const btnPermCalendarReset = document.getElementById("btnPermCalendarReset");
      const permLegendC1 = document.getElementById("permLegendC1");
      const permLegendC2 = document.getElementById("permLegendC2");
      const extraBoxTitle = document.getElementById("extraBoxTitle");
      const extraBoxNote = document.getElementById("extraBoxNote");
      const lblStraordAnn1 = document.getElementById("lblStraordAnn1");
      const lblStraordAnn2 = document.getElementById("lblStraordAnn2");
      const hintStraordAnn1 = document.getElementById("hintStraordAnn1");
      const hintStraordAnn2 = document.getElementById("hintStraordAnn2");
      const btnLoginKeyLock = document.getElementById("btnLoginKeyLock");
      const btnRegisterKeyLock = document.getElementById("btnRegisterKeyLock");
      const coffeeHero = document.querySelector(".btn-coffee-hero");
      const calcProfile = document.getElementById("calcProfile");
      const incomeMode = document.getElementById("incomeMode");
      const lblCalcProfile = document.getElementById("lblCalcProfile");
      const hintCalcProfile = document.getElementById("hintCalcProfile");
      const cardTitles = document.querySelectorAll(".card h2");
      const calcSummary = document.querySelector("#formulaDetails > summary");
      const orientativeNote = document.querySelectorAll(".card .content > p.note")[0];

      if (btnReset) btnReset.textContent = tr("btnReset");
      if (btnExport) btnExport.textContent = tr("btnExport");
      if (btnImport) btnImport.textContent = tr("btnImport");
      if (btnPdf) btnPdf.textContent = tr("btnPdf");
      if (btnZoomReset) btnZoomReset.textContent = tr("btnZoomReset");
      if (btnZoomOut) btnZoomOut.title = tr("btnZoomOutTitle");
      if (btnZoomIn) btnZoomIn.title = tr("btnZoomInTitle");
      if (btnZoomReset) btnZoomReset.title = tr("btnZoomResetTitle");
      if (lblLang) lblLang.textContent = tr("lang");
      if (lblCurrency) lblCurrency.textContent = tr("currency");
      if (authHead) authHead.textContent = tr("authHead");
      if (btnAuthModeLogin) btnAuthModeLogin.textContent = tr("authModeLogin");
      if (btnAuthModeSignup) btnAuthModeSignup.textContent = tr("authModeSignup");
      if (lblKeylockEmail) lblKeylockEmail.childNodes[0].textContent = tr("authEmailLabelSignup");
      if (lblKeylockEmailOtp) lblKeylockEmailOtp.childNodes[0].textContent = tr("authVerifyCodeLabel");
      if (btnVerifyEmailCode) btnVerifyEmailCode.textContent = tr("authVerifyCodeBtn");
      if (permCalendarTitle) permCalendarTitle.textContent = tr("permCalendarTitle");
      if (permCalendarNote) permCalendarNote.textContent = tr("permCalendarNote");
      if (permCalendarMonthLabel) permCalendarMonthLabel.textContent = tr("permCalendarMonthLabel");
      if (btnPermCalendarReset) btnPermCalendarReset.textContent = tr("permCalendarResetBtn");
      if (permLegendC1) permLegendC1.textContent = c1n();
      if (permLegendC2) permLegendC2.textContent = c2n();
      if (extraBoxTitle) extraBoxTitle.textContent = tr("extraBoxTitle");
      if (extraBoxNote) extraBoxNote.textContent = tr("extraBoxNote");
      if (lblStraordAnn1) lblStraordAnn1.textContent = msg("extraAnnLabel1", { spouse: c1n(), currency: currentCurrency });
      if (lblStraordAnn2) lblStraordAnn2.textContent = msg("extraAnnLabel2", { spouse: c2n(), currency: currentCurrency });
      if (hintStraordAnn1) hintStraordAnn1.title = msg("extraAnnHint1", { spouse: c1n() });
      if (hintStraordAnn2) hintStraordAnn2.title = msg("extraAnnHint2", { spouse: c2n() });
      if (btnLoginKeyLock) btnLoginKeyLock.textContent = tr("authLoginBtn");
      if (btnRegisterKeyLock) btnRegisterKeyLock.textContent = tr("authSignupBtn");
      if (coffeeHero) {
        coffeeHero.title = tr("coffeeHero");
        coffeeHero.innerHTML = "&#9749; " + tr("coffeeHero");
      }
      if (lblCalcProfile) lblCalcProfile.childNodes[0].textContent = tr("calcProfileLabel");
      if (hintCalcProfile) hintCalcProfile.title = tr("calcProfileHint");
      if (calcProfile) {
        const n1 = calcProfile.querySelector("option[value='it-national-2026.1']");
        const n2 = calcProfile.querySelector("option[value='it-genova-2026.1']");
        if (n1) n1.textContent = tr("calcProfileNational");
        if (n2) n2.textContent = tr("calcProfileGenova");
      }
      if (incomeMode) {
        const monthly = incomeMode.querySelector("option[value='monthly']");
        const annual = incomeMode.querySelector("option[value='annual']");
        const cu = incomeMode.querySelector("option[value='cu']");
        if (currentLang === "en") {
          if (monthly) monthly.textContent = "Monthly income";
          if (annual) annual.textContent = "Yearly income (conversion /12)";
          if (cu) cu.textContent = "CU tax certificate (gross yearly -> estimated net)";
        } else {
          if (monthly) monthly.textContent = "Reddito mensile";
          if (annual) annual.textContent = "Reddito annuale (conversione /12)";
          if (cu) cu.textContent = "Certificazione Unica (lordo annuale -> netto stimato)";
        }
      }
      if (cardTitles[0]) cardTitles[0].textContent = tr("inputsTitle");
      if (cardTitles[1]) cardTitles[1].textContent = tr("resultsTitle");
      if (cardTitles[2]) cardTitles[2].textContent = tr("scenarioLabTitle");
      renderRuntimeBadge();
      const btnSaveScenarioTr = document.getElementById("btnSaveScenario");
      const btnClearScenariosTr = document.getElementById("btnClearScenarios");
      if (btnSaveScenarioTr) btnSaveScenarioTr.innerHTML = `<span class="btn-icon" aria-hidden="true">+</span>${escapeHtml(tr("scenarioLabSaveBtn"))}`;
      if (btnClearScenariosTr) btnClearScenariosTr.innerHTML = `<span class="btn-icon" aria-hidden="true">~</span>${escapeHtml(tr("scenarioLabClearBtn"))}`;
      if (calcSummary) calcSummary.textContent = tr("howCalc");
      if (orientativeNote) orientativeNote.textContent = tr("orientative");

      const visitorTotalLabel = document.getElementById("visitorTotalLabel");
      const visitorActiveLabel = document.getElementById("visitorActiveLabel");
      const visitorLoggedLabel = document.getElementById("visitorLoggedLabel");
      if (visitorTotalLabel) visitorTotalLabel.textContent = tr("footerVisitorsTotal");
      if (visitorActiveLabel) visitorActiveLabel.textContent = tr("footerVisitorsActive");
      if (visitorLoggedLabel) visitorLoggedLabel.textContent = tr("footerLoggedUsers");
      updateExtraordinaryModuleUi();
      updatePermanenceCalendarSummary();
      renderVisitorCounters();
    }

    function setTopActionsOpen(open) {
      const wrap = document.getElementById("topActions");
      if (!wrap) return;
      const trigger = wrap.querySelector(".top-actions-trigger");
      wrap.classList.toggle("is-open", !!open);
      if (trigger) {
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      }
    }

    function initTopActionsMenu() {
      const wrap = document.getElementById("topActions");
      if (!wrap) return;
      const trigger = wrap.querySelector(".top-actions-trigger");
      const menu = wrap.querySelector(".top-actions-menu");
      if (!trigger || !menu) return;

      setTopActionsOpen(false);

      // Click/touch fallback: desktop uses CSS :hover, touch uses explicit toggle.
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTopActionsOpen(!wrap.classList.contains("is-open"));
      });

      menu.addEventListener("click", (e) => {
        if (e.target && e.target.closest("button")) {
          setTopActionsOpen(false);
        }
      });

      document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) {
          setTopActionsOpen(false);
        }
      });

      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setTopActionsOpen(false);
          trigger.focus();
        }
      });
    }

    function eur(v) {
      const n = convertedMoney(v);
      return new Intl.NumberFormat(getCurrentLocale(), { style: "currency", currency: currentCurrency }).format(n);
    }

    function eurTiny(v) {
      const n = convertedMoney(v);
      const short = new Intl.NumberFormat(getCurrentLocale(), {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(n);
      return `${short} ${currentCurrency}`;
    }

    function escapeHtml(value) {
      return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function normalizeExpenseItem(item, fallbackIdx = 0) {
      const rawLabel = String(item && item.label ? item.label : "").trim();
      const rawHelp = String(item && item.help ? item.help : "").trim();
      const label = rawLabel || `Voce personalizzata ${fallbackIdx + 1}`;
      const help = rawHelp || `Voce aggiunta manualmente: ${label}.`;
      return { label, help };
    }

    function populateSuggestedExpenseOptions() {
      const select = document.getElementById("suggestedExpenseSelect");
      if (!select) return;
      select.innerHTML = `<option value="">Seleziona una voce suggerita</option>`;
      suggestedExpenseCatalog.forEach((item, idx) => {
        const option = document.createElement("option");
        option.value = String(idx);
        option.textContent = item.label;
        select.appendChild(option);
      });
    }

    function parseFlexibleNumber(rawValue) {
      let raw = String(rawValue ?? "").trim();
      if (!raw) return 0;

      raw = raw
        .replace(/\s+/g, "")
        .replace(/[\u00A0\u202F]/g, "")
        .replace(/[^\d,.-]/g, "");

      // Accept both IT and EN decimal formats (1.234,56 / 1,234.56 / 1234,56 / 1234.56).
      if (raw.includes(",") && raw.includes(".")) {
        if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
          raw = raw.replace(/\./g, "").replace(",", ".");
        } else {
          raw = raw.replace(/,/g, "");
        }
      } else if (raw.includes(",")) {
        raw = raw.replace(",", ".");
      }

      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }

    function num(id) {
      const raw = document.getElementById(id).value;
      return parseFlexibleNumber(raw);
    }

    function text(id) {
      return String(document.getElementById(id).value || "").trim();
    }

    function safeJsonClone(v) {
      try {
        return JSON.parse(JSON.stringify(v));
      } catch (_) {
        return null;
      }
    }

    function statesEqual(a, b) {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch (_) {
        return false;
      }
    }

    function normalizeCloudProfileDoc(decoded, fallbackUpdatedAt = null) {
      if (decoded && decoded.format === CLOUD_PROFILE_FORMAT && decoded.current && decoded.current.base && Array.isArray(decoded.current.spese)) {
        const hist = Array.isArray(decoded.history) ? decoded.history : [];
        return {
          format: CLOUD_PROFILE_FORMAT,
          current: decoded.current,
          history: hist,
          updatedAt: decoded.updatedAt || fallbackUpdatedAt || new Date().toISOString()
        };
      }

      if (decoded && decoded.base && Array.isArray(decoded.spese)) {
        return {
          format: CLOUD_PROFILE_FORMAT,
          current: decoded,
          history: [],
          updatedAt: fallbackUpdatedAt || new Date().toISOString()
        };
      }

      throw new Error("Profilo cloud non valido");
    }

    function normalizeScenarioLabState(rawScenarios) {
      if (!Array.isArray(rawScenarios) || !rawScenarios.length) return [];

      const normalized = [];
      rawScenarios.slice(0, SCENARIO_LAB_MAX).forEach((entry, idx) => {
        if (!entry || typeof entry !== "object" || !entry.payload || typeof entry.payload !== "object") return;
        const payload = safeJsonClone(entry.payload);
        if (!payload) return;

        normalized.push({
          label: SCENARIO_LABELS[idx],
          payload,
          model: computeModelLocal(payload)
        });
      });

      return normalized;
    }

    function renderCloudHistoryPanel() {
      const panel = document.getElementById("cloudHistoryPanel");
      const list = document.getElementById("cloudHistoryList");
      if (!panel || !list) return;

      if (!authSession.username) {
        panel.classList.add("is-hidden");
        list.innerHTML = "";
        return;
      }

      panel.classList.remove("is-hidden");

      if (!cloudProfileSession.loaded || !Array.isArray(cloudProfileSession.history) || !cloudProfileSession.history.length) {
        list.innerHTML = tr("authHistoryNone");
        return;
      }

      const rows = [...cloudProfileSession.history]
        .reverse()
        .map((entry, idx) => {
          const ts = entry && entry.savedAt ? new Date(entry.savedAt).toLocaleString(getCurrentLocale()) : tr("authDateUnavailable");
          const originalIndex = cloudProfileSession.history.length - 1 - idx;
          return `<div class="history-item"><div><strong>${tr("authHistoryVersion")} ${idx + 1}</strong><small>${ts}</small></div><div class="history-actions"><button class="btn-secondary" type="button" data-history-idx="${originalIndex}">${tr("authRestore")}</button><button class="btn-secondary" type="button" data-history-delete-idx="${originalIndex}">${tr("authDeleteVersion")}</button></div></div>`;
        })
        .join("");

      list.innerHTML = `<div class="history-list">${rows}</div>`;
    }

    function normalizeUsername(value) {
      return String(value || "").trim().toLowerCase();
    }

    function isValidUsername(value) {
      return /^[a-z0-9._-]{3,40}$/.test(value);
    }

    function normalizeEmail(value) {
      return String(value || "").trim().toLowerCase();
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
    }

    const PRIMARY_PSEUDO_EMAIL_DOMAIN = "keylock-auth.app";
    function buildPseudoEmailCandidates(username) {
      const base = normalizeUsername(username);
      const primary = `${base}@${PRIMARY_PSEUDO_EMAIL_DOMAIN}`;
      return [primary];
    }

    function usernameToPseudoEmail(username) {
      return buildPseudoEmailCandidates(username)[0];
    }

    function isRateLimitAuthMessage(msg) {
      const m = String(msg || "").toLowerCase();
      return m.includes("rate limit") || m.includes("too many requests") || m.includes("email rate");
    }

    function parseRetryAfterSeconds(msg) {
      const m = String(msg || "").toLowerCase();
      const secMatch = m.match(/(\d+)\s*(second|seconds|sec|s)\b/);
      if (secMatch) return Math.max(1, Number(secMatch[1] || 0));
      const minMatch = m.match(/(\d+)\s*(minute|minutes|min|m)\b/);
      if (minMatch) return Math.max(1, Number(minMatch[1] || 0) * 60);
      return 90;
    }

    function setLocalAuthCooldown(seconds) {
      const waitSec = Math.max(15, Number(seconds || 0));
      authRateLimitedUntilTs = Date.now() + (waitSec * 1000);
      return waitSec;
    }

    function authCooldownRemainingSeconds() {
      const delta = authRateLimitedUntilTs - Date.now();
      return delta > 0 ? Math.ceil(delta / 1000) : 0;
    }

    function ensureAuthNotCoolingDown() {
      const rem = authCooldownRemainingSeconds();
      if (rem > 0) {
        setAuthStatus(msg("authRateLimitActive", { seconds: rem }), true);
        return false;
      }
      return true;
    }

    function isInvalidCredentialAuthMessage(msg) {
      return /invalid login credentials/i.test(String(msg || ""));
    }

    function buildLoginEmailCandidates(username, explicitEmail = "") {
      const out = [];
      const seen = new Set();
      const push = (email) => {
        const e = normalizeEmail(email);
        if (!isValidEmail(e) || seen.has(e)) return;
        seen.add(e);
        out.push(e);
      };

      if (explicitEmail) push(explicitEmail);
      if (isValidUsername(username)) {
        buildPseudoEmailCandidates(username).forEach(push);
      }
      return out;
    }

    function isEmailNotConfirmedAuthMessage(msg) {
      const m = String(msg || "").toLowerCase();
      return m.includes("email not confirmed") || m.includes("email_not_confirmed") || m.includes("confirm your email");
    }

    async function signInWithEmailCandidates(username, password, explicitEmail = "") {
      const emails = buildLoginEmailCandidates(username, explicitEmail);
      if (!emails.length) {
        return { ok: false, email: null, result: null, lastErrorMessage: tr("authNeedValidUserOrEmail") };
      }
      let lastErrorMessage = "";
      for (const email of emails) {
        const signInRes = await supabaseClient.auth.signInWithPassword({ email, password });
        if (!signInRes.error && signInRes.data && signInRes.data.user) {
          return { ok: true, email, result: signInRes, lastErrorMessage };
        }

        lastErrorMessage = String((signInRes.error && signInRes.error.message) || "");
        if (isRateLimitAuthMessage(lastErrorMessage)) {
          const waitSec = setLocalAuthCooldown(parseRetryAfterSeconds(lastErrorMessage));
          lastErrorMessage = msg("authRateLimitRetry", { seconds: waitSec });
          return { ok: false, email: null, result: null, lastErrorMessage };
        }
      }

      return { ok: false, email: null, result: null, lastErrorMessage };
    }

    async function completeAuthSession(username, password, user) {
      authSession.username = username;
      authSession.userId = user.id;
      authSession.keyBits = await deriveSessionKeyBits(password, user.id);
      updateAuthUi();
      return msg("authLoginAs", { username });
    }

    function bytesToBase64(bytes) {
      let s = "";
      bytes.forEach((b) => {
        s += String.fromCharCode(b);
      });
      return btoa(s);
    }

    function base64ToBytes(b64) {
      const s = atob(String(b64 || ""));
      const out = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i += 1) {
        out[i] = s.charCodeAt(i);
      }
      return out;
    }

    function decodeBytesFlexible(value) {
      const raw = String(value || "").trim();
      if (!raw) return null;

      // Try classic/URL-safe base64 first.
      try {
        let b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4 !== 0) b64 += "=";
        const bytes = base64ToBytes(b64);
        if (bytes && bytes.length) return bytes;
      } catch (_) {
        // Continue with hex fallback.
      }

      // Fallback for hex-encoded payloads.
      if (/^[0-9a-f]+$/i.test(raw) && raw.length % 2 === 0) {
        const out = new Uint8Array(raw.length / 2);
        for (let i = 0; i < raw.length; i += 2) {
          out[i / 2] = parseInt(raw.slice(i, i + 2), 16);
        }
        return out;
      }

      return null;
    }

    async function sha256Bytes(bytes) {
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      return new Uint8Array(hash);
    }

    async function deriveKeyBits(password, saltBytes, iterations = 120000) {
      const enc = new TextEncoder();
      const material = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
      );
      const bits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: saltBytes,
          iterations,
          hash: "SHA-256"
        },
        material,
        256
      );
      return new Uint8Array(bits);
    }

    async function tryDecryptWithKeyBytes(keyBytes, cipherPayload) {
      try {
        const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
        const iv = decodeBytesFlexible(cipherPayload.iv);
        const data = decodeBytesFlexible(cipherPayload.data);
        if (!iv || !data || !iv.length || !data.length) return null;
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
        const parsed = JSON.parse(new TextDecoder().decode(plain));
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch (_) {
        return null;
      }
    }

    async function encryptStateForKey(state, keyBits) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await crypto.subtle.importKey("raw", keyBits, "AES-GCM", false, ["encrypt"]);
      const plain = new TextEncoder().encode(JSON.stringify(state));
      const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
      return {
        iv: bytesToBase64(iv),
        data: bytesToBase64(new Uint8Array(cipher))
      };
    }

    async function decryptStateForKey(payload, keyBits) {
      const iv = decodeBytesFlexible(payload.iv);
      const data = decodeBytesFlexible(payload.data);
      if (!iv || !data || !iv.length || !data.length) throw new Error("Payload non valido (iv/data non decodificabili)");
      const key = await crypto.subtle.importKey("raw", keyBits, "AES-GCM", false, ["decrypt"]);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
      const textValue = new TextDecoder().decode(plain);
      return JSON.parse(textValue);
    }

    function setAuthStatus(message, isError = false) {
      const el = document.getElementById("authStatus");
      if (!el) return;
      el.classList.toggle("error", !!isError);

      if (!message) {
        el.textContent = "";
        el.style.display = "none";
        return;
      }

      el.style.display = "block";
      el.textContent = message;
    }

    function updateAuthModeUi() {
      const isSignup = authUiState.mode === "signup";
      const loginModeBtn = document.getElementById("btnAuthModeLogin");
      const signupModeBtn = document.getElementById("btnAuthModeSignup");
      const emailWrap = document.getElementById("authEmailFieldWrap");
      const loginBtn = document.getElementById("btnLoginKeyLock");
      const registerBtn = document.getElementById("btnRegisterKeyLock");
      const verifySection = document.getElementById("authVerifySection");

      if (loginModeBtn) {
        loginModeBtn.classList.toggle("is-active", !isSignup);
        loginModeBtn.setAttribute("aria-selected", isSignup ? "false" : "true");
      }
      if (signupModeBtn) {
        signupModeBtn.classList.toggle("is-active", isSignup);
        signupModeBtn.setAttribute("aria-selected", isSignup ? "true" : "false");
      }
      if (emailWrap) emailWrap.classList.toggle("is-hidden", !isSignup);
      if (loginBtn) loginBtn.classList.toggle("is-hidden", isSignup);
      if (registerBtn) registerBtn.classList.toggle("is-hidden", !isSignup);
      if (verifySection) {
        const shouldShowVerify = isSignup && !!authUiState.pendingVerification;
        verifySection.classList.toggle("is-hidden", !shouldShowVerify);
      }
    }

    function setAuthMode(mode) {
      authUiState.mode = mode === "signup" ? "signup" : "login";
      updateAuthModeUi();
    }

    function updateAuthUi() {
      const logged = !!authSession.username;
      const loginSection = document.getElementById("authLoginSection");
      const loginActions = document.getElementById("authLoginActions");
      const sessionActions = document.getElementById("authSessionActions");
      const toggleBtn = document.getElementById("btnAuthMenu");

      if (loginSection) loginSection.classList.toggle("is-hidden", logged);
      if (loginActions) loginActions.classList.toggle("is-hidden", logged);
      if (sessionActions) sessionActions.classList.toggle("is-hidden", !logged);
      if (toggleBtn) {
        toggleBtn.classList.toggle("logged", logged);
        toggleBtn.querySelector("span").textContent = logged ? `${tr("authUserPrefix")}: ${authSession.username}` : tr("authLogin");
      }

      if (logged) {
        authUiState.pendingVerification = null;
        const otpInput = document.getElementById("keylockEmailOtp");
        if (otpInput) otpInput.value = "";
      }
      updateAuthModeUi();

      document.getElementById("btnRegisterKeyLock").disabled = logged;
      document.getElementById("btnLoginKeyLock").disabled = logged;
      const verifyBtn = document.getElementById("btnVerifyEmailCode");
      if (verifyBtn) verifyBtn.disabled = logged;
      document.getElementById("btnLogoutKeyLock").disabled = !logged;
      document.getElementById("btnSaveMyScenario").disabled = !logged;
      document.getElementById("btnLoadMyScenario").disabled = !logged;

      if (logged) {
        setAuthStatus("", false);
      } else {
        setAuthStatus(tr("authNotAuthenticated"), false);
      }

      void syncPresenceTrackState();
    }

    function setAuthMenuOpen(open) {
      const wrap = document.getElementById("authMenuWrap");
      const btn = document.getElementById("btnAuthMenu");
      if (!wrap || !btn) return;
      wrap.classList.toggle("open", !!open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function initAuthMenu() {
      const wrap = document.getElementById("authMenuWrap");
      const btn = document.getElementById("btnAuthMenu");
      if (!wrap || !btn) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = !wrap.classList.contains("open");
        setAuthMenuOpen(willOpen);
      });

      wrap.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      // Close menu when keyboard focus moves outside of the auth panel.
      wrap.addEventListener("focusout", (e) => {
        const nextFocused = e.relatedTarget;
        if (!nextFocused || !wrap.contains(nextFocused)) {
          setAuthMenuOpen(false);
        }
      });

      document.addEventListener("click", () => {
        setAuthMenuOpen(false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setAuthMenuOpen(false);
        }
      });

      window.addEventListener("blur", () => {
        setAuthMenuOpen(false);
      });
    }

    function initCoffeeFloatVisibility() {
      const footer = document.querySelector(".legal-footer");
      const donateBanner = document.querySelector(".donate-banner");
      const coffeeFloat = document.querySelector(".coffee-float");
      if (!coffeeFloat || !("IntersectionObserver" in window)) return;

      const targets = [donateBanner, footer].filter(Boolean);
      if (!targets.length) return;

      const observer = new IntersectionObserver((entries) => {
        // Hide the floating cup as soon as any pixel of donate/footer section becomes visible.
        const isBottomSectionVisible = entries.some((entry) => entry.isIntersecting);
        document.body.classList.toggle("footer-visible", isBottomSectionVisible);
      }, {
        root: null,
        threshold: 0
      });

      targets.forEach((target) => observer.observe(target));
    }

    function setCoffeePickerOpen(open) {
      const coffeeFloat = document.querySelector(".coffee-float");
      const floatBtn = document.querySelector(".coffee-float-btn");
      if (!coffeeFloat || !floatBtn) return;
      coffeeFloat.classList.toggle("is-open", !!open);
      floatBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function initCoffeeDonationPicker() {
      const heroCoffeeBtn = document.querySelector(".btn-coffee-hero");
      const heroDonateWrap = document.querySelector(".hero-donate");
      const heroDonateMenu = document.querySelector(".hero-donate-menu");
      const heroContactsBtn = document.querySelector(".btn-contacts-hero");
      const heroContactsWrap = document.querySelector(".hero-contacts");
      const heroContactsMenu = document.querySelector(".hero-contacts-menu");
      const coffeeFloat = document.querySelector(".coffee-float");
      const floatBtn = document.querySelector(".coffee-float-btn");
      const floatCard = document.querySelector(".coffee-float-card");
      const donateBanner = document.querySelector(".donate-banner");
      if (!heroCoffeeBtn || !coffeeFloat || !floatBtn || !floatCard) return;

      function setHeroDonateOpen(open) {
        if (!heroDonateWrap) return;
        heroDonateWrap.classList.toggle("is-open", !!open);
        heroCoffeeBtn.setAttribute("aria-expanded", open ? "true" : "false");
      }

      function setHeroContactsOpen(open) {
        if (!heroContactsWrap || !heroContactsBtn) return;
        heroContactsWrap.classList.toggle("is-open", !!open);
        heroContactsBtn.setAttribute("aria-expanded", open ? "true" : "false");
      }

      floatBtn.setAttribute("aria-haspopup", "true");
      floatBtn.setAttribute("aria-expanded", "false");
      heroCoffeeBtn.setAttribute("aria-haspopup", "true");
      heroCoffeeBtn.setAttribute("aria-expanded", "false");
      if (heroContactsBtn) {
        heroContactsBtn.setAttribute("aria-haspopup", "true");
        heroContactsBtn.setAttribute("aria-expanded", "false");
      }

      heroCoffeeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const willOpen = !(heroDonateWrap && heroDonateWrap.classList.contains("is-open"));
        setHeroContactsOpen(false);
        setHeroDonateOpen(willOpen);
      });

      if (heroContactsBtn) {
        heroContactsBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const willOpen = !(heroContactsWrap && heroContactsWrap.classList.contains("is-open"));
          setHeroDonateOpen(false);
          setHeroContactsOpen(willOpen);
        });
      }

      if (heroDonateMenu) {
        heroDonateMenu.addEventListener("click", (e) => {
          if (e.target && e.target.closest("a")) setHeroDonateOpen(false);
        });
      }
      if (heroContactsMenu) {
        heroContactsMenu.addEventListener("click", (e) => {
          if (e.target && e.target.closest("a")) setHeroContactsOpen(false);
        });
      }

      if (donateBanner) {
        donateBanner.addEventListener("click", (e) => {
          // Let payment links keep their native behavior.
          if (e.target.closest("a,button")) return;
          e.preventDefault();
          setCoffeePickerOpen(true);
        });

        donateBanner.addEventListener("keydown", (e) => {
          if ((e.key === "Enter" || e.key === " ") && !e.target.closest("a,button")) {
            e.preventDefault();
            setCoffeePickerOpen(true);
          }
        });
      }

      floatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const willOpen = !coffeeFloat.classList.contains("is-open");
        setCoffeePickerOpen(willOpen);
      });

      floatCard.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (link) setCoffeePickerOpen(false);
      });

      document.addEventListener("click", (e) => {
        if (e.target.closest(".coffee-float") || e.target.closest(".hero-donate") || e.target.closest(".hero-contacts")) return;
        setHeroContactsOpen(false);
        setHeroDonateOpen(false);
        setCoffeePickerOpen(false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setHeroContactsOpen(false);
          setHeroDonateOpen(false);
          setCoffeePickerOpen(false);
        }
      });
    }

    function getOrCreateVisitorId() {
      const fallback = `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      try {
        const existing = String(localStorage.getItem(VISITOR_ID_KEY) || "").trim();
        if (existing) return existing;
        localStorage.setItem(VISITOR_ID_KEY, fallback);
        return fallback;
      } catch (_) {
        return fallback;
      }
    }

    function counterText(value) {
      if (!Number.isFinite(value)) return tr("footerCounterUnavailable");
      return new Intl.NumberFormat(getCurrentLocale(), { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
    }

    function renderVisitorCounters() {
      const totalEl = document.getElementById("visitorTotalCount");
      const activeEl = document.getElementById("visitorActiveCount");
      const loggedEl = document.getElementById("visitorLoggedCount");
      if (totalEl) totalEl.textContent = counterText(visitorStatsState.total);
      if (activeEl) activeEl.textContent = counterText(visitorStatsState.active);
      if (loggedEl) loggedEl.textContent = counterText(visitorStatsState.logged);
    }

    async function refreshTotalVisitorsCounter() {
      const base = "https://api.countapi.xyz";
      let endpoint = `${base}/get/${VISITOR_COUNTER_NS}/${VISITOR_COUNTER_KEY}`;
      try {
        const alreadyCounted = sessionStorage.getItem(VISITOR_SESSION_FLAG) === "1";
        if (!alreadyCounted) {
          sessionStorage.setItem(VISITOR_SESSION_FLAG, "1");
          endpoint = `${base}/hit/${VISITOR_COUNTER_NS}/${VISITOR_COUNTER_KEY}`;
        }
      } catch (_) {
        endpoint = `${base}/hit/${VISITOR_COUNTER_NS}/${VISITOR_COUNTER_KEY}`;
      }

      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        visitorStatsState.total = Number(body && body.value);
      } catch (_) {
        visitorStatsState.total = null;
      }
      renderVisitorCounters();
    }

    function refreshPresenceCountersFromState() {
      if (!visitorStatsState.presenceChannel || typeof visitorStatsState.presenceChannel.presenceState !== "function") {
        visitorStatsState.active = 1;
        visitorStatsState.logged = authSession.userId ? 1 : 0;
        renderVisitorCounters();
        return;
      }

      const state = visitorStatsState.presenceChannel.presenceState() || {};
      const activeSessions = new Set();
      const loggedUsers = new Set();

      Object.values(state).forEach((entries) => {
        (entries || []).forEach((entry) => {
          if (entry && entry.sessionId) activeSessions.add(String(entry.sessionId));
          if (entry && entry.logged && entry.userId) loggedUsers.add(String(entry.userId));
        });
      });

      visitorStatsState.active = Math.max(1, activeSessions.size);
      visitorStatsState.logged = loggedUsers.size;
      renderVisitorCounters();
    }

    async function syncPresenceTrackState() {
      if (!visitorStatsState.presenceChannel) {
        visitorStatsState.logged = authSession.userId ? 1 : 0;
        renderVisitorCounters();
        return;
      }

      try {
        await visitorStatsState.presenceChannel.track({
          sessionId: visitorStatsState.sessionId,
          visitorId: visitorStatsState.visitorId,
          logged: !!authSession.userId,
          userId: authSession.userId || null,
          ts: Date.now()
        });
      } catch (_) {
        // Ignore realtime sync failures, counters fallback to local values.
      }
      refreshPresenceCountersFromState();
    }

    async function initLiveVisitorPresence() {
      visitorStatsState.visitorId = getOrCreateVisitorId();

      if (!supabaseClient) {
        visitorStatsState.active = 1;
        visitorStatsState.logged = authSession.userId ? 1 : 0;
        renderVisitorCounters();
        return;
      }

      const channel = supabaseClient.channel(VISITOR_PRESENCE_CHANNEL, {
        config: {
          presence: {
            key: visitorStatsState.sessionId
          }
        }
      });

      channel.on("presence", { event: "sync" }, () => {
        refreshPresenceCountersFromState();
      });
      channel.on("presence", { event: "join" }, () => {
        refreshPresenceCountersFromState();
      });
      channel.on("presence", { event: "leave" }, () => {
        refreshPresenceCountersFromState();
      });

      visitorStatsState.presenceChannel = channel;

      await new Promise((resolve) => {
        channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await syncPresenceTrackState();
            resolve();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            visitorStatsState.active = 1;
            visitorStatsState.logged = authSession.userId ? 1 : 0;
            renderVisitorCounters();
            resolve();
          }
        });
      });
    }

    async function initVisitorCounters() {
      renderVisitorCounters();
      await refreshTotalVisitorsCounter();
      await initLiveVisitorPresence();
    }

    async function deriveSessionKeyBits(password, userId) {
      const enc = new TextEncoder();
      const salt = await sha256Bytes(enc.encode(`keylock:${userId}`));
      return deriveKeyBits(password, salt);
    }

    async function ensureSupabaseReady(actionLabel) {
      if (!(window.crypto && window.crypto.subtle)) {
        setAuthStatus(tr("authUnsupportedBrowser"), true);
        return false;
      }
      if (!supabaseClient) {
        setAuthStatus(msg("authConfigureSupabase", { actionLabel }), true);
        return false;
      }
      return true;
    }

    async function upsertEncryptedScenarioForSession(encryptedPayload) {
      return supabaseClient
        .from(KEYLOCK_PROFILE_TABLE)
        .upsert({
          user_id: authSession.userId,
          username: authSession.username,
          scenario_cipher: encryptedPayload,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
    }

    async function registerKeyLockUser() {
      if (!await ensureSupabaseReady("registrarti")) return;
      if (authFlowInProgress) {
        setAuthStatus(tr("authOperationInProgress"), true);
        return;
      }
      if (!ensureAuthNotCoolingDown()) return;
      authFlowInProgress = true;
      try {

      const username = normalizeUsername(text("keylockUser"));
      const email = normalizeEmail(text("keylockEmail"));
      const password = text("keylockPass");
      if (!isValidUsername(username)) {
        setAuthStatus(tr("authInvalidUsernameLong"), true);
        return;
      }
      if (!isValidEmail(email)) {
        setAuthStatus(tr("authInvalidEmail"), true);
        return;
      }
      if (password.length < 6) {
        setAuthStatus(tr("authShortPassword"), true);
        return;
      }

      const signUpRes = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { username, registration_email: email },
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`
        }
      });

      if (signUpRes.error) {
        const signUpMsg = String(signUpRes.error.message || "");
        if (/already|registered/i.test(signUpMsg)) {
          setAuthStatus(msg("authRegisterFailed", { message: signUpRes.error.message }), true);
          return;
        } else if (isRateLimitAuthMessage(signUpMsg)) {
          const waitSec = setLocalAuthCooldown(parseRetryAfterSeconds(signUpMsg));
          setAuthStatus(msg("authRegisterRateLimit", { seconds: waitSec }), true);
          return;
        } else {
          setAuthStatus(msg("authRegisterFailed", { message: signUpRes.error.message }), true);
          return;
        }
      }

      if (signUpRes.data && signUpRes.data.session) {
        await supabaseClient.auth.signOut();
      }

      authUiState.pendingVerification = { username, email, password };
      const otpInput = document.getElementById("keylockEmailOtp");
      if (otpInput) otpInput.value = "";
      updateAuthModeUi();
      setAuthStatus(msg("authRegisterVerifyEmail", { email }), false);
      } finally {
        authFlowInProgress = false;
      }
    }

    async function verifySignupEmailCode() {
      if (!await ensureSupabaseReady("verificare la email")) return;
      if (authFlowInProgress) {
        setAuthStatus(tr("authOperationInProgress"), true);
        return;
      }
      if (!ensureAuthNotCoolingDown()) return;

      const pending = authUiState.pendingVerification;
      if (!pending) {
        setAuthStatus(tr("authNeedSignupVerification"), true);
        return;
      }

      const token = String(text("keylockEmailOtp") || "").replace(/\s+/g, "");
      if (token.length < 4) {
        setAuthStatus(tr("authNeedVerificationCode"), true);
        return;
      }

      authFlowInProgress = true;
      try {
        const verifyRes = await supabaseClient.auth.verifyOtp({
          email: pending.email,
          token,
          type: "signup"
        });

        if (verifyRes.error) {
          setAuthStatus(msg("authVerifyCodeFailed", { message: verifyRes.error.message }), true);
          return;
        }

        let verifiedUser = verifyRes.data && verifyRes.data.user ? verifyRes.data.user : null;
        if (!verifiedUser) {
          const signIn = await signInWithEmailCandidates(pending.username, pending.password, pending.email);
          if (!signIn.ok) {
            const loginMsg = String(signIn.lastErrorMessage || "");
            if (isRateLimitAuthMessage(loginMsg)) {
              setAuthStatus(tr("authLoginRateLimit"), true);
              return;
            }
            setAuthStatus(msg("authLoginFailed", { message: loginMsg || tr("authUserFallback") }), true);
            return;
          }
          verifiedUser = signIn.result.data.user;
        }

        await completeAuthSession(pending.username, pending.password, verifiedUser);
        authUiState.pendingVerification = null;
        setAuthMode("login");
        setAuthStatus(msg("authVerifyCodeSuccess", { username: pending.username }));
        await loadScenarioForLoggedUser({ silentNoData: true, fromLogin: true });
      } finally {
        authFlowInProgress = false;
      }
    }

    async function loginKeyLockUser() {
      if (!await ensureSupabaseReady("effettuare il login")) return;
      if (authFlowInProgress) {
        setAuthStatus(tr("authOperationInProgress"), true);
        return;
      }
      if (!ensureAuthNotCoolingDown()) return;
      authFlowInProgress = true;
      try {

      const username = normalizeUsername(text("keylockUser"));
      const email = normalizeEmail(text("keylockEmail"));
      const password = text("keylockPass");
      if (username && !isValidUsername(username)) {
        setAuthStatus(tr("authInvalidUsername"), true);
        return;
      }
      if (email && !isValidEmail(email)) {
        setAuthStatus(tr("authInvalidEmail"), true);
        return;
      }
      if (!username && !email) {
        setAuthStatus(tr("authNeedUserOrEmail"), true);
        return;
      }

      const signIn = await signInWithEmailCandidates(username, password, email);
      if (!signIn.ok) {
        const loginMsg = String(signIn.lastErrorMessage || "");
        if (isRateLimitAuthMessage(loginMsg)) {
          setAuthStatus(tr("authLoginRateLimit"), true);
          return;
        }
        if (isEmailNotConfirmedAuthMessage(loginMsg)) {
          setAuthStatus(tr("authEmailNotVerified"), true);
          return;
        }
        if (isInvalidCredentialAuthMessage(loginMsg)) {
          setAuthStatus(tr("authInvalidCredentials"), true);
          return;
        }
        setAuthStatus(msg("authLoginFailed", { message: loginMsg || tr("authUserFallback") }), true);
        return;
      }

      const effectiveUsername = username
        || normalizeUsername(signIn.result.data.user && signIn.result.data.user.user_metadata && signIn.result.data.user.user_metadata.username)
        || normalizeUsername((email || "").split("@")[0])
        || tr("authUserFallback");

      const loginMsg = await completeAuthSession(effectiveUsername, password, signIn.result.data.user);
      setAuthStatus(loginMsg);
      await loadScenarioForLoggedUser({ silentNoData: true, fromLogin: true });
      } finally {
        authFlowInProgress = false;
      }
    }

    async function logoutKeyLockUser() {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      authSession.username = null;
      authSession.userId = null;
      authSession.keyBits = null;
      cloudProfileSession.loaded = null;
      cloudProfileSession.history = [];
      updateAuthUi();
      renderCloudHistoryPanel();
      setAuthStatus(tr("authLogoutDone"));
    }

    async function saveScenarioForLoggedUser() {
      if (!authSession.username || !authSession.userId || !authSession.keyBits) {
        setAuthStatus(tr("authLoginRequired"), true);
        return;
      }

      const currentState = serializeState();
      let existingDoc = null;
      let existingUpdatedAt = null;

      const existingRes = await supabaseClient
        .from(KEYLOCK_PROFILE_TABLE)
        .select("scenario_cipher, updated_at")
        .eq("user_id", authSession.userId)
        .maybeSingle();

      if (existingRes.error) {
        setAuthStatus(msg("authSaveFailed", { message: existingRes.error.message }), true);
        return;
      }

      if (existingRes.data && existingRes.data.scenario_cipher) {
        existingUpdatedAt = existingRes.data.updated_at || null;
        try {
          const decodedExisting = await decryptStateForKey(existingRes.data.scenario_cipher, authSession.keyBits);
          existingDoc = normalizeCloudProfileDoc(decodedExisting, existingUpdatedAt);
        } catch (_) {
          existingDoc = null;
        }
      }

      let history = existingDoc && Array.isArray(existingDoc.history) ? [...existingDoc.history] : [];
      const previousCurrent = existingDoc ? existingDoc.current : null;
      if (previousCurrent && !statesEqual(previousCurrent, currentState)) {
        history.push({
          savedAt: existingDoc.updatedAt || existingUpdatedAt || new Date().toISOString(),
          state: safeJsonClone(previousCurrent)
        });
      }

      history = history.slice(-CLOUD_HISTORY_MAX);

      const cloudDoc = {
        format: CLOUD_PROFILE_FORMAT,
        current: currentState,
        history,
        updatedAt: new Date().toISOString()
      };

      const encrypted = await encryptStateForKey(cloudDoc, authSession.keyBits);
      const { error } = await supabaseClient
        .from(KEYLOCK_PROFILE_TABLE)
        .upsert({
          user_id: authSession.userId,
          username: authSession.username,
          scenario_cipher: encrypted,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      if (error) {
        setAuthStatus(msg("authSaveFailed", { message: error.message }), true);
        return;
      }

      cloudProfileSession.loaded = cloudDoc;
      cloudProfileSession.history = history;
      renderCloudHistoryPanel();
      setAuthStatus(msg("authCloudSaved", { count: history.length }));
    }

    async function loadScenarioForLoggedUser(options = {}) {
      if (!authSession.username || !authSession.userId || !authSession.keyBits) {
        setAuthStatus(tr("authLoginRequired"), true);
        return false;
      }

      const { data, error } = await supabaseClient
        .from(KEYLOCK_PROFILE_TABLE)
        .select("scenario_cipher, updated_at")
        .eq("user_id", authSession.userId)
        .maybeSingle();

      if (error) {
        setAuthStatus(msg("authLoadFailed", { message: error.message }), true);
        return false;
      }
      if (!data || !data.scenario_cipher) {
        cloudProfileSession.loaded = null;
        cloudProfileSession.history = [];
        renderCloudHistoryPanel();
        if (!options.silentNoData) setAuthStatus(tr("authNoCloudProfile"), true);
        return false;
      }

      try {
        const decoded = await decryptStateForKey(data.scenario_cipher, authSession.keyBits);
        const doc = normalizeCloudProfileDoc(decoded, data.updated_at || null);
        cloudProfileSession.loaded = doc;
        cloudProfileSession.history = Array.isArray(doc.history) ? doc.history : [];
        applyState(doc.current);
        renderCloudHistoryPanel();
        setAuthStatus(options.fromLogin
          ? msg("authLoadedFromLogin", { count: cloudProfileSession.history.length })
          : msg("authLoaded", { count: cloudProfileSession.history.length }));
        return true;
      } catch (_) {
        setAuthStatus(tr("authDecryptFailed"), true);
        return false;
      }
    }

    async function deleteCloudHistoryEntry(historyIndex) {
      if (!authSession.username || !authSession.userId || !authSession.keyBits) {
        setAuthStatus(tr("authLoginRequired"), true);
        return;
      }
      if (!Number.isInteger(historyIndex) || historyIndex < 0 || historyIndex >= cloudProfileSession.history.length) {
        return;
      }
      if (!confirm(tr("authDeleteVersionConfirm"))) {
        return;
      }

      const nextHistory = cloudProfileSession.history.filter((_, idx) => idx !== historyIndex);
      const currentState = cloudProfileSession.loaded && cloudProfileSession.loaded.current
        ? cloudProfileSession.loaded.current
        : serializeState();
      const cloudDoc = {
        format: CLOUD_PROFILE_FORMAT,
        current: safeJsonClone(currentState),
        history: safeJsonClone(nextHistory),
        updatedAt: new Date().toISOString()
      };

      try {
        const encrypted = await encryptStateForKey(cloudDoc, authSession.keyBits);
        const { error } = await upsertEncryptedScenarioForSession(encrypted);
        if (error) {
          setAuthStatus(msg("authHistoryDeleteFailed", { message: error.message }), true);
          return;
        }
        cloudProfileSession.loaded = cloudDoc;
        cloudProfileSession.history = nextHistory;
        renderCloudHistoryPanel();
        setAuthStatus(tr("authHistoryDeleteDone"));
      } catch (err) {
        setAuthStatus(msg("authHistoryDeleteFailed", { message: err && err.message ? err.message : String(err) }), true);
      }
    }

    function buildExpenseRows() {
      rowsSpese.innerHTML = "";
      document.getElementById("speseCountNote").textContent = msg("expenseCountNote", { count: expenseItems.length });
      expenseItems.forEach((item, idx) => {
        const labelEsc = escapeHtml(item.label);
        const helpEsc = escapeHtml(item.help);
        const rowEl = document.createElement("tr");
        rowEl.innerHTML = `
          <td><span class="label-row">${labelEsc}<span class="hint" title="${helpEsc}">i</span></span></td>
          <td>
            <div class="spese-input-wrap">
              <div class="spese-input-main">
                <input type="number" min="0" step="0.01" id="c1_${idx}" value="0" />
                <button class="btn-secondary spese-detail-btn" type="button" data-detail-target="c1d_${idx}" data-detail-wrap="c1dw_${idx}" title="${tr("expenseDetailTitle")}">${tr("expenseDetailBtn")}</button>
              </div>
              <div class="spese-detail-wrap is-hidden" id="c1dw_${idx}">
                <textarea id="c1d_${idx}" class="spese-detail-text" rows="2" maxlength="280" placeholder="${escapeHtml(tr("expenseDetailPlaceholder"))}"></textarea>
              </div>
              <span class="spese-partial" id="p1_${idx}" title="${tr("expensePartialTitle")}">${tr("expensePartialLabel")}: ${eurTiny(0)}</span>
            </div>
          </td>
          <td>
            <div class="spese-input-wrap">
              <div class="spese-input-main">
                <input type="number" min="0" step="0.01" id="c2_${idx}" value="0" />
                <button class="btn-secondary spese-detail-btn" type="button" data-detail-target="c2d_${idx}" data-detail-wrap="c2dw_${idx}" title="${tr("expenseDetailTitle")}">${tr("expenseDetailBtn")}</button>
              </div>
              <div class="spese-detail-wrap is-hidden" id="c2dw_${idx}">
                <textarea id="c2d_${idx}" class="spese-detail-text" rows="2" maxlength="280" placeholder="${escapeHtml(tr("expenseDetailPlaceholder"))}"></textarea>
              </div>
              <span class="spese-partial" id="p2_${idx}" title="${tr("expensePartialTitle")}">${tr("expensePartialLabel")}: ${eurTiny(0)}</span>
            </div>
          </td>
          <td class="col-actions">
            <button class="btn-secondary spese-remove-btn" type="button" data-remove-expense-idx="${idx}" title="${tr("expenseRemoveTitle")}">${tr("expenseRemoveBtn")}</button>
          </td>
        `;
        rowsSpese.appendChild(rowEl);
      });
      refreshExpenseDetailButtonState();
    }

    function snapshotExpenseValues() {
      return expenseItems.map((_, i) => ({
        c1: num(`c1_${i}`),
        c2: num(`c2_${i}`),
        d1: String(document.getElementById(`c1d_${i}`)?.value || "").trim(),
        d2: String(document.getElementById(`c2d_${i}`)?.value || "").trim()
      }));
    }

    function restoreExpenseValues(values) {
      if (!Array.isArray(values)) return;
      values.forEach((row, i) => {
        const c1 = document.getElementById(`c1_${i}`);
        const c2 = document.getElementById(`c2_${i}`);
        const d1 = document.getElementById(`c1d_${i}`);
        const d2 = document.getElementById(`c2d_${i}`);
        if (c1) c1.value = Number.isFinite(Number(row && row.c1)) ? Number(row.c1) : 0;
        if (c2) c2.value = Number.isFinite(Number(row && row.c2)) ? Number(row.c2) : 0;
        if (d1) d1.value = String(row && row.d1 ? row.d1 : "");
        if (d2) d2.value = String(row && row.d2 ? row.d2 : "");
      });
      refreshExpenseDetailButtonState();
    }

    function refreshExpenseDetailButtonState() {
      const buttons = rowsSpese.querySelectorAll("button[data-detail-target]");
      buttons.forEach((btn) => {
        const targetId = String(btn.getAttribute("data-detail-target") || "");
        const detailEl = document.getElementById(targetId);
        const hasNote = !!(detailEl && String(detailEl.value || "").trim());
        btn.classList.toggle("has-note", hasNote);
      });
    }

    function removeExpenseItemAt(index) {
      if (!Number.isInteger(index) || index < 0 || index >= expenseItems.length) return;
      if (expenseItems.length <= 1) {
        alert(tr("expenseMinOneAlert"));
        return;
      }

      const currentValues = snapshotExpenseValues();
      expenseItems.splice(index, 1);
      currentValues.splice(index, 1);
      buildExpenseRows();
      restoreExpenseValues(currentValues);
      updateExpensePartials();
      renderAll();
    }

    function resetExpenseEditorFields() {
      const select = document.getElementById("suggestedExpenseSelect");
      const label = document.getElementById("customExpenseLabel");
      const help = document.getElementById("customExpenseHelp");
      if (select) select.value = "";
      if (label) label.value = "";
      if (help) help.value = "";
    }

    function updateExpensePartials() {
      let partial1 = 0;
      let partial2 = 0;
      expenseItems.forEach((_, idx) => {
        partial1 += num(`c1_${idx}`);
        partial2 += num(`c2_${idx}`);
        const p1 = document.getElementById(`p1_${idx}`);
        const p2 = document.getElementById(`p2_${idx}`);
        if (p1) {
          p1.textContent = `${tr("expensePartialLabel")}: ${eurTiny(partial1)}`;
          p1.title = `${tr("expensePartialTitle")}: ${eur(partial1)}`;
        }
        if (p2) {
          p2.textContent = `${tr("expensePartialLabel")}: ${eurTiny(partial2)}`;
          p2.title = `${tr("expensePartialTitle")}: ${eur(partial2)}`;
        }
      });
    }

    function syncPermanenza(source = "perm1") {
      let p1 = Math.min(100, Math.max(0, num("perm1")));
      let p2 = Math.min(100, Math.max(0, num("perm2")));

      if (source === "perm2") {
        p1 = 100 - p2;
      } else if (source === "slider" || source === "sliderbar") {
        const sliderBar = document.getElementById("permSliderBar");
        const sliderVal = sliderBar ? Number(sliderBar.getAttribute("aria-valuenow")) : p1;
        p1 = Math.min(100, Math.max(0, Number.isFinite(sliderVal) ? sliderVal : p1));
      } else if (source === "calendar") {
        p1 = Math.min(100, Math.max(0, p1));
      }

      p1 = Math.round(p1);
      p2 = 100 - p1;

      document.getElementById("perm1").value = p1;
      document.getElementById("perm2").value = p2;
      const sliderBar = document.getElementById("permSliderBar");
      if (sliderBar) {
        sliderBar.style.setProperty("--perm-left", `${p1}%`);
        sliderBar.setAttribute("aria-valuenow", String(p1));
        sliderBar.setAttribute("aria-valuetext", `${p1}% / ${p2}%`);
      }

      // Update days bar below slider.
      const daysLeft = document.getElementById("permDaysLeft");
      const daysRight = document.getElementById("permDaysRight");
      if (daysLeft && daysRight) {
        const fmtD = (v) => Number.isInteger(v) ? String(v) : v.toFixed(1);
        const suffix = tr("langDaysSuffix");
        const d1 = Math.round(p1 * 30 * 10 / 100) / 10;
        const d2 = Math.round(p2 * 30 * 10 / 100) / 10;
        const leftTxt = fmtD(d1) + " " + suffix;
        const rightTxt = fmtD(d2) + " " + suffix;
        daysLeft.style.width = p1 + "%";
        daysRight.style.width = p2 + "%";
        daysLeft.innerHTML = `<span class="perm-days-chip">${leftTxt}</span>`;
        daysRight.innerHTML = `<span class="perm-days-chip">${rightTxt}</span>`;
      }

      const monthInput = document.getElementById("permCalendarMonth");
      const monthValue = monthInput && parseMonthValue(monthInput.value) ? monthInput.value : (permanenceCalendarState.month || getCurrentMonthValue());
      if (source !== "calendar") {
        alignCalendarToCurrentPercent(monthValue);
        renderPermanenceCalendar(monthValue);
      } else {
        updatePermanenceCalendarSummary();
      }
    }

    function initPermSliderBar() {
      const bar = document.getElementById("permSliderBar");
      if (!bar) return;

      const applyFromClientX = (clientX) => {
        const rect = bar.getBoundingClientRect();
        if (!rect || rect.width <= 0) return;
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const p1 = Math.round(ratio * 100);
        document.getElementById("perm1").value = p1;
        syncPermanenza("perm1");
        renderAll();
      };

      let dragging = false;
      bar.addEventListener("pointerdown", (e) => {
        dragging = true;
        if (typeof bar.setPointerCapture === "function") {
          try { bar.setPointerCapture(e.pointerId); } catch (_) {}
        }
        applyFromClientX(e.clientX);
      });

      bar.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        applyFromClientX(e.clientX);
      });

      const stopDragging = (e) => {
        if (!dragging) return;
        dragging = false;
        if (typeof bar.releasePointerCapture === "function") {
          try { bar.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };

      bar.addEventListener("pointerup", stopDragging);
      bar.addEventListener("pointercancel", stopDragging);
      bar.addEventListener("lostpointercapture", () => { dragging = false; });

      bar.addEventListener("keydown", (e) => {
        const current = Math.round(Math.min(100, Math.max(0, Number(bar.getAttribute("aria-valuenow")) || 0)));
        let next = current;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - 1;
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + 1;
        else if (e.key === "PageDown") next = current - 5;
        else if (e.key === "PageUp") next = current + 5;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = 100;
        else return;

        next = Math.min(100, Math.max(0, next));
        document.getElementById("perm1").value = next;
        syncPermanenza("perm1");
        renderAll();
        e.preventDefault();
      });
    }

    function getCurrentMonthValue() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    function parseMonthValue(value) {
      const m = String(value || "").match(/^(\d{4})-(\d{2})$/);
      if (!m) return null;
      const year = Number(m[1]);
      const month = Number(m[2]);
      if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
      return { year, month };
    }

    function getCalendarDaysInMonth(monthValue) {
      const parsed = parseMonthValue(monthValue);
      if (!parsed) return 30;
      return new Date(parsed.year, parsed.month, 0).getDate();
    }

    function getMonthLabel(monthValue) {
      const parsed = parseMonthValue(monthValue);
      if (!parsed) return tr("permCalendarUnknownMonth");
      const dt = new Date(parsed.year, parsed.month - 1, 1);
      return dt.toLocaleDateString(getCurrentLocale(), { month: "long", year: "numeric" });
    }

    function getWeekdayShortLabels() {
      const baseMonday = new Date(2024, 0, 1); // Monday
      const labels = [];
      for (let i = 0; i < 7; i += 1) {
        const dt = new Date(baseMonday.getTime() + i * 86400000);
        labels.push(dt.toLocaleDateString(getCurrentLocale(), { weekday: "short" }));
      }
      return labels;
    }

    function getMonthAssignments(monthValue) {
      if (!permanenceCalendarState.byMonth[monthValue]) {
        const days = getCalendarDaysInMonth(monthValue);
        const p1 = Math.min(100, Math.max(0, Number(document.getElementById("perm1")?.value || 0)));
        const daysForC1 = Math.round((days * p1) / 100);
        const assignments = [];
        for (let d = 1; d <= days; d += 1) {
          assignments.push(d <= daysForC1 ? 1 : 2);
        }
        permanenceCalendarState.byMonth[monthValue] = assignments;
      }
      return permanenceCalendarState.byMonth[monthValue];
    }

    function alignCalendarToCurrentPercent(monthValue) {
      const assignments = getMonthAssignments(monthValue);
      const days = assignments.length || 30;
      const p1 = Math.min(100, Math.max(0, Number(document.getElementById("perm1")?.value || 0)));
      const daysForC1 = Math.round((days * p1) / 100);
      for (let i = 0; i < days; i += 1) {
        assignments[i] = i < daysForC1 ? 1 : 2;
      }
    }

    function applyPermanenceFromCalendar(monthValue, options = {}) {
      const assignments = getMonthAssignments(monthValue);
      const days = assignments.length || 30;
      const c1Days = assignments.reduce((acc, owner) => acc + (owner === 1 ? 1 : 0), 0);
      const p1 = Math.round((c1Days / days) * 100);
      document.getElementById("perm1").value = p1;
      syncPermanenza("calendar");
      updatePermanenceCalendarSummary();
      if (!options.silentRender) renderAll();
    }

    function updatePermanenceCalendarSummary() {
      const summary = document.getElementById("permCalendarSummary");
      if (!summary) return;

      const monthValue = permanenceCalendarState.month || document.getElementById("permCalendarMonth")?.value || getCurrentMonthValue();
      const assignments = getMonthAssignments(monthValue);
      const days = assignments.length || 30;
      const d1 = assignments.reduce((acc, owner) => acc + (owner === 1 ? 1 : 0), 0);
      const d2 = days - d1;
      const p1 = Math.round((d1 / days) * 100);
      const p2 = 100 - p1;

      summary.textContent = msg("permCalendarSummary", {
        month: getMonthLabel(monthValue),
        d1: String(d1),
        d2: String(d2),
        daysSuffix: tr("langDaysSuffix"),
        spouse1: c1n(),
        spouse2: c2n(),
        p1: String(p1),
        p2: String(p2)
      });

      const legend1 = document.getElementById("permLegendC1");
      const legend2 = document.getElementById("permLegendC2");
      if (legend1) legend1.textContent = c1n();
      if (legend2) legend2.textContent = c2n();
    }

    function renderPermanenceCalendar(monthValue) {
      const grid = document.getElementById("permCalendarGrid");
      if (!grid) return;
      const parsed = parseMonthValue(monthValue);
      if (!parsed) return;

      permanenceCalendarState.month = monthValue;
      const firstDayDate = new Date(parsed.year, parsed.month - 1, 1);
      const firstWeekdayMonStart = (firstDayDate.getDay() + 6) % 7;
      const days = getCalendarDaysInMonth(monthValue);
      const assignments = getMonthAssignments(monthValue);

      const weekdayHtml = getWeekdayShortLabels()
        .map((label) => `<div class="perm-cal-h">${escapeHtml(label)}</div>`)
        .join("");

      let cellsHtml = "";
      for (let i = 0; i < firstWeekdayMonStart; i += 1) {
        cellsHtml += `<button class="perm-cal-day empty" type="button" tabindex="-1" aria-hidden="true"></button>`;
      }

      for (let d = 1; d <= days; d += 1) {
        const owner = assignments[d - 1] === 1 ? 1 : 2;
        cellsHtml += `<button class="perm-cal-day c${owner}" type="button" data-cal-day="${d}" aria-label="${d}">${d}</button>`;
      }

      grid.innerHTML = weekdayHtml + cellsHtml;
      updatePermanenceCalendarSummary();
    }

    function initPermanenceCalendar() {
      const monthInput = document.getElementById("permCalendarMonth");
      const resetBtn = document.getElementById("btnPermCalendarReset");
      const grid = document.getElementById("permCalendarGrid");
      if (!monthInput || !resetBtn || !grid) return;

      monthInput.value = getCurrentMonthValue();
      permanenceCalendarState.month = monthInput.value;
      renderPermanenceCalendar(monthInput.value);
      applyPermanenceFromCalendar(monthInput.value, { silentRender: true });

      monthInput.addEventListener("change", () => {
        const nextMonth = parseMonthValue(monthInput.value) ? monthInput.value : getCurrentMonthValue();
        monthInput.value = nextMonth;
        renderPermanenceCalendar(nextMonth);
        applyPermanenceFromCalendar(nextMonth);
      });

      resetBtn.addEventListener("click", () => {
        const currentMonth = parseMonthValue(monthInput.value) ? monthInput.value : getCurrentMonthValue();
        delete permanenceCalendarState.byMonth[currentMonth];
        renderPermanenceCalendar(currentMonth);
        applyPermanenceFromCalendar(currentMonth);
      });

      grid.addEventListener("click", (e) => {
        const btn = e.target && e.target.closest("button[data-cal-day]");
        if (!btn) return;
        const day = Number(btn.getAttribute("data-cal-day"));
        if (!Number.isInteger(day) || day < 1) return;

        const month = permanenceCalendarState.month || monthInput.value || getCurrentMonthValue();
        const assignments = getMonthAssignments(month);
        if (day > assignments.length) return;
        assignments[day - 1] = assignments[day - 1] === 1 ? 2 : 1;
        renderPermanenceCalendar(month);
        applyPermanenceFromCalendar(month);
      });
    }

    function exportPermanenceCalendarState() {
      return {
        month: permanenceCalendarState.month,
        byMonth: safeJsonClone(permanenceCalendarState.byMonth)
      };
    }

    function importPermanenceCalendarState(raw) {
      permanenceCalendarState.month = "";
      permanenceCalendarState.byMonth = {};
      if (!raw || typeof raw !== "object") return;
      const byMonth = raw.byMonth && typeof raw.byMonth === "object" ? raw.byMonth : {};
      Object.entries(byMonth).forEach(([month, values]) => {
        if (!parseMonthValue(month) || !Array.isArray(values)) return;
        const days = getCalendarDaysInMonth(month);
        const normalized = values.slice(0, days).map((v) => (Number(v) === 1 ? 1 : 2));
        while (normalized.length < days) normalized.push(2);
        permanenceCalendarState.byMonth[month] = normalized;
      });
      const fallbackMonth = getCurrentMonthValue();
      permanenceCalendarState.month = parseMonthValue(raw.month) ? raw.month : fallbackMonth;
      const monthInput = document.getElementById("permCalendarMonth");
      if (monthInput) monthInput.value = permanenceCalendarState.month;
      renderPermanenceCalendar(permanenceCalendarState.month);
      applyPermanenceFromCalendar(permanenceCalendarState.month, { silentRender: true });
    }

    function sumSpese(prefix) {
      const base = expenseItems.reduce((acc, _, idx) => acc + num(`${prefix}_${idx}`), 0);
      const extra = prefix === "c1" ? getExtraordinaryMonthly(1) : getExtraordinaryMonthly(2);
      return base + extra;
    }

    /**
     * Stima il netto mensile da reddito lordo annuale (Certificazione Unica).
     * Applica: contributi INPS dipendente (9,19%), IRPEF 2025, detrazioni da
     * lavoro dipendente, addizionale regionale/comunale media (1,73%).
     * Risultato ORIENTATIVO — non sostituisce calcolo professionale.
     */
    function computeNetFromCU(grossAnnual) {
      const g = Math.max(0, grossAnnual);
      if (g === 0) return 0;

      // INPS dipendente: quota base 9,19% fino al massimale, quota eccedente 10,19%.
      // Uso a scaglioni per evitare salti artificiali sui redditi alti.
      const INPS_BASE_LIMIT = 109954;
      const INPS_BASE_RATE = 0.0919;
      const INPS_EXTRA_RATE = 0.1019;
      const inpsBase = Math.min(g, INPS_BASE_LIMIT) * INPS_BASE_RATE;
      const inpsExtra = Math.max(0, g - INPS_BASE_LIMIT) * INPS_EXTRA_RATE;
      const inps = inpsBase + inpsExtra;
      const taxable = g - inps;

      // IRPEF lorda 2025 (aliquote DL 216/2023 confermate dalla Legge Bilancio 2025)
      // 0–28.000: 23%, 28.001–50.000: 35%, oltre 50.000: 43%
      let irpefGross = 0;
      if (taxable <= 28000) {
        irpefGross = taxable * 0.23;
      } else if (taxable <= 50000) {
        irpefGross = 28000 * 0.23 + (taxable - 28000) * 0.35;
      } else {
        irpefGross = 28000 * 0.23 + 22000 * 0.35 + (taxable - 50000) * 0.43;
      }

      // Detrazione da lavoro dipendente 2025
      let detr = 0;
      if (taxable > 0 && taxable <= 15000) {
        // Semplificazione: fascia bassa trattata con detrazione piena.
        detr = 1955;
      } else if (taxable <= 28000) {
        detr = 1910 + 1190 * ((28000 - taxable) / 13000);
      } else if (taxable <= 50000) {
        detr = 1910 * ((50000 - taxable) / 22000);
      } else {
        detr = 0;
      }

      // Bonus Irpef (ex "80€" / trattamento integrativo): ≤15.000 → 1.200, 15.001–28.000 → scala
      let bonus = 0;
      if (taxable <= 15000) {
        bonus = Math.max(0, irpefGross - detr) > 0 ? 1200 : 0;
      } else if (taxable <= 28000) {
        bonus = 1200 * ((28000 - taxable) / 13000);
      }

      const irpefNetta = Math.max(0, irpefGross - detr - bonus);

      // Addizionale regionale + comunale: media nazionale ~1,73% sul reddito imponibile
      const addizionali = taxable * 0.0173;

      const netAnnual = g - inps - irpefNetta - addizionali;
      return Math.max(0, netAnnual) / 12;
    }

    // Inversione numerica: dato il netto mensile target, stima il lordo annuale CU.
    function estimateGrossFromMonthlyNet(targetMonthlyNet) {
      const target = Math.max(0, Number(targetMonthlyNet || 0));
      if (target <= 0) return 0;

      let low = 0;
      let high = Math.max(12000, target * 24);

      // Espande l'intervallo finché il netto stimato supera (o raggiunge) il target.
      let guard = 0;
      while (computeNetFromCU(high) < target && high < 5000000 && guard < 60) {
        high *= 1.6;
        guard += 1;
      }

      // Ricerca binaria sul lordo annuale.
      for (let i = 0; i < 56; i += 1) {
        const mid = (low + high) / 2;
        const n = computeNetFromCU(mid);
        if (n < target) low = mid;
        else high = mid;
      }

      return high;
    }

    function convertIncomeValuesForModeChange(prevMode, nextMode) {
      if (!prevMode || !nextMode || prevMode === nextMode) return;

      const readCurrentPair = () => ({
        r1: Number(document.getElementById("reddito1")?.value || 0),
        r2: Number(document.getElementById("reddito2")?.value || 0)
      });

      const setPair = (pair) => {
        const r1El = document.getElementById("reddito1");
        const r2El = document.getElementById("reddito2");
        if (r1El) r1El.value = String(Math.round((Number(pair.r1) || 0) * 100) / 100);
        if (r2El) r2El.value = String(Math.round((Number(pair.r2) || 0) * 100) / 100);
      };

      const convertOne = (raw, fromMode, toMode) => {
        if (!Number.isFinite(raw)) return 0;
        if (fromMode === toMode) return raw;
        if (fromMode === "monthly" && toMode === "annual") return raw * 12;
        if (fromMode === "annual" && toMode === "monthly") return raw / 12;
        if (fromMode === "monthly" && toMode === "cu") return estimateGrossFromMonthlyNet(raw);
        if (fromMode === "annual" && toMode === "cu") return estimateGrossFromMonthlyNet(raw / 12);
        if (fromMode === "cu" && toMode === "monthly") return computeNetFromCU(raw);
        if (fromMode === "cu" && toMode === "annual") return computeNetFromCU(raw) * 12;
        return raw;
      };

      // Persist the last values explicitly used in the previous mode.
      const currentPair = readCurrentPair();
      incomeValuesByMode[prevMode] = { r1: currentPair.r1, r2: currentPair.r2 };

      // If user has already entered values for the target mode, restore them as-is.
      const cachedTarget = incomeValuesByMode[nextMode];
      if (cachedTarget && Number.isFinite(cachedTarget.r1) && Number.isFinite(cachedTarget.r2)) {
        setPair(cachedTarget);
        return;
      }

      // First time entering a mode: derive once from current mode, then cache it.
      const convertedPair = {
        r1: convertOne(currentPair.r1, prevMode, nextMode),
        r2: convertOne(currentPair.r2, prevMode, nextMode)
      };
      setPair(convertedPair);
      incomeValuesByMode[nextMode] = convertedPair;
    }

    function updateModeUi() {
      const mode = getActiveCalcMode();
      const incomeMode = document.getElementById("incomeMode").value || "monthly";
      const simplePerc = document.getElementById("simplePerc");
      const simplePercField = document.getElementById("simplePercField");
      const isSimple = mode === "simple";
      if (simplePerc) {
        simplePerc.disabled = !isSimple;
        simplePerc.title = isSimple
          ? tr("simplePercTitleEnabled")
          : tr("simplePercTitleDisabled");
      }
      if (simplePercField) simplePercField.classList.toggle("is-hidden", !isSimple);

      const redditoLabel1 = document.getElementById("lblReddito1");
      const redditoLabel2 = document.getElementById("lblReddito2");
      const redditoHint1 = document.getElementById("hintReddito1");
      const redditoHint2 = document.getElementById("hintReddito2");
      const annual = incomeMode === "annual";
      const isCu = incomeMode === "cu";
      const labelText = isCu
        ? `${tr("redditoCu")} (${currentCurrency})`
        : annual
          ? `${tr("redditoAnnuale")} (${currentCurrency})`
          : `${tr("redditoMensile")} (${currentCurrency})`;
      const hintText1 = isCu
        ? msg("incomeHintCu", { spouse: c1n() })
        : annual
          ? msg("incomeHintAnnual", { spouse: c1n() })
          : msg("incomeHintMonthly", { spouse: c1n() });
      const hintText2 = isCu
        ? msg("incomeHintCu", { spouse: c2n() })
        : annual
          ? msg("incomeHintAnnual", { spouse: c2n() })
          : msg("incomeHintMonthly", { spouse: c2n() });
      if (redditoLabel1) redditoLabel1.textContent = labelText;
      if (redditoLabel2) redditoLabel2.textContent = labelText;
      if (redditoHint1) redditoHint1.title = hintText1;
      if (redditoHint2) redditoHint2.title = hintText2;

      const guideline = document.getElementById("modeGuideline");
      if (guideline) {
        if (mode === "genova") {
          guideline.innerHTML = `${tr("modeGuidelinePrefix")} <a href=\"https://www.ufficigiudiziarigenova.it/documentazione/D_112851.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">${tr("modeGuidelineLink")}</a>.`;
          guideline.style.display = "block";
        } else {
          guideline.innerHTML = "";
          guideline.style.display = "none";
        }
      }
    }

    function collectCalculationPayload() {
      const c1Spese = expenseItems.map((_, idx) => num(`c1_${idx}`));
      const c2Spese = expenseItems.map((_, idx) => num(`c2_${idx}`));
      const c1SpeseDetails = expenseItems.map((_, idx) => String(document.getElementById(`c1d_${idx}`)?.value || "").trim());
      const c2SpeseDetails = expenseItems.map((_, idx) => String(document.getElementById(`c2d_${idx}`)?.value || "").trim());
      const extra1 = getExtraordinaryMonthly(1);
      const extra2 = getExtraordinaryMonthly(2);
      if (extra1 > 0) c1Spese.push(extra1);
      if (extra2 > 0) c2Spese.push(extra2);

      const calcProfileCfg = getCalcProfileConfig(getSelectedCalcProfileId());
      return {
        incomeMode: document.getElementById("incomeMode").value || "monthly",
        calcProfile: calcProfileCfg.id,
        normProfile: calcProfileCfg.normProfile,
        r1Raw: num("reddito1"),
        r2Raw: num("reddito2"),
        figli: Math.max(1, Math.round(num("numFigli"))),
        perm1: Math.min(100, Math.max(0, num("perm1"))),
        mode: calcProfileCfg.mode,
        simplePerc: Math.min(100, Math.max(0, num("simplePerc"))),
        aPerc1: num("assegnoPercepito1"),
        aPag1: num("assegnoPagato1"),
        aPerc2: num("assegnoPercepito2"),
        aPag2: num("assegnoPagato2"),
        aFam1: num("assegnoFam1"),
        aFam2: num("assegnoFam2"),
        straordAnn1: num("straordAnn1"),
        straordAnn2: num("straordAnn2"),
        c1SpeseDetails,
        c2SpeseDetails,
        c1Spese,
        c2Spese
      };
    }

    function computeModelLocal(payload) {
      const incomeMode = payload.incomeMode || "monthly";
      const r1Raw = Number(payload.r1Raw || 0);
      const r2Raw = Number(payload.r2Raw || 0);
      let r1, r2;
      if (incomeMode === "cu") {
        r1 = computeNetFromCU(r1Raw);
        r2 = computeNetFromCU(r2Raw);
      } else {
        const incomeDivisor = incomeMode === "annual" ? 12 : 1;
        r1 = r1Raw / incomeDivisor;
        r2 = r2Raw / incomeDivisor;
      }
      const figli = Math.max(1, Math.round(Number(payload.figli || 0)));
      const perm1 = Math.min(100, Math.max(0, Number(payload.perm1 || 0)));
      const perm2 = 100 - perm1;
      const mode = payload.mode || "legal";
      const simplePerc = Math.min(100, Math.max(0, Number(payload.simplePerc || 0)));

      const aPerc1 = Number(payload.aPerc1 || 0);
      const aPag1 = Number(payload.aPag1 || 0);
      const aPerc2 = Number(payload.aPerc2 || 0);
      const aPag2 = Number(payload.aPag2 || 0);
      const aFam1 = Number(payload.aFam1 || 0);
      const aFam2 = Number(payload.aFam2 || 0);

      const match12 = Math.min(aPag1, aPerc2);
      const match21 = Math.min(aPag2, aPerc1);
      const esternoPag1 = Math.max(0, aPag1 - match12);
      const esternoPag2 = Math.max(0, aPag2 - match21);

      const spese1 = (payload.c1Spese || []).reduce((acc, v) => acc + Number(v || 0), 0);
      const spese2 = (payload.c2Spese || []).reduce((acc, v) => acc + Number(v || 0), 0);
      const speseTot = spese1 + spese2;

      const disp1 = r1 + aPerc1 + aFam1 - aPag1 - spese1;
      const disp2 = r2 + aPerc2 + aFam2 - aPag2 - spese2;

      const dispPos1 = Math.max(0, disp1);
      const dispPos2 = Math.max(0, disp2);
      const dispPosTot = dispPos1 + dispPos2;

      const peso1 = dispPosTot > 0 ? dispPos1 / dispPosTot : 0.5;
      const peso2 = 1 - peso1;

      const fabbisognoFigli = speseTot * (QUOTA_MANTENIMENTO_PERC / 100);
      const quotaTeorica1 = fabbisognoFigli * peso1;
      const quotaTeorica2 = fabbisognoFigli * peso2;
      const quotaDiretta1 = fabbisognoFigli * (perm1 / 100);
      const quotaDiretta2 = fabbisognoFigli * (perm2 / 100);
      const saldo1 = quotaTeorica1 - quotaDiretta1;
      const saldo2 = quotaTeorica2 - quotaDiretta2;
      const costoGiornalieroFiglio = fabbisognoFigli / 30;
      const collocatario = perm1 >= perm2 ? 1 : 2;

      let assegnoDa1a2 = Math.max(0, saldo1);
      let assegnoDa2a1 = Math.max(0, saldo2);

      if (mode === "simple") {
        const diffNetti = Math.abs(disp1 - disp2);
        const assegnoSemplificato = diffNetti * (simplePerc / 100);
        assegnoDa1a2 = disp1 > disp2 ? assegnoSemplificato : 0;
        assegnoDa2a1 = disp2 > disp1 ? assegnoSemplificato : 0;
      } else if (mode === "genova") {
        const nonCollocatario = collocatario === 1 ? 2 : 1;
        const quotaTeoricaNonColl = nonCollocatario === 1 ? quotaTeorica1 : quotaTeorica2;
        const giorniPermanenzaNonColl = nonCollocatario === 1 ? (perm1 / 100) * 30 : (perm2 / 100) * 30;
        const quotaDirettaNonColl = costoGiornalieroFiglio * giorniPermanenzaNonColl;
        const contributoIndiretto = Math.max(0, quotaTeoricaNonColl - quotaDirettaNonColl);
        assegnoDa1a2 = nonCollocatario === 1 ? contributoIndiretto : 0;
        assegnoDa2a1 = nonCollocatario === 2 ? contributoIndiretto : 0;
      }

      const post1 = disp1 - assegnoDa1a2 + assegnoDa2a1;
      const post2 = disp2 - assegnoDa2a1 + assegnoDa1a2;

      return {
        r1, r2, r1Raw, r2Raw, incomeMode, figli, perm1, perm2,
        aPerc1, aPag1, aPerc2, aPag2, aFam1, aFam2,
        match12, match21, esternoPag1, esternoPag2,
        spese1, spese2, speseTot,
        disp1, disp2, peso1, peso2,
        mode, simplePerc,
        collocatario, costoGiornalieroFiglio,
        fabbisognoFigli, quotaTeorica1, quotaTeorica2,
        quotaDiretta1, quotaDiretta2,
        saldo1, saldo2,
        assegnoDa1a2, assegnoDa2a1,
        post1, post2
      };
    }

    function computeModel() {
      const payload = collectCalculationPayload();
      const apiUrl = resolveCalculationApiUrl();
      if (apiUrl) {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", apiUrl, false);
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(JSON.stringify(payload));

          if (xhr.status >= 200 && xhr.status < 300) {
            const body = JSON.parse(xhr.responseText || "{}");
            if (body && body.ok && body.model) return body.model;
          }
        } catch (_) {
          // Fallback handled below.
        }
      }

      return computeModelLocal(payload);
    }

    function c1n() { return (document.getElementById("nome1").value || "").trim() || tr("spouse1Default"); }
    function c2n() { return (document.getElementById("nome2").value || "").trim() || tr("spouse2Default"); }

    function getCalcProfileConfig(profileId) {
      const normalized = String(profileId || "").trim().toLowerCase();
      if (normalized === "it-genova-2026.1") {
        return { id: "it-genova-2026.1", mode: "genova", normProfile: "it-genova-2026.1" };
      }
      return { id: "it-national-2026.1", mode: "legal", normProfile: "it-national-2026.1" };
    }

    function resolveCalcProfileIdFromState(base) {
      const profileFromBase = base && base.calcProfile ? getCalcProfileConfig(base.calcProfile).id : "";
      if (profileFromBase) return profileFromBase;
      const profileFromNorm = base && base.normProfile ? getCalcProfileConfig(base.normProfile).id : "";
      if (profileFromNorm) return profileFromNorm;
      if (base && String(base.calcMode || "").toLowerCase() === "genova") return "it-genova-2026.1";
      return "it-national-2026.1";
    }

    function getSelectedCalcProfileId() {
      const select = document.getElementById("calcProfile");
      if (!select) return "it-national-2026.1";
      return getCalcProfileConfig(select.value).id;
    }

    function getActiveCalcMode() {
      const cfg = getCalcProfileConfig(getSelectedCalcProfileId());
      return cfg.mode;
    }

    function getSelectedNormProfileLabel() {
      const select = document.getElementById("calcProfile");
      if (!select) return tr("calcProfileNational");
      const option = select.options[select.selectedIndex];
      return option ? option.textContent : tr("calcProfileNational");
    }

    function updateSpouseLabels() {
      const th1 = document.getElementById("thSpese1");
      const th2 = document.getElementById("thSpese2");
      const lp1 = document.getElementById("lblPerm1");
      const lp2 = document.getElementById("lblPerm2");
      if (th1) th1.textContent = `${c1n()} (${currentCurrency})`;
      if (th2) th2.textContent = `${c2n()} (${currentCurrency})`;
      if (lp1) lp1.textContent = c1n();
      if (lp2) lp2.textContent = c2n();
      const lblStraordAnn1 = document.getElementById("lblStraordAnn1");
      const lblStraordAnn2 = document.getElementById("lblStraordAnn2");
      const hintStraordAnn1 = document.getElementById("hintStraordAnn1");
      const hintStraordAnn2 = document.getElementById("hintStraordAnn2");
      if (lblStraordAnn1) lblStraordAnn1.textContent = msg("extraAnnLabel1", { spouse: c1n(), currency: currentCurrency });
      if (lblStraordAnn2) lblStraordAnn2.textContent = msg("extraAnnLabel2", { spouse: c2n(), currency: currentCurrency });
      if (hintStraordAnn1) hintStraordAnn1.title = msg("extraAnnHint1", { spouse: c1n() });
      if (hintStraordAnn2) hintStraordAnn2.title = msg("extraAnnHint2", { spouse: c2n() });
      updateExtraordinaryModuleUi();
      updatePermanenceCalendarSummary();
    }

    function getExtraordinaryMonthly(spouseIndex) {
      const annual = num(`straordAnn${spouseIndex}`);
      return annual > 0 ? annual / 12 : 0;
    }

    function updateExtraordinaryModuleUi() {
      const month1 = document.getElementById("straordMonth1");
      const month2 = document.getElementById("straordMonth2");
      if (month1) month1.textContent = msg("extraMonthlyEstimate", { amount: eur(getExtraordinaryMonthly(1)) });
      if (month2) month2.textContent = msg("extraMonthlyEstimate", { amount: eur(getExtraordinaryMonthly(2)) });
    }

    function renderLivePanel(m) {
      const liveNet = document.getElementById("liveNet");
      const liveBreakdown = document.getElementById("liveBreakdown");
      if (!liveNet || !liveBreakdown) return;

      const entrate1 = m.r1 + m.aPerc1 + m.aFam1;
      const entrate2 = m.r2 + m.aPerc2 + m.aFam2;
      const uscite1 = m.match12 + m.esternoPag1 + m.spese1;
      const uscite2 = m.match21 + m.esternoPag2 + m.spese2;
      const hasSuggestedSupport = Math.max(m.assegnoDa1a2, m.assegnoDa2a1) > 0.005;
      const shownDisp1 = hasSuggestedSupport ? m.post1 : m.disp1;
      const shownDisp2 = hasSuggestedSupport ? m.post2 : m.disp2;
      const liveNetLabelKey = hasSuggestedSupport ? "liveNetPostSupportPerson" : "liveNetAvailablePerson";
      const diffDisp = shownDisp1 - shownDisp2;
      const absDiffDisp = Math.abs(diffDisp);

      liveNet.innerHTML = `
        <div class="live-k">
          ${msg(liveNetLabelKey, { spouse: c1n() })}
          <strong class="${shownDisp1 >= 0 ? "ok" : "bad"}">${eur(shownDisp1)}</strong>
        </div>
        <div class="live-k">
          ${msg(liveNetLabelKey, { spouse: c2n() })}
          <strong class="${shownDisp2 >= 0 ? "ok" : "bad"}">${eur(shownDisp2)}</strong>
        </div>
        <div class="live-diff">
          <div class="live-fabric-wrap">
            <canvas id="liveDiffCanvas" class="live-fabric-canvas" height="156"></canvas>
          </div>
        </div>
      `;

      renderLiveDiffFabric(m, diffDisp, absDiffDisp);

      liveBreakdown.innerHTML = `
        <div class="live-columns">
          <div class="live-col">
            <h4>${c1n()}</h4>
            <div class="live-row"><span>${tr("liveTotalIncome")}</span><strong class="ok">${eur(entrate1)}</strong></div>
            <div class="live-row"><span>${tr("livePaidToOther")}</span><strong class="warn">${eur(m.match12)}</strong></div>
            <div class="live-row"><span>${tr("livePaidExternal")}</span><strong class="warn">${eur(m.esternoPag1)}</strong></div>
            <div class="live-row"><span>${tr("liveTotalExpensesEntered")}</span><strong class="warn">${eur(m.spese1)}</strong></div>
            <div class="live-row"><span>${tr("liveTotalOutflows")}</span><strong class="warn">${eur(uscite1)}</strong></div>
            ${hasSuggestedSupport ? `<div class="live-row"><span>${tr("pdfSuggestedSupport")}</span><strong class="warn">-${eur(m.assegnoDa1a2)}${m.assegnoDa2a1 > 0.005 ? ` / +${eur(m.assegnoDa2a1)}` : ""}</strong></div>` : ""}
            <div class="live-row"><span>${tr("pdfPostSupport")}</span><strong class="${shownDisp1 >= 0 ? "ok" : "bad"}">${eur(shownDisp1)}</strong></div>
          </div>
          <div class="live-col">
            <h4>${c2n()}</h4>
            <div class="live-row"><span>${tr("liveTotalIncome")}</span><strong class="ok">${eur(entrate2)}</strong></div>
            <div class="live-row"><span>${tr("livePaidToOther")}</span><strong class="warn">${eur(m.match21)}</strong></div>
            <div class="live-row"><span>${tr("livePaidExternal")}</span><strong class="warn">${eur(m.esternoPag2)}</strong></div>
            <div class="live-row"><span>${tr("liveTotalExpensesEntered")}</span><strong class="warn">${eur(m.spese2)}</strong></div>
            <div class="live-row"><span>${tr("liveTotalOutflows")}</span><strong class="warn">${eur(uscite2)}</strong></div>
            ${hasSuggestedSupport ? `<div class="live-row"><span>${tr("pdfSuggestedSupport")}</span><strong class="warn">-${eur(m.assegnoDa2a1)}${m.assegnoDa1a2 > 0.005 ? ` / +${eur(m.assegnoDa1a2)}` : ""}</strong></div>` : ""}
            <div class="live-row"><span>${tr("pdfPostSupport")}</span><strong class="${shownDisp2 >= 0 ? "ok" : "bad"}">${eur(shownDisp2)}</strong></div>
          </div>
        </div>
      `;
    }

    function renderLiveDiffFabric(m, diffDisp, absDiffDisp) {
      if (!window.fabric) return;
      const canvasEl = document.getElementById("liveDiffCanvas");
      if (!canvasEl) return;

      const w = Math.max(280, Math.round(canvasEl.parentElement.clientWidth - 2));
      const h = 172;
      canvasEl.width = w;
      canvasEl.height = h;

      if (netDiffFabricCanvas) {
        netDiffFabricCanvas.dispose();
        netDiffFabricCanvas = null;
      }

      const fc = new window.fabric.StaticCanvas(canvasEl, { selection: false, renderOnAddRemove: false });
      netDiffFabricCanvas = fc;

      const centerX = w / 2;
      const centerY = 118;
      const radius = Math.min(50, Math.max(38, (w * 0.16)));
      const totalAbs = Math.max(1, Math.abs(m.disp1) + Math.abs(m.disp2));
      const shift = (diffDisp / totalAbs) * (radius * 1.5);
      const pointerX = Math.max(centerX - radius * 1.6, Math.min(centerX + radius * 1.6, centerX + shift));

      const grad = (x1, y1, x2, y2, stops) => new window.fabric.Gradient({
        type: "linear",
        gradientUnits: "pixels",
        coords: { x1, y1, x2, y2 },
        colorStops: stops
      });

      const days1Badge = Math.round((m.perm1 / 100) * 30 * 10) / 10;
      const days2Badge = Math.round((m.perm2 / 100) * 30 * 10) / 10;
      const fmtDaysBadge = (v) => Number.isInteger(v) ? String(v) : v.toFixed(1);
      const badgeDaysSuffix = tr("langDaysSuffix");
      const permanenceText = `${fmtDaysBadge(days1Badge)} ${badgeDaysSuffix} / ${fmtDaysBadge(days2Badge)} ${badgeDaysSuffix}`;
      const statusText = diffDisp === 0
        ? `${tr("liveEquivalentNets")} | ${tr("pdfPermanence")} ${permanenceText}`
        : `${msg("liveNetAdvantageSpouse", { spouse: diffDisp > 0 ? c1n() : c2n() })} | ${tr("pdfPermanence")} ${permanenceText}`;

      const winnerSpouse = diffDisp === 0 ? 0 : (diffDisp > 0 ? 1 : 2);
      const loserSpouse = diffDisp === 0 ? 0 : (diffDisp > 0 ? 2 : 1);

      function roleForSpouse(spouseId) {
        if (winnerSpouse === 0) return "equal";
        if (winnerSpouse === spouseId) return "winner";
        if (loserSpouse === spouseId) return "loser";
        return "equal";
      }

      const isNarrow = w < 400;
      const figRadius = isNarrow ? 30 : 38;
      const figDiameter = figRadius * 2;
      const figMargin = isNarrow ? 8 : 20;
      const figTop = isNarrow ? 14 : 10;

      function addOutcomeFigure(left, top, spouseId, role) {
        const palette = role === "winner"
          ? { bgA: "#ecfff9", bgB: "#9bd9cb", stroke: "#8ec9bb", ink: "#0d625a" }
          : role === "loser"
            ? { bgA: "#fff8e8", bgB: "#f2be75", stroke: "#e3b677", ink: "#8a580f" }
            : { bgA: "#f6faf9", bgB: "#c5dbd6", stroke: "#bfd2cd", ink: "#3d5c59" };

        const scale = figRadius / 38;

        fc.add(new window.fabric.Circle({
          left,
          top,
          radius: figRadius,
          fill: grad(left, top, left, top + (figRadius * 2), [
            { offset: 0, color: palette.bgA },
            { offset: 1, color: palette.bgB }
          ]),
          stroke: palette.stroke,
          strokeWidth: 1.5,
          shadow: "0 2px 6px rgba(0,0,0,0.10)"
        }));

        const cx = left + figRadius;
        const cy = top + figRadius;

        // Person icon: larger proportions to occupy most of the bubble area.
        const headR = figRadius * 0.29;
        const headTop = cy - (figRadius * 0.64);
        const bodyW = figRadius * 0.74;
        const bodyH = figRadius * 0.88;
        const bodyLeft = cx - (bodyW / 2);
        const bodyTop = cy - (figRadius * 0.20);
        const bodyRound = figRadius * 0.24;

        fc.add(new window.fabric.Circle({
          left: cx - headR,
          top: headTop,
          radius: headR,
          fill: palette.ink
        }));
        fc.add(new window.fabric.Rect({
          left: bodyLeft,
          top: bodyTop,
          width: bodyW,
          height: bodyH,
          rx: bodyRound,
          ry: bodyRound,
          fill: palette.ink
        }));

        const eyeR = Math.max(1, figRadius * 0.04);
        const eyeY = headTop + (headR * 0.84);
        fc.add(new window.fabric.Circle({ left: cx - (headR * 0.60), top: eyeY, radius: eyeR, fill: "#ffffff" }));
        fc.add(new window.fabric.Circle({ left: cx + (headR * 0.24), top: eyeY, radius: eyeR, fill: "#ffffff" }));

        const mouthPath = role === "winner"
          ? "M 0 0 Q 5.5 5.5 11 0"
          : role === "loser"
            ? "M 0 4.2 Q 5.5 -1.2 11 4.2"
            : "M 0 2.2 L 11 2.2";
        fc.add(new window.fabric.Path(mouthPath, {
          left: cx - (5.5 * scale * 1.18),
          top: cy - (figRadius * 0.24),
          fill: "",
          stroke: "#ffffff",
          strokeWidth: Math.max(1.1, 1.45 * scale),
          strokeLineCap: "round"
        }));

      }

      const reservedForFigures = (figDiameter * 2) + (figMargin * 2) + 16;
      const badgeAvailableW = Math.max(132, Math.min(w - 20, w - reservedForFigures));
      const badgeW = Math.min(500, badgeAvailableW);
      const badgeX = (w - badgeW) / 2;
      const badgeText = `${statusText} | ${tr("pdfDelta")} ${eur(absDiffDisp)}`;
      const badgeMaxFontSize = isNarrow ? 14 : (w < 560 ? 18 : 22);
      const badgeMinFontSize = isNarrow ? 10 : 10;
      const badgeInnerW = badgeW - 28;
      const badgeBaseHeight = isNarrow ? 42 : (w < 560 ? 48 : 54);

      let badgeFontSize = badgeMaxFontSize;
      let badgeProbe = new window.fabric.Textbox(badgeText, {
        width: badgeInnerW,
        fontSize: badgeFontSize,
        fontFamily: "Candara",
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 1.05
      });
      while (badgeProbe.height > (badgeBaseHeight - 8) && badgeFontSize > badgeMinFontSize) {
        badgeFontSize -= 1;
        badgeProbe = new window.fabric.Textbox(badgeText, {
          width: badgeInnerW,
          fontSize: badgeFontSize,
          fontFamily: "Candara",
          fontWeight: "700",
          textAlign: "center",
          lineHeight: 1.05
        });
      }

      addOutcomeFigure(figMargin, figTop, 1, roleForSpouse(1));
      addOutcomeFigure(w - figMargin - figDiameter, figTop, 2, roleForSpouse(2));
      const badgeHeight = Math.max(badgeBaseHeight, Math.ceil(badgeProbe.height) + 10);
      fc.add(new window.fabric.Rect({
        left: badgeX,
        top: 20,
        width: badgeW,
        height: badgeHeight,
        rx: 18,
        ry: 18,
        fill: diffDisp === 0
          ? grad(badgeX, 20, badgeX, 20 + badgeHeight, [{ offset: 0, color: "#ffffff" }, { offset: 1, color: "#d6ebe6" }])
          : (diffDisp > 0
              ? grad(badgeX, 20, badgeX, 20 + badgeHeight, [{ offset: 0, color: "#f4fffc" }, { offset: 1, color: "#a9ddd2" }])
              : grad(badgeX, 20, badgeX, 20 + badgeHeight, [{ offset: 0, color: "#fffaf0" }, { offset: 1, color: "#f1cd93" }])
            ),
        stroke: diffDisp === 0 ? "#98b8b3" : (diffDisp > 0 ? "#7bbdb0" : "#d4a864"),
        strokeWidth: 1.4,
        shadow: "0 4px 10px rgba(0,0,0,0.12)"
      }));
      fc.add(new window.fabric.Textbox(badgeText, {
        left: badgeX + (badgeW / 2),
        top: 20 + ((badgeHeight - badgeProbe.height) / 2),
        width: badgeInnerW,
        originX: "center",
        textAlign: "center",
        lineHeight: 1.05,
        fontSize: badgeFontSize,
        fill: diffDisp === 0 ? "#355a57" : (diffDisp > 0 ? "#0e655f" : "#85520c"),
        fontFamily: "Candara",
        fontWeight: "700"
      }));

      const trackLeft = 16;
      const trackWidth = w - 32;

      fc.add(new window.fabric.Rect({
        left: trackLeft,
        top: centerY - 9,
        width: trackWidth,
        height: 18,
        rx: 9,
        ry: 9,
        fill: "#e5efec"
      }));

      fc.add(new window.fabric.Rect({
        left: trackLeft,
        top: centerY - 9,
        width: trackWidth / 2,
        height: 18,
        rx: 9,
        ry: 9,
        fill: grad(trackLeft, centerY - 9, trackLeft + (trackWidth / 2), centerY + 9, [
          { offset: 0, color: "#bfe9df" },
          { offset: 1, color: "#6ec0b0" }
        ])
      }));
      fc.add(new window.fabric.Rect({
        left: centerX,
        top: centerY - 9,
        width: trackWidth / 2,
        height: 18,
        rx: 9,
        ry: 9,
        fill: grad(centerX, centerY - 9, centerX + (trackWidth / 2), centerY + 9, [
          { offset: 0, color: "#f2d8ab" },
          { offset: 1, color: "#deaa59" }
        ])
      }));

      fc.add(new window.fabric.Rect({
        left: centerX - 1,
        top: centerY - 16,
        width: 2,
        height: 32,
        fill: "#98b9b2"
      }));

      fc.add(new window.fabric.Circle({
        left: pointerX - 16,
        top: centerY - 16,
        radius: 16,
        fill: diffDisp >= 0 ? "rgba(11, 110, 102, 0.18)" : "rgba(199, 122, 17, 0.22)",
        selectable: false
      }));

      fc.add(new window.fabric.Circle({
        left: pointerX - 12,
        top: centerY - 12,
        radius: 12,
        fill: diffDisp >= 0
          ? grad(pointerX - 12, centerY - 12, pointerX - 12, centerY + 12, [{ offset: 0, color: "#1a8f85" }, { offset: 1, color: "#0b6e66" }])
          : grad(pointerX - 12, centerY - 12, pointerX - 12, centerY + 12, [{ offset: 0, color: "#e39b35" }, { offset: 1, color: "#c77a11" }]),
        stroke: "#ffffff",
        strokeWidth: 3,
        shadow: "0 2px 7px rgba(0,0,0,0.24)"
      }));

      // Side labels: names below bar; effective days shown inside each gradient bar half.
      const sideLabelTop = centerY + 22;
      const sideLabelMaxW = Math.max(58, trackWidth / 2 - 34);
      const sideBaseFont = 13;
      const sideFontFamily = "Candara";
      const sideFontWeight = "700";

      const leftName = c1n();
      const rightName = c2n();
      const days1 = Math.round((m.perm1 / 100) * 30 * 10) / 10;
      const days2 = Math.round((m.perm2 / 100) * 30 * 10) / 10;
      const fmtDays = (v) => Number.isInteger(v) ? String(v) : v.toFixed(1);
      const daysSuffix = tr("langDaysSuffix");

      const leftProbe = new window.fabric.Text(leftName, {
        fontSize: sideBaseFont,
        fontFamily: sideFontFamily,
        fontWeight: sideFontWeight
      });
      const leftFont = leftProbe.width <= sideLabelMaxW
        ? sideBaseFont
        : Math.max(10, Math.floor(sideBaseFont * sideLabelMaxW / leftProbe.width));

      const rightProbe = new window.fabric.Text(rightName, {
        fontSize: sideBaseFont,
        fontFamily: sideFontFamily,
        fontWeight: sideFontWeight
      });
      const rightFont = rightProbe.width <= sideLabelMaxW
        ? sideBaseFont
        : Math.max(10, Math.floor(sideBaseFont * sideLabelMaxW / rightProbe.width));

      // Days count centered inside each colored half — pill background + dark text for legibility.
      const daysStr1 = fmtDays(days1) + " " + daysSuffix;
      const daysStr2 = fmtDays(days2) + " " + daysSuffix;
      const daysProbeLeft = new window.fabric.Text(daysStr1, { fontSize: 12, fontFamily: sideFontFamily, fontWeight: "700" });
      const daysProbeRight = new window.fabric.Text(daysStr2, { fontSize: 12, fontFamily: sideFontFamily, fontWeight: "700" });
      const pillW1 = Math.max(38, daysProbeLeft.width + 14);
      const pillW2 = Math.max(38, daysProbeRight.width + 14);
      fc.add(new window.fabric.Rect({
        left: trackLeft + trackWidth / 4,
        top: centerY,
        originX: "center",
        originY: "center",
        width: pillW1,
        height: 18,
        rx: 9,
        ry: 9,
        fill: "rgba(255,255,255,0.65)",
        selectable: false
      }));
      fc.add(new window.fabric.Text(daysStr1, {
        left: trackLeft + trackWidth / 4,
        top: centerY,
        originX: "center",
        originY: "center",
        fontSize: 12,
        fill: "#0c4e49",
        fontFamily: sideFontFamily,
        fontWeight: "700"
      }));
      fc.add(new window.fabric.Rect({
        left: trackLeft + (trackWidth * 3 / 4),
        top: centerY,
        originX: "center",
        originY: "center",
        width: pillW2,
        height: 18,
        rx: 9,
        ry: 9,
        fill: "rgba(255,255,255,0.65)",
        selectable: false
      }));
      fc.add(new window.fabric.Text(daysStr2, {
        left: trackLeft + (trackWidth * 3 / 4),
        top: centerY,
        originX: "center",
        originY: "center",
        fontSize: 12,
        fill: "#7c4b09",
        fontFamily: sideFontFamily,
        fontWeight: "700"
      }));

      // Name labels below bar.
      fc.add(new window.fabric.Text(leftName, {
        left: trackLeft,
        top: sideLabelTop,
        originX: "left",
        fontSize: leftFont,
        fill: "#0f4e49",
        fontFamily: sideFontFamily,
        fontWeight: sideFontWeight
      }));
      fc.add(new window.fabric.Text(rightName, {
        left: trackLeft + trackWidth,
        top: sideLabelTop,
        originX: "right",
        fontSize: rightFont,
        fill: "#7c4b09",
        fontFamily: sideFontFamily,
        fontWeight: sideFontWeight
      }));

      fc.renderAll();
    }

    function saveCurrentScenario() {
      if (scenarioLab.length >= SCENARIO_LAB_MAX) {
        alert(tr("scenarioLabMaxReached"));
        return;
      }
      const label = SCENARIO_LABELS[scenarioLab.length];
      const payload = collectCalculationPayload();
      payload._nome1 = c1n();
      payload._nome2 = c2n();
      payload._permanenceCalendar = exportPermanenceCalendarState();
      const model = computeModelLocal(payload);
      scenarioLab.push({ label, payload, model });
      selectedScenarioIdx = scenarioLab.length - 1;
      renderScenarioLab();
    }

    function applyScenarioSelection(idx) {
      const scenario = scenarioLab[idx];
      if (!scenario || !scenario.payload) return;
      const payload = scenario.payload;
      selectedScenarioIdx = idx;

      const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = value;
      };

      setVal("nome1", payload._nome1 || c1n());
      setVal("nome2", payload._nome2 || c2n());
      setVal("incomeMode", payload.incomeMode || "monthly");

      const profileEl = document.getElementById("calcProfile");
      if (profileEl) {
        profileEl.value = resolveCalcProfileIdFromState({
          calcProfile: payload.calcProfile,
          normProfile: payload.normProfile,
          calcMode: payload.mode
        });
      }

      setVal("reddito1", Number(payload.r1Raw || 0));
      setVal("reddito2", Number(payload.r2Raw || 0));
      setVal("numFigli", Math.max(1, Math.round(Number(payload.figli || 1))));
      setVal("perm1", Math.min(100, Math.max(0, Number(payload.perm1 || 0))));
      setVal("simplePerc", Math.min(100, Math.max(0, Number(payload.simplePerc || 0))));
      setVal("assegnoPercepito1", Number(payload.aPerc1 || 0));
      setVal("assegnoPagato1", Number(payload.aPag1 || 0));
      setVal("assegnoFam1", Number(payload.aFam1 || 0));
      setVal("assegnoPercepito2", Number(payload.aPerc2 || 0));
      setVal("assegnoPagato2", Number(payload.aPag2 || 0));
      setVal("assegnoFam2", Number(payload.aFam2 || 0));
      setVal("straordAnn1", Number(payload.straordAnn1 || 0));
      setVal("straordAnn2", Number(payload.straordAnn2 || 0));

      const c1Spese = Array.isArray(payload.c1Spese) ? payload.c1Spese : [];
      const c2Spese = Array.isArray(payload.c2Spese) ? payload.c2Spese : [];
      const c1SpeseDetails = Array.isArray(payload.c1SpeseDetails) ? payload.c1SpeseDetails : [];
      const c2SpeseDetails = Array.isArray(payload.c2SpeseDetails) ? payload.c2SpeseDetails : [];
      expenseItems.forEach((_, i) => {
        const c1 = document.getElementById(`c1_${i}`);
        const c2 = document.getElementById(`c2_${i}`);
        const d1 = document.getElementById(`c1d_${i}`);
        const d2 = document.getElementById(`c2d_${i}`);
        if (c1) c1.value = Number(c1Spese[i] || 0);
        if (c2) c2.value = Number(c2Spese[i] || 0);
        if (d1) d1.value = String(c1SpeseDetails[i] || "");
        if (d2) d2.value = String(c2SpeseDetails[i] || "");
      });
      refreshExpenseDetailButtonState();

      incomeModeLast = document.getElementById("incomeMode")?.value || "monthly";
      incomeValuesByMode[incomeModeLast] = {
        r1: num("reddito1"),
        r2: num("reddito2")
      };

      updateSpouseLabels();
      if (payload._permanenceCalendar && typeof payload._permanenceCalendar === "object") {
        importPermanenceCalendarState(payload._permanenceCalendar);
        syncPermanenza("calendar");
      } else {
        // Backward compatibility with older scenarios without calendar snapshot.
        syncPermanenza("perm1");
      }
      updateModeUi();
      renderAll();
      triggerScenarioTransitionAnimation();
    }

    function triggerScenarioTransitionAnimation() {
      const targets = [
        document.querySelector(".grid > .card:nth-child(1)"),
        document.querySelector(".grid > .card:nth-child(2)")
      ].filter(Boolean);
      if (!targets.length) return;

      targets.forEach((el) => el.classList.remove("scenario-transition-flash"));
      void document.body.offsetWidth;
      targets.forEach((el) => el.classList.add("scenario-transition-flash"));

      if (scenarioTransitionTimer) {
        clearTimeout(scenarioTransitionTimer);
      }
      scenarioTransitionTimer = setTimeout(() => {
        targets.forEach((el) => el.classList.remove("scenario-transition-flash"));
        scenarioTransitionTimer = null;
      }, 520);
    }

    function removeScenario(idx) {
      scenarioLab.splice(idx, 1);
      if (selectedScenarioIdx === idx) {
        selectedScenarioIdx = -1;
      } else if (selectedScenarioIdx > idx) {
        selectedScenarioIdx -= 1;
      }
      scenarioLab.forEach((s, i) => { s.label = SCENARIO_LABELS[i]; });
      if (selectedScenarioIdx >= scenarioLab.length) selectedScenarioIdx = -1;
      renderScenarioLab();
    }

    function renderScenarioLab() {
      const body = document.getElementById("scenarioLabBody");
      if (!body) return;

      if (scenarioLab.length === 0) {
        body.innerHTML = `<p class="note scenario-lab-empty">${tr("scenarioLabEmpty")}</p>`;
        return;
      }

      const hasMultiple = scenarioLab.length > 1;
      const currentName1 = escapeHtml(c1n());
      const currentName2 = escapeHtml(c2n());
      const metrics = [
        { label: () => tr("scenarioColMode"),    fmt: (m) => escapeHtml(getModeName(m.mode, m.simplePerc)), numeric: false },
        { label: () => tr("scenarioColAssegno"), fmt: (m) => eur(Math.max(m.assegnoDa1a2, m.assegnoDa2a1)), numeric: true,  val: (m) => Math.max(m.assegnoDa1a2, m.assegnoDa2a1) },
        { label: () => `${escapeHtml(tr("scenarioColDisp1")).replace("C1", currentName1)}`, fmt: (m) => eur(m.disp1), numeric: true, val: (m) => m.disp1 },
        { label: () => `${escapeHtml(tr("scenarioColDisp2")).replace("C2", currentName2)}`, fmt: (m) => eur(m.disp2), numeric: true, val: (m) => m.disp2 },
        { label: () => `${escapeHtml(tr("scenarioColPost1")).replace("C1", currentName1)}`, fmt: (m) => eur(m.post1), numeric: true, val: (m) => m.post1 },
        { label: () => `${escapeHtml(tr("scenarioColPost2")).replace("C2", currentName2)}`, fmt: (m) => eur(m.post2), numeric: true, val: (m) => m.post2 },
        { label: () => tr("scenarioColFabb"),    fmt: (m) => eur(m.fabbisognoFigli), numeric: true,  val: (m) => m.fabbisognoFigli }
      ];

      let headerRow = `<tr><th class="metric-label">${tr("scenarioColMetric")}</th>`;
      scenarioLab.forEach((s, si) => {
        const n1 = escapeHtml(s.payload._nome1 || tr("spouse1Default"));
        const n2 = escapeHtml(s.payload._nome2 || tr("spouse2Default"));
        const isSelected = si === selectedScenarioIdx;
        const selectedFlag = isSelected
          ? `<span class="scenario-selected-flag" title="${escapeHtml(tr("scenarioLabSelectedFlag"))}" aria-label="${escapeHtml(tr("scenarioLabSelectedFlag"))}">&#10003;</span>`
          : "";
        const selectLabel = isSelected ? tr("scenarioLabSelectedBtn") : tr("scenarioLabSelectBtn");
        const selectClass = isSelected ? "btn-primary scenario-select-btn is-selected" : "btn-secondary scenario-select-btn";
        headerRow += `<th class="scenario-col-head ${isSelected ? "is-selected" : ""}"><span class="scenario-badge">Sc ${escapeHtml(s.label)}${selectedFlag}</span><br><small>${n1} / ${n2}</small><br><div class="scenario-col-actions"><button class="${selectClass}" data-scenario-select-idx="${si}" type="button">${escapeHtml(selectLabel)}</button><button class="btn-secondary scenario-remove-btn" data-scenario-idx="${si}" type="button">${tr("scenarioLabRemoveBtn")}</button></div></th>`;
        if (hasMultiple && si > 0) {
          headerRow += `<th class="delta-col-head">${tr("scenarioDeltaLabel")} ${escapeHtml(s.label)}</th>`;
        }
      });
      headerRow += `</tr>`;

      let dataRows = "";
      metrics.forEach((metric) => {
        dataRows += `<tr><td class="metric-label">${metric.label()}</td>`;
        scenarioLab.forEach((s, si) => {
          const m = s.model;
          dataRows += `<td class="scenario-val ${si === selectedScenarioIdx ? "scenario-val-selected" : ""}">${metric.fmt(m)}</td>`;
          if (hasMultiple && si > 0) {
            if (metric.numeric) {
              const diff = metric.val(m) - metric.val(scenarioLab[0].model);
              const sign = diff > 0.005 ? "+" : "";
              const cls = diff > 0.005 ? "delta-pos" : diff < -0.005 ? "delta-neg" : "delta-zero";
              dataRows += `<td class="delta-col ${cls}">${sign}${eur(diff)}</td>`;
            } else {
              dataRows += `<td class="delta-col delta-zero">&ndash;</td>`;
            }
          }
        });
        dataRows += `</tr>`;
      });

      body.innerHTML = `
        <div class="scenario-table-wrap">
          <table class="scenario-table">
            <thead>${headerRow}</thead>
            <tbody>${dataRows}</tbody>
          </table>
        </div>
      `;
    }

    function renderSpiegabilita(m) {
      const panel = document.getElementById("spiegPanel");
      if (!panel) return;

      const peso1Pct = (m.peso1 * 100).toFixed(1);
      const peso2Pct = (m.peso2 * 100).toFixed(1);
      const days1 = ((m.perm1 / 100) * 30).toFixed(1);
      const days2 = ((m.perm2 / 100) * 30).toFixed(1);
      const isAssegno1 = m.assegnoDa1a2 > 0.005;
      const isAssegno2 = m.assegnoDa2a1 > 0.005;
      const n1 = escapeHtml(c1n());
      const n2 = escapeHtml(c2n());
      const tooltipLabel = escapeHtml(tr("spiegTooltipTrigger"));
      const infoTip = (text) => {
        const safeText = escapeHtml(text);
        return `<span class="spieg-help-wrap"><button type="button" class="spieg-help-btn" aria-label="${tooltipLabel}">i</button><span class="spieg-help-tip">${safeText}</span></span>`;
      };

      let resultHtml;
      let resultDetail;
      if (isAssegno1) {
        resultHtml = `
          <div class="spieg-result-flow">${n1} &rarr; ${n2}</div>
          <div class="spieg-result-formula">${n1}: ${eur(m.quotaTeorica1)} &minus; ${eur(m.quotaDiretta1)}</div>
          <div class="spieg-result-amount ok">${eur(m.assegnoDa1a2)}</div>
        `;
        resultDetail = tr("spiegDetailResultTransfer");
      } else if (isAssegno2) {
        resultHtml = `
          <div class="spieg-result-flow">${n2} &rarr; ${n1}</div>
          <div class="spieg-result-formula">${n2}: ${eur(m.quotaTeorica2)} &minus; ${eur(m.quotaDiretta2)}</div>
          <div class="spieg-result-amount ok">${eur(m.assegnoDa2a1)}</div>
        `;
        resultDetail = tr("spiegDetailResultTransfer");
      } else {
        resultHtml = `<div class="spieg-result-empty ok">${tr("calcNoTransferSuggested")}</div>`;
        resultDetail = tr("spiegDetailResultNoTransfer");
      }

      panel.innerHTML = `
        <details class="spieg-details" id="spiegDetails" ${uiViewState.spiegOpen ? "open" : ""}>
          <summary class="spieg-title">${tr("spiegTitle")}</summary>
          <div class="spieg-grid">
            <div class="spieg-item">
              <div class="spieg-item-label"><span class="spieg-item-icon" aria-hidden="true">&#128184;</span>${tr("spiegRedditiLabel")} ${infoTip(tr("spiegDetailIncome"))}</div>
              <div class="spieg-item-body">
                <div class="spieg-people">
                  <div class="spieg-person spieg-person--left">
                    <div class="spieg-person-name">${n1}</div>
                    <div class="spieg-person-value">${eur(m.disp1)}</div>
                    <div class="spieg-person-sub">${tr("pdfWeight")}: ${peso1Pct}%</div>
                  </div>
                  <div class="spieg-person spieg-person--right">
                    <div class="spieg-person-name">${n2}</div>
                    <div class="spieg-person-value">${eur(m.disp2)}</div>
                    <div class="spieg-person-sub">${tr("pdfWeight")}: ${peso2Pct}%</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="spieg-item">
              <div class="spieg-item-label"><span class="spieg-item-icon" aria-hidden="true">&#128221;</span>${tr("spiegSpeseLabel")} ${infoTip(tr("spiegDetailExpense"))}</div>
              <div class="spieg-item-body">
                <div class="spieg-equation">
                  <span class="spieg-pill">${eur(m.speseTot)}</span>
                  <span class="spieg-op">&times;</span>
                  <span class="spieg-pill">35%</span>
                  <span class="spieg-op">=</span>
                  <span class="spieg-pill spieg-pill--result">${eur(m.fabbisognoFigli)}</span>
                </div>
              </div>
            </div>
            <div class="spieg-item">
              <div class="spieg-item-label"><span class="spieg-item-icon" aria-hidden="true">&#128197;</span>${tr("spiegPermLabel")} ${infoTip(tr("spiegDetailPerm"))}</div>
              <div class="spieg-item-body">
                <div class="spieg-line spieg-line--kv"><span class="spieg-k">${n1}</span><span class="spieg-v">${m.perm1.toFixed(0)}% (${days1} ${tr("langDaysSuffix")}) &rarr; ${eur(m.quotaDiretta1)}</span></div>
                <div class="spieg-line spieg-line--kv"><span class="spieg-k">${n2}</span><span class="spieg-v">${m.perm2.toFixed(0)}% (${days2} ${tr("langDaysSuffix")}) &rarr; ${eur(m.quotaDiretta2)}</span></div>
              </div>
            </div>
            <div class="spieg-item spieg-item--result">
              <div class="spieg-item-label"><span class="spieg-item-icon" aria-hidden="true">&#127919;</span>${tr("spiegResultLabel")} ${infoTip(resultDetail)}</div>
              <div class="spieg-item-body spieg-item-body--result">${resultHtml}</div>
            </div>
          </div>
        </details>
      `;
      const spiegDetailsEl = panel.querySelector("#spiegDetails");
      if (spiegDetailsEl) {
        spiegDetailsEl.addEventListener("toggle", () => {
          uiViewState.spiegOpen = !!spiegDetailsEl.open;
        });
      }
    }

    function getModeName(mode, simplePerc) {
      if (mode === "legal") return tr("calcModeLegalName");
      if (mode === "simple") return msg("calcModeSimpleName", { perc: simplePerc.toFixed(0) });
      return tr("calcModeGenovaName");
    }

    function calculate(model = null) {
      const m = model || computeModel();
      const formulaNote = document.getElementById("formulaNote");
      const resultMain = document.getElementById("risultatoMain");
      const kpi = document.getElementById("kpi");
      if (!formulaNote || !resultMain || !kpi) return;

      const modeName = getModeName(m.mode, m.simplePerc);
      const normProfileName = escapeHtml(getSelectedNormProfileLabel());
      const negotiationPayerName = m.assegnoDa1a2 > 0.005 ? c1n() : (m.assegnoDa2a1 > 0.005 ? c2n() : c1n());
      const negotiationReceiverName = m.assegnoDa1a2 > 0.005 ? c2n() : (m.assegnoDa2a1 > 0.005 ? c1n() : c2n());

      let modeSpecific = "";
      if (m.mode === "simple") {
        modeSpecific = `
          <br /><strong>${tr("calcSimpleRuleTitle")}</strong>
          <br />${msg("calcSimpleRule1", { value: eur(Math.abs(m.disp1 - m.disp2)) })}
          <br />${msg("calcSimpleRule2", { perc: m.simplePerc.toFixed(0) })}
          <br />${tr("calcSimpleRule3")}
        `;
      } else if (m.mode === "genova") {
        const nonColl = m.collocatario === 1 ? 2 : 1;
        modeSpecific = `
          <br /><strong>${tr("calcGenovaRuleTitle")}</strong>
          <br />${msg("calcGenovaRule1", { coll: m.collocatario })}
          <br />${msg("calcGenovaRule2", { nonColl })}
          <br />${msg("calcGenovaRule3", { value: eur(m.costoGiornalieroFiglio) })}
          <br />${tr("calcGenovaRule4")}
          <br />${tr("calcGenovaRule5")}
        `;
      } else {
        modeSpecific = `
          <br /><strong>${tr("calcLegalRuleTitle")}</strong>
          <br />${tr("calcLegalRule1")}
          <br />${tr("calcLegalRule2")}
          <br />${tr("calcLegalRule3")}
          <br />${tr("calcLegalRule4")}
        `;
      }

      formulaNote.innerHTML = `
        <strong>${tr("calcGeneralTitle")}</strong>
        <br />${tr("calcActiveMode")}: ${modeName}.
        <br />${tr("calcGeneral1")}
        <br />${tr("calcGeneral2")}
        <br />${tr("calcGeneral3")}
        <br />${tr("calcGeneral4")}

        <br /><strong>${tr("calcInputMeaningTitle")}</strong>
        <br />${tr("calcInput1")}
        <br />${tr("calcInput2")}
        <br />${tr("calcInput3")}
        <br />${tr("calcInput4")}
        <br />${tr("calcInput5")}
        <br />${tr("calcInput6")}

        <br /><strong>${tr("calcKpiReadTitle")}</strong>
        <br />${tr("calcKpi1")}
        <br />${tr("calcKpi2")}
        <br />${tr("calcKpi3")}
        <br />${tr("calcKpi4")}
        <br />${tr("calcKpi5")}
        <br />${tr("calcKpi6")}

        ${modeSpecific}
        ${m.incomeMode === "annual" ? `<br /><strong>${tr("calcIncomeBaseNote")}</strong> ${tr("calcIncomeBaseNoteText")}` : ""}
        ${m.incomeMode === "cu" ? `<br /><strong>${tr("calcIncomeBaseNote")}</strong> ${tr("cuNetNoteText")}` : ""}
      `;

      let mainText = tr("calcNoTransferSuggested");
      if (m.assegnoDa1a2 > 0.005) {
        mainText = `${c1n()} \u2192 ${c2n()}: ${eur(m.assegnoDa1a2)} ${tr("pdfPerMonth")}`;
      } else if (m.assegnoDa2a1 > 0.005) {
        mainText = `${c2n()} \u2192 ${c1n()}: ${eur(m.assegnoDa2a1)} ${tr("pdfPerMonth")}`;
      }
      resultMain.textContent = mainText;

      kpi.innerHTML = "";

      const items = [
        [tr("kpiActiveMode"), modeName, "warn"],
        [tr("kpiIncomeBase"), m.incomeMode === "annual" ? tr("kpiIncomeBaseAnnual") : m.incomeMode === "cu" ? tr("kpiIncomeBaseCu") : tr("kpiIncomeBaseMonthly"), "warn"],
        [`${tr("pdfNetAvailable")} ${c1n()}`, eur(m.disp1), m.disp1 >= 0 ? "ok" : "bad"],
        [`${tr("pdfNetAvailable")} ${c2n()}`, eur(m.disp2), m.disp2 >= 0 ? "ok" : "bad"],
        [tr("liveTotalExpensesEntered"), eur(m.speseTot), "warn"],
        [tr("pdfEstimatedChildrenNeeds"), eur(m.fabbisognoFigli), "warn"],
        [`${tr("pdfTheoreticalShare")} ${c1n()}`, eur(m.quotaTeorica1), "ok"],
        [`${tr("pdfTheoreticalShare")} ${c2n()}`, eur(m.quotaTeorica2), "ok"],
        [`${tr("pdfPostSupport")} ${c1n()}`, eur(m.post1), m.post1 >= 0 ? "ok" : "bad"],
        [`${tr("pdfPostSupport")} ${c2n()}`, eur(m.post2), m.post2 >= 0 ? "ok" : "bad"],
        [tr("pdfAmountPerChild"), eur((Math.max(m.assegnoDa1a2, m.assegnoDa2a1)) / m.figli), "warn"]
      ];

      if (m.incomeMode === "cu") {
        const ratio1 = m.r1Raw > 0 ? ((m.r1 * 12 / m.r1Raw) * 100) : 0;
        const ratio2 = m.r2Raw > 0 ? ((m.r2 * 12 / m.r2Raw) * 100) : 0;
        const fmtRatio = (v) => `${v.toFixed(1)}%`;
        items.splice(2, 0,
          [msg("kpiCuNetGrossRatioSpouse", { spouse: c1n() }), fmtRatio(ratio1), "warn"],
          [msg("kpiCuNetGrossRatioSpouse", { spouse: c2n() }), fmtRatio(ratio2), "warn"]
        );
      }

      items.forEach(([label, value, cls]) => {
        const el = document.createElement("div");
        el.className = "kpi-item";
        el.innerHTML = `<span>${label}</span><strong class="${cls}">${value}</strong>`;
        kpi.appendChild(el);
      });
    }

    function renderAll() {
      const m = computeModel();
      updateExtraordinaryModuleUi();
      updateExpensePartials();
      renderLivePanel(m);
      calculate(m);
      renderSpiegabilita(m);
      renderScenarioLab();
    }

    function applyState(state) {
      hydrateState(state);
      incomeModeLast = document.getElementById("incomeMode").value || "monthly";
      incomeValuesByMode[incomeModeLast] = {
        r1: num("reddito1"),
        r2: num("reddito2")
      };
      updateModeUi();
      renderAll();
    }

    function exportPdfDirect() {
      const m = computeModel();
      const now = new Date();
      const genDate = now.toLocaleDateString(getCurrentLocale(), { day: "2-digit", month: "long", year: "numeric" });
      const genTime = now.toLocaleTimeString(getCurrentLocale(), { hour: "2-digit", minute: "2-digit" });
      const c1Name = c1n();
      const c2Name = c2n();
      const c1NameEsc = escapeHtml(c1Name);
      const c2NameEsc = escapeHtml(c2Name);

      const pdfLang = currentLang === "en" ? "en" : "it";

      const modeName = getModeName(m.mode, m.simplePerc);
      const normProfileName = escapeHtml(getSelectedNormProfileLabel());
      const negotiationPayerName = m.assegnoDa1a2 > 0.005 ? c1Name : (m.assegnoDa2a1 > 0.005 ? c2Name : c1Name);
      const negotiationReceiverName = m.assegnoDa1a2 > 0.005 ? c2Name : (m.assegnoDa2a1 > 0.005 ? c1Name : c2Name);

      let assegnoText = tr("pdfNoTransfer");
      let assegnoDir = "";
      if (m.assegnoDa1a2 > 0.005) {
        assegnoText = eur(m.assegnoDa1a2) + " " + tr("pdfPerMonth");
        assegnoDir = `${c1NameEsc} &rarr; ${c2NameEsc}`;
      } else if (m.assegnoDa2a1 > 0.005) {
        assegnoText = eur(m.assegnoDa2a1) + " " + tr("pdfPerMonth");
        assegnoDir = `${c2NameEsc} &rarr; ${c1NameEsc}`;
      }

      const peso1Pct = (m.peso1 * 100).toFixed(1);
      const peso2Pct = (m.peso2 * 100).toFixed(1);
      const days1 = ((m.perm1 / 100) * 30).toFixed(1);
      const days2 = ((m.perm2 / 100) * 30).toFixed(1);

      let explainResultHtml = `<div class="pdf-explain-result-empty">${tr("calcNoTransferSuggested")}</div>`;
      if (m.assegnoDa1a2 > 0.005) {
        explainResultHtml = `
          <div class="pdf-explain-flow">${c1NameEsc} &rarr; ${c2NameEsc}</div>
          <div class="pdf-explain-formula">${c1NameEsc}: ${eur(m.quotaTeorica1)} &minus; ${eur(m.quotaDiretta1)}</div>
          <div class="pdf-explain-amount">${eur(m.assegnoDa1a2)}</div>
        `;
      } else if (m.assegnoDa2a1 > 0.005) {
        explainResultHtml = `
          <div class="pdf-explain-flow">${c2NameEsc} &rarr; ${c1NameEsc}</div>
          <div class="pdf-explain-formula">${c2NameEsc}: ${eur(m.quotaTeorica2)} &minus; ${eur(m.quotaDiretta2)}</div>
          <div class="pdf-explain-amount">${eur(m.assegnoDa2a1)}</div>
        `;
      }

      const extraSpese1Monthly = getExtraordinaryMonthly(1);
      const extraSpese2Monthly = getExtraordinaryMonthly(2);
      const formatExpenseDetail = (idx, spouseKey) => {
        const el = document.getElementById(`${spouseKey}d_${idx}`);
        const raw = String(el && el.value ? el.value : "").trim();
        if (!raw) return "";
        return raw;
      };
      const speseRowsBase = expenseItems.map((item, i) => {
        const c1 = num(`c1_${i}`);
        const c2 = num(`c2_${i}`);
        const d1 = formatExpenseDetail(i, "c1");
        const d2 = formatExpenseDetail(i, "c2");
        const details = [
          d1 ? `${escapeHtml(c1n())}: ${escapeHtml(d1)}` : "",
          d2 ? `${escapeHtml(c2n())}: ${escapeHtml(d2)}` : ""
        ].filter(Boolean).join("<br>");
        return `<tr>
          <td>${item.label}</td>
          <td class="num">${c1 > 0 ? eur(c1) : "–"}</td>
          <td class="num">${c2 > 0 ? eur(c2) : "–"}</td>
          <td class="num bold">${(c1 + c2) > 0 ? eur(c1 + c2) : "–"}</td>
          <td class="expense-detail-cell">${details || "–"}</td>
        </tr>`;
      }).join("");
      const extraSpeseRow = (extraSpese1Monthly > 0 || extraSpese2Monthly > 0)
        ? `<tr>
          <td>${tr("pdfExtraordinaryRow")}</td>
          <td class="num">${extraSpese1Monthly > 0 ? eur(extraSpese1Monthly) : "–"}</td>
          <td class="num">${extraSpese2Monthly > 0 ? eur(extraSpese2Monthly) : "–"}</td>
          <td class="num bold">${eur(extraSpese1Monthly + extraSpese2Monthly)}</td>
          <td class="expense-detail-cell">–</td>
        </tr>`
        : "";
      const speseRows = speseRowsBase + extraSpeseRow;

      const scenarioMetrics = [
        { label: tr("scenarioColMode"), val: (sm) => getModeName(sm.mode, sm.simplePerc), fmt: (v) => escapeHtml(v), numeric: false },
        { label: tr("scenarioColAssegno"), val: (sm) => Math.max(sm.assegnoDa1a2, sm.assegnoDa2a1), fmt: (v) => eur(v), numeric: true },
        { label: tr("scenarioColDisp1").replace("C1", c1Name), val: (sm) => sm.disp1, fmt: (v) => eur(v), numeric: true },
        { label: tr("scenarioColDisp2").replace("C2", c2Name), val: (sm) => sm.disp2, fmt: (v) => eur(v), numeric: true },
        { label: tr("scenarioColPost1").replace("C1", c1Name), val: (sm) => sm.post1, fmt: (v) => eur(v), numeric: true },
        { label: tr("scenarioColPost2").replace("C2", c2Name), val: (sm) => sm.post2, fmt: (v) => eur(v), numeric: true },
        { label: tr("scenarioColFabb"), val: (sm) => sm.fabbisognoFigli, fmt: (v) => eur(v), numeric: true }
      ];

      const scenarioPdfTable = (() => {
        if (!scenarioLab.length) return "";
        const isThreeScenarioLayout = scenarioLab.length >= 3;
        const truncateScenarioName = (raw) => {
          const value = String(raw || "").trim();
          const maxLen = isThreeScenarioLayout ? 11 : 24;
          if (value.length <= maxLen) return value;
          return `${value.slice(0, Math.max(3, maxLen - 3))}...`;
        };

        let headerCells = `<th class="metric-col">${tr("scenarioColMetric")}</th>`;
        scenarioLab.forEach((scenario, idx) => {
          const n1 = escapeHtml(truncateScenarioName(scenario.payload._nome1 || tr("spouse1Default")));
          const n2 = escapeHtml(truncateScenarioName(scenario.payload._nome2 || tr("spouse2Default")));
          headerCells += `<th class="scenario-col"><span class="scenario-chip">Sc ${escapeHtml(scenario.label)}</span><span class="scenario-sub">${n1} / ${n2}</span></th>`;
          if (idx > 0) {
            headerCells += `<th class="delta-col-head">${tr("scenarioDeltaLabel")} ${escapeHtml(scenario.label)}</th>`;
          }
        });

        const baseline = scenarioLab[0].model;
        const bodyRows = scenarioMetrics.map((metric) => {
          let row = `<tr><td class="metric-col">${escapeHtml(metric.label)}</td>`;
          scenarioLab.forEach((scenario, idx) => {
            const value = metric.val(scenario.model);
            row += `<td class="num">${metric.fmt(value)}</td>`;

            if (idx > 0) {
              if (metric.numeric) {
                const diff = value - metric.val(baseline);
                const cls = diff > 0.005 ? "delta-pos" : (diff < -0.005 ? "delta-neg" : "delta-zero");
                const sign = diff > 0.005 ? "+" : "";
                row += `<td class="num ${cls}">${sign}${eur(diff)}</td>`;
              } else {
                row += `<td class="num delta-zero">&ndash;</td>`;
              }
            }
          });
          row += `</tr>`;
          return row;
        }).join("");

        return `
          <div class="scenario-compare-wrap">
            <table class="scenario-compare-table${isThreeScenarioLayout ? " compact-3" : ""}">
              <thead><tr>${headerCells}</tr></thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>
        `;
      })();
      const negotiationRowsHtml = (() => {
        const baseAmount = Math.max(m.assegnoDa1a2, m.assegnoDa2a1);
        const payerIs1 = m.assegnoDa1a2 > 0.005;
        const payerName = payerIs1 ? c1NameEsc : c2NameEsc;
        const receiverName = payerIs1 ? c2NameEsc : c1NameEsc;

        if (baseAmount <= 0.005) {
          return `<tr>
            <td>${tr("pdfNegotiationNoTransfer")}</td>
            <td class="num">${eur(0)}</td>
            <td class="num">${eur(m.disp1)}</td>
            <td class="num">${eur(m.disp2)}</td>
          </tr>`;
        }

        const options = [
          { label: tr("pdfNegotiationLow"), factor: 0.9 },
          { label: tr("pdfNegotiationTarget"), factor: 1 },
          { label: tr("pdfNegotiationHigh"), factor: 1.1 }
        ];

        return options.map((opt) => {
          const amount = Math.round(baseAmount * opt.factor * 100) / 100;
          const payerPost = payerIs1 ? (m.disp1 - amount) : (m.disp2 - amount);
          const receiverPost = payerIs1 ? (m.disp2 + amount) : (m.disp1 + amount);
          return `<tr>
            <td>${escapeHtml(opt.label)}</td>
            <td class="num">${eur(amount)}</td>
            <td class="num">${eur(payerPost)}</td>
            <td class="num">${eur(receiverPost)}</td>
          </tr>`;
        }).join("");
      })();
      const scenarioSectionClass = scenarioLab.length >= 3
        ? "section scenario-section compact-3"
        : "section scenario-section";

      const html = `<!DOCTYPE html>
<html lang="${pdfLang}">
<head>
<meta charset="UTF-8"/>
<title>${tr("pdfReportTitle")} – ${genDate}</title>
<style>
  @page { size: A4 portrait; margin: 16mm 14mm 14mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #1a2e2a; background: #fff; }

  /* ── HEADER ── */
  .rpt-header { display: flex; align-items: flex-end; justify-content: space-between;
    border-bottom: 3px solid #0b6e66; padding-bottom: 8px; margin-bottom: 18px; }
  .rpt-title { font-size: 17pt; font-weight: 700; color: #0b6e66; letter-spacing: -0.4px; }
  .rpt-subtitle { font-size: 9pt; color: #4a7d77; margin-top: 3px; }
  .rpt-meta { text-align: right; font-size: 8pt; color: #777; line-height: 1.6; }

  /* ── RESULT BANNER ── */
  .banner { background: linear-gradient(135deg, #0b6e66 0%, #14b8a6 100%);
    color: #fff; border-radius: 8px; padding: 14px 18px; margin-bottom: 14px;
    display: flex; justify-content: space-between; align-items: center; }
  .banner-lbl { font-size: 8.5pt; opacity: 0.85; margin-bottom: 3px; }
  .banner-dir { font-size: 11pt; font-weight: 700; }
  .banner-amount { font-size: 22pt; font-weight: 700; text-align: right; }
  .banner-sub { font-size: 8pt; opacity: 0.8; text-align: right; margin-top: 2px; }

  /* ── LIVE PANEL ── */
  .live-panel { border: 1.5px solid rgba(167,198,191,0.6); border-radius: 12px;
    background: linear-gradient(160deg,#f4faf8,#eef7f4); padding: 12px 16px;
    margin-bottom: 16px; break-inside: avoid; }
  .live-panel-title { font-size: 8pt; font-weight: 700; color: #1a4e49;
    text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }
  .live-net-row { display: flex; gap: 10px; margin-bottom: 12px; }
  .live-net-card { flex: 1; background: #fff; border: 1.5px solid #b2d8d3;
    border-radius: 8px; padding: 8px 12px; }
  .live-net-label { font-size: 7.5pt; color: #506e6a; margin-bottom: 4px; }
  .live-net-value { font-size: 13pt; font-weight: 700; }
  .live-net-value.c1 { color: #0b6e66; }
  .live-net-value.c2 { color: #c77a11; }

  /* ── TRACK VISUALIZATION ── */
  .track-wrap { position: relative; padding: 0 56px; margin-bottom: 4px; }
  .track-figures { display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 4px; }
  .track-fig { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .fig-bubble { width: 46px; height: 46px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; }
  .fig-bubble.c1 { background: #e6f4f2; border: 2px solid #74c3b9; }
  .fig-bubble.c2 { background: #fef3e0; border: 2px solid #f0c36d; }
  .fig-label { font-size: 7.5pt; font-weight: 700; color: #506e6a; }
  .track-badge { flex: 1; text-align: center; padding: 0 10px 6px; }
  .track-badge-inner { display: inline-block; background: #fff;
    border: 2px solid #c9e6e1; border-radius: 20px;
    padding: 6px 14px; font-size: 10pt; font-weight: 700; color: #1a4e49;
    white-space: nowrap; }
  .track-bar-row { position: relative; height: 14px; border-radius: 7px; overflow: hidden;
    background: linear-gradient(to right, #74c3b9 0%, #74c3b9 50%, #f0c36d 50%, #f0c36d 100%); }
  .track-marker { position: absolute; top: 50%; transform: translate(-50%,-50%);
    width: 18px; height: 18px; border-radius: 50%;
    background: #c77a11; border: 3px solid #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.28); z-index: 2; }
  .track-labels { display: flex; justify-content: space-between;
    font-size: 7.5pt; color: #74c3b9; font-weight: 700; margin-top: 3px; }
  .track-labels span:last-child { color: #c77a11; }

  /* ── ASSEGNO PILL ── */
  .assegno-pill { background: #fff; border: 1.5px solid #b2d8d3; border-radius: 10px;
    padding: 8px 12px; margin-top: 10px; }
  .assegno-lbl { font-size: 7.5pt; color: #506e6a; margin-bottom: 3px; }
  .assegno-val { font-size: 12pt; font-weight: 700; color: #1a4e49; }

  /* ── SECTIONS ── */
  .section { margin-bottom: 16px; break-inside: avoid; }
  .section-title { font-size: 8.5pt; font-weight: 700; color: #0b6e66; text-transform: uppercase;
    letter-spacing: 0.6px; border-bottom: 1.5px solid #b2d8d3; padding-bottom: 4px; margin-bottom: 10px; }

  /* ── TABLES ── */
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th { background: #0b6e66; color: #fff; text-align: left; padding: 5px 8px;
    font-weight: 600; font-size: 8pt; }
  td { padding: 4px 8px; border-bottom: 1px solid #e5efed; vertical-align: top; }
  tr:nth-child(even) td { background: #f5faf9; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 700; }
  .total-row td { background: #ddf0ec !important; font-weight: 700; border-top: 1.5px solid #74c3b9; }

  /* ── TWO-COL LAYOUT ── */
  .two-col { display: grid; grid-template-columns: 1fr 1.85fr; gap: 14px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

  /* Bigger numbers in the financial data table (right column) */
  .data-table td.num { font-size: 11pt; font-weight: 600; color: #1a2e2a; }
  .data-table th { font-size: 8pt; }
  .data-table th.num { text-align: right; }

  /* ── BALANCE CARDS ── */
  .balance-row { display: flex; gap: 12px; margin-bottom: 16px; break-inside: avoid; }
  .bal-card { flex: 1; border-radius: 7px; padding: 10px 12px; border: 1.5px solid; }
  .bal-card.c1 { background: #eaf6f4; border-color: #74c3b9; }
  .bal-card.c2 { background: #fef9ec; border-color: #f0c36d; }
  .bal-card-title { font-size: 8pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; margin-bottom: 6px; }
  .bal-card.c1 .bal-card-title { color: #0b6e66; }
  .bal-card.c2 .bal-card-title { color: #c77a11; }
  .bal-line { display: flex; justify-content: space-between; font-size: 8.5pt;
    padding: 2.5px 0; border-bottom: 1px solid rgba(0,0,0,0.06); }
  .bal-line:last-child { border-bottom: none; font-weight: 700; padding-top: 5px; margin-top: 2px; }
  .bal-lbl { color: #4a7a74; }
  .bal-val { font-weight: 600; font-variant-numeric: tabular-nums; }
  .green { color: #0b6e66; }
  .red { color: #c0392b; }
  .orange { color: #c77a11; }

  /* ── KPI BOXES ── */
  .kpi-box { background: #f5faf9; border: 1.5px solid #b2d8d3; border-radius: 6px;
    padding: 8px 10px; break-inside: avoid; }
  .kpi-lbl { font-size: 7.5pt; color: #4a7d77; text-transform: uppercase; letter-spacing: 0.4px; }
  .kpi-val { font-size: 13pt; font-weight: 700; margin-top: 2px; }
  .kpi-val.ok { color: #0b6e66; }
  .kpi-val.warn { color: #c77a11; }
  .kpi-val.bad { color: #c0392b; }

  /* ── SCENARIO LAB ── */
  .scenario-compare-wrap { overflow-x: auto; }
  .scenario-compare-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  .scenario-compare-table th, .scenario-compare-table td { border: 1px solid #c6ddd8; padding: 5px 8px; }
  .scenario-compare-table thead th { background: linear-gradient(90deg,#f0f7f5,#e6f1ee); color: #183d39; font-weight: 700; }
  .scenario-compare-table .metric-col { text-align: left; min-width: 140px; font-weight: 700; background: #f6fbf9; }
  .scenario-compare-table .scenario-col { text-align: center; min-width: 170px; }
  .scenario-compare-table .delta-col-head { text-align: center; min-width: 86px; }
  .scenario-chip { display: inline-block; background: #0b6e66; color: #fff; border-radius: 5px; padding: 1px 8px; font-size: 7.5pt; font-weight: 700; }
  .scenario-sub { display: block; margin-top: 4px; font-size: 7.2pt; color: #4c6964; font-weight: 600; }
  .scenario-compare-table.compact-3 { table-layout: fixed; font-size: 7.3pt; }
  .scenario-compare-table.compact-3 th, .scenario-compare-table.compact-3 td { padding: 3px 4px; }
  .scenario-compare-table.compact-3 .metric-col,
  .scenario-compare-table.compact-3 .scenario-col,
  .scenario-compare-table.compact-3 .delta-col-head { min-width: 0; }
  .scenario-compare-table.compact-3 .metric-col { width: 24%; }
  .scenario-compare-table.compact-3 .scenario-col { width: 15%; }
  .scenario-compare-table.compact-3 .delta-col-head { width: 10.5%; }
  .scenario-compare-table.compact-3 .scenario-sub { font-size: 6.2pt; margin-top: 2px; line-height: 1.15; }
  .scenario-compare-table.compact-3 .scenario-chip { font-size: 6.4pt; padding: 1px 5px; }
  .scenario-compare-table.compact-3 .metric-col { font-size: 6.9pt; }
  .scenario-compare-table.compact-3 td { line-height: 1.08; }
  .scenario-compare-table.compact-3 td { word-break: break-word; }
  .section.scenario-section.compact-3 { margin-bottom: 10px; }
  .section.scenario-section.compact-3 .section-title { margin-bottom: 6px; }
  .delta-pos { color: #0b6e66; }
  .delta-neg { color: #c0392b; }
  .delta-zero { color: #6a7f7b; }

  /* ── EXPLAIN SECTION ── */
  .pdf-explain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pdf-explain-card { border: 1.5px solid #c9e2dd; border-radius: 8px; background: #f7fcfb; padding: 8px 10px; }
  .pdf-explain-card.result { grid-column: 1 / -1; background: #eaf7f1; border-color: #a9d4c0; }
  .pdf-explain-title { font-size: 8pt; font-weight: 700; color: #0e5c55; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
  .pdf-explain-line { font-size: 8.5pt; color: #254d48; margin-bottom: 3px; }
  .pdf-explain-line strong { color: #0b6e66; }
  .pdf-explain-equation { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .pdf-explain-pill { display: inline-flex; padding: 2px 8px; border-radius: 999px; border: 1px solid #bfdad1; background: #e8f3ef; color: #184a44; font-weight: 700; }
  .pdf-explain-pill.result { background: #dff3ea; border-color: #9dceb8; color: #0a6157; }
  .pdf-explain-op { font-weight: 700; color: #6d817c; }
  .pdf-explain-flow { font-size: 9pt; font-weight: 800; color: #0f6a61; margin-bottom: 4px; }
  .pdf-explain-formula { font-size: 8.5pt; color: #284e49; margin-bottom: 3px; }
  .pdf-explain-amount { font-size: 13pt; font-weight: 900; color: #0e6b62; }
  .pdf-explain-result-empty { font-size: 10pt; font-weight: 800; color: #0f6a61; }

  /* ── NOTE & FOOTER ── */
  .note-box { background: #f8fcfb; border-left: 3px solid #0b6e66;
    padding: 8px 12px; font-size: 8pt; color: #444; line-height: 1.6; }
  .note-box strong { color: #0b6e66; }
  .footer { border-top: 1px solid #cde5e0; padding-top: 6px; margin-top: 20px;
    font-size: 7.5pt; color: #888; text-align: center; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="rpt-header">
  <div>
    <div class="rpt-title">${tr("pdfAppTitle")}</div>
    <div class="rpt-subtitle">${tr("pdfAppSubtitle")}</div>
  </div>
  <div class="rpt-meta">${tr("pdfGeneratedOn")} ${genDate}<br/>${genTime}</div>
</div>

<!-- ASSEGNO BANNER -->
<div class="banner">
  ${assegnoDir ? `
  <div>
    <div class="banner-lbl">${tr("pdfBannerLbl")}</div>
    <div class="banner-dir">${assegnoDir}</div>
  </div>
  <div>
    <div class="banner-amount">${assegnoText}</div>
    ${m.figli > 1 ? `<div class="banner-sub">${eur(Math.max(m.assegnoDa1a2, m.assegnoDa2a1) / m.figli)} ${tr("pdfPerChild")}</div>` : ""}
  </div>
  ` : `
  <div style="width:100%;text-align:center;padding:4px 0;">
    <div class="banner-lbl" style="font-size:9pt;margin-bottom:6px;">${tr("pdfBannerLbl")}</div>
    <div class="banner-dir" style="font-size:14pt;">${tr("pdfNoSupport")}</div>
  </div>
  `}
</div>

<!-- LIVE PANEL (replica del blocco visivo dell'app) -->
<div class="live-panel">
  <div class="live-panel-title">${tr("pdfLiveTitle")}</div>
  <div class="live-net-row">
    <div class="live-net-card">
      <div class="live-net-label">${tr("pdfNetAvailable")} ${c1NameEsc}</div>
      <div class="live-net-value c1">${eur(m.disp1)}</div>
    </div>
    <div class="live-net-card">
      <div class="live-net-label">${tr("pdfNetAvailable")} ${c2NameEsc}</div>
      <div class="live-net-value c2">${eur(m.disp2)}</div>
    </div>
  </div>

  <!-- Track con figure e badge centrale -->
  <div style="border:1.5px solid rgba(167,198,191,0.5);border-radius:10px;background:#fff;padding:12px 16px;">
    <div class="track-figures">
      <!-- Figura C1 -->
      <div class="track-fig">
        <div class="fig-bubble c1">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="9" r="5" fill="#0b6e66" opacity="0.85"/>
            <path d="M5 24c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#0b6e66" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.85"/>
            ${m.disp1 >= m.disp2
              ? `<circle cx="11.5" cy="9" r="1" fill="#fff"/><circle cx="16.5" cy="9" r="1" fill="#fff"/>
                 <path d="M11 12.5 Q14 15 17 12.5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>`
              : `<circle cx="11.5" cy="9" r="1" fill="#fff"/><circle cx="16.5" cy="9" r="1" fill="#fff"/>
                 <path d="M11 14 Q14 11.5 17 14" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>`
            }
          </svg>
        </div>
        <div class="fig-label">${c1NameEsc}</div>
      </div>

      <!-- Badge centrale -->
      <div class="track-badge">
        <div class="track-badge-inner">
          ${(() => {
            const diff = m.disp1 - m.disp2;
            const absDiff = Math.abs(diff);
            if (absDiff < 0.5) return `${tr("pdfParity")} | ${tr("pdfDelta")} ${eur(0)}`;
            const winner = diff > 0 ? c1NameEsc : c2NameEsc;
            return `${tr("pdfNetAdvantage")}: ${winner} | ${tr("pdfDelta")} ${eur(absDiff)}`;
          })()}
        </div>
      </div>

      <!-- Figura C2 -->
      <div class="track-fig">
        <div class="fig-bubble c2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="9" r="5" fill="#c77a11" opacity="0.85"/>
            <path d="M5 24c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#c77a11" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.85"/>
            ${m.disp2 >= m.disp1
              ? `<circle cx="11.5" cy="9" r="1" fill="#fff"/><circle cx="16.5" cy="9" r="1" fill="#fff"/>
                 <path d="M11 12.5 Q14 15 17 12.5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>`
              : `<circle cx="11.5" cy="9" r="1" fill="#fff"/><circle cx="16.5" cy="9" r="1" fill="#fff"/>
                 <path d="M11 14 Q14 11.5 17 14" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>`
            }
          </svg>
        </div>
        <div class="fig-label">${c2NameEsc}</div>
      </div>
    </div>

    <!-- Barra del track -->
    <div class="track-bar-row">
      <div class="track-marker" style="left:${Math.min(95, Math.max(5,
        (m.disp1 + m.disp2) > 0
          ? Math.round(m.disp1 / (m.disp1 + m.disp2) * 100)
          : 50
      ))}%"></div>
    </div>
    <div class="track-labels"><span>${c1NameEsc}</span><span>${c2NameEsc}</span></div>
  </div>

  <!-- Assegno suggerito -->
  ${assegnoDir ? `
  <div class="assegno-pill">
    <div class="assegno-lbl">${tr("pdfSuggestedSupport")}</div>
    <div class="assegno-val">${assegnoDir}: ${assegnoText}</div>
  </div>` : ""}
</div>
<div class="section">
  <div class="section-title">${tr("pdfInputSection")}</div>
  <div class="two-col">
    <table>
      <thead><tr><th colspan="2">${tr("pdfGeneralSettings")}</th></tr></thead>
      <tbody>
        <tr><td>${tr("pdfCalcProfile")}</td><td>${normProfileName}</td></tr>
        <tr><td>${tr("pdfIncomeBase")}</td><td>${m.incomeMode === "annual" ? tr("pdfIncomeAnnualBase") : m.incomeMode === "cu" ? tr("pdfIncomeCuBase") : tr("pdfIncomeMonthlyBase")}</td></tr>
        <tr><td>${tr("pdfChildrenCount")}</td><td>${m.figli}</td></tr>
        <tr><td>${tr("pdfPermanence")} ${c1n()}</td><td>${m.perm1.toFixed(0)}%</td></tr>
        <tr><td>${tr("pdfPermanence")} ${c2n()}</td><td>${m.perm2.toFixed(0)}%</td></tr>
      </tbody>
    </table>
    <table class="data-table">
      <thead><tr><th>${tr("pdfItem")}</th><th class="num">${c1n()}</th><th class="num">${c2n()}</th></tr></thead>
      <tbody>
        <tr><td>${tr("pdfNetIncome")}${m.incomeMode === "annual" ? tr("pdfYearlySuffix") : m.incomeMode === "cu" ? " (CU lordo)" : tr("pdfMonthlySuffix")}</td>
            <td class="num">${eur(m.r1Raw)}</td><td class="num">${eur(m.r2Raw)}</td></tr>
        ${m.incomeMode === "annual" ? `<tr><td>${tr("pdfMonthlyConv")}</td><td class="num">${eur(m.r1)}</td><td class="num">${eur(m.r2)}</td></tr>` : ""}
        ${m.incomeMode === "cu" ? `<tr><td>${tr("pdfCuMonthlyConv")}</td><td class="num">${eur(m.r1)}</td><td class="num">${eur(m.r2)}</td></tr>` : ""}
        <tr><td>${tr("pdfSupportReceived")}</td><td class="num">${eur(m.aPerc1)}</td><td class="num">${eur(m.aPerc2)}</td></tr>
        <tr><td>${tr("pdfSupportPaid")}</td><td class="num">${eur(m.aPag1)}</td><td class="num">${eur(m.aPag2)}</td></tr>
        <tr><td>${tr("pdfFamilyBenefits")}</td><td class="num">${eur(m.aFam1)}</td><td class="num">${eur(m.aFam2)}</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- SPESE -->
<div class="section">
  <div class="section-title">${tr("pdfExpenseSection")}</div>
  <table>
    <thead>
      <tr>
        <th>${tr("pdfExpenseItem")}</th>
        <th class="num" style="width:110px">${c1n()} ${msg("pdfPerMonthShort", { currency: currentCurrency })}</th>
        <th class="num" style="width:110px">${c2n()} ${msg("pdfPerMonthShort", { currency: currentCurrency })}</th>
        <th class="num" style="width:110px">${msg("pdfTotalMonthly", { currency: currentCurrency })}</th>
        <th>${tr("expenseDetailBtn")}</th>
      </tr>
    </thead>
    <tbody>
      ${speseRows}
      <tr class="total-row">
        <td>${tr("pdfTotal")}</td>
        <td class="num">${eur(m.spese1)}</td>
        <td class="num">${eur(m.spese2)}</td>
        <td class="num">${eur(m.speseTot)}</td>
        <td class="expense-detail-cell">–</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ANALISI COMPARATIVA -->
<div class="section">
  <div class="section-title">${tr("pdfComparison")}</div>
  <div class="balance-row">
    <div class="bal-card c1">
      <div class="bal-card-title">${c1n()}</div>
      <div class="bal-line"><span class="bal-lbl">${tr("pdfNetIncome")}${tr("pdfMonthlySuffix")}</span><span class="bal-val">${eur(m.r1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">+ ${tr("pdfSupportReceived")}</span><span class="bal-val">+ ${eur(m.aPerc1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">+ ${tr("pdfFamilyBenefits")}</span><span class="bal-val">+ ${eur(m.aFam1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">– ${tr("pdfSupportPaid")}</span><span class="bal-val">– ${eur(m.aPag1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">– ${tr("pdfDirectExpenses")}</span><span class="bal-val">– ${eur(m.spese1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">${tr("pdfNetAvailable")}</span>
        <span class="bal-val ${m.disp1 >= 0 ? 'green' : 'red'}">${eur(m.disp1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">${tr("pdfWeight")}</span><span class="bal-val">${(m.peso1 * 100).toFixed(1)}%</span></div>
      <div class="bal-line"><span class="bal-lbl">${tr("pdfPostSupport")}</span>
        <span class="bal-val ${m.post1 >= 0 ? 'green' : 'red'}">${eur(m.post1)}</span></div>
    </div>
    <div class="bal-card c2">
      <div class="bal-card-title">${c2n()}</div>
      <div class="bal-line"><span class="bal-lbl">${tr("pdfNetIncome")}${tr("pdfMonthlySuffix")}</span><span class="bal-val">${eur(m.r2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">+ ${tr("pdfSupportReceived")}</span><span class="bal-val">+ ${eur(m.aPerc2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">+ ${tr("pdfFamilyBenefits")}</span><span class="bal-val">+ ${eur(m.aFam2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">– ${tr("pdfSupportPaid")}</span><span class="bal-val">– ${eur(m.aPag2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">– ${tr("pdfDirectExpenses")}</span><span class="bal-val">– ${eur(m.spese2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">${tr("pdfNetAvailable")}</span>
        <span class="bal-val ${m.disp2 >= 0 ? 'green' : 'red'}">${eur(m.disp2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">${tr("pdfWeight")}</span><span class="bal-val">${(m.peso2 * 100).toFixed(1)}%</span></div>
      <div class="bal-line"><span class="bal-lbl">${tr("pdfPostSupport")}</span>
        <span class="bal-val ${m.post2 >= 0 ? 'green' : 'red'}">${eur(m.post2)}</span></div>
    </div>
  </div>
</div>

<!-- KPI -->
<div class="section">
  <div class="section-title">${tr("pdfKpiSection")}</div>
  <div class="three-col">
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfTotalExpenses")}</div><div class="kpi-val warn">${eur(m.speseTot)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfEstimatedChildrenNeeds")}</div><div class="kpi-val warn">${eur(m.fabbisognoFigli)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfAmountPerChild")}</div><div class="kpi-val warn">${eur(Math.max(m.assegnoDa1a2, m.assegnoDa2a1) / m.figli)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfTheoreticalShare")} ${c1n()}</div><div class="kpi-val ok">${eur(m.quotaTeorica1)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfTheoreticalShare")} ${c2n()}</div><div class="kpi-val ok">${eur(m.quotaTeorica2)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfSuggestedSupport")}</div>
      <div class="kpi-val ${Math.max(m.assegnoDa1a2, m.assegnoDa2a1) > 0 ? 'warn' : 'ok'}">${eur(Math.max(m.assegnoDa1a2, m.assegnoDa2a1))}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfPostSupport")} ${c1n()}</div>
      <div class="kpi-val ${m.post1 >= 0 ? 'ok' : 'bad'}">${eur(m.post1)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfPostSupport")} ${c2n()}</div>
      <div class="kpi-val ${m.post2 >= 0 ? 'ok' : 'bad'}">${eur(m.post2)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">${tr("pdfDirectShareC1C2")}</div>
      <div class="kpi-val ok" style="font-size:10pt">${eur(m.quotaDiretta1)} / ${eur(m.quotaDiretta2)}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">${tr("spiegTitle")}</div>
  <div class="pdf-explain-grid">
    <div class="pdf-explain-card">
      <div class="pdf-explain-title">${tr("spiegRedditiLabel")}</div>
      <div class="pdf-explain-line">${c1NameEsc}: <strong>${eur(m.disp1)}</strong> (${tr("pdfWeight")}: ${peso1Pct}%)</div>
      <div class="pdf-explain-line">${c2NameEsc}: <strong>${eur(m.disp2)}</strong> (${tr("pdfWeight")}: ${peso2Pct}%)</div>
    </div>
    <div class="pdf-explain-card">
      <div class="pdf-explain-title">${tr("spiegSpeseLabel")}</div>
      <div class="pdf-explain-equation">
        <span class="pdf-explain-pill">${eur(m.speseTot)}</span>
        <span class="pdf-explain-op">&times;</span>
        <span class="pdf-explain-pill">35%</span>
        <span class="pdf-explain-op">=</span>
        <span class="pdf-explain-pill result">${eur(m.fabbisognoFigli)}</span>
      </div>
    </div>
    <div class="pdf-explain-card">
      <div class="pdf-explain-title">${tr("spiegPermLabel")}</div>
      <div class="pdf-explain-line">${c1NameEsc}: <strong>${m.perm1.toFixed(0)}%</strong> (${days1} ${tr("langDaysSuffix")}) &rarr; <strong>${eur(m.quotaDiretta1)}</strong></div>
      <div class="pdf-explain-line">${c2NameEsc}: <strong>${m.perm2.toFixed(0)}%</strong> (${days2} ${tr("langDaysSuffix")}) &rarr; <strong>${eur(m.quotaDiretta2)}</strong></div>
    </div>
    <div class="pdf-explain-card result">
      <div class="pdf-explain-title">${tr("spiegResultLabel")}</div>
      ${explainResultHtml}
    </div>
  </div>
</div>

${scenarioLab.length ? `
<div class="${scenarioSectionClass}">
  <div class="section-title">${tr("pdfScenarioSection")}</div>
  ${scenarioPdfTable}
</div>
` : ""}

<div class="section">
  <div class="section-title">${tr("pdfNegotiationSection")}</div>
  <table>
    <thead>
      <tr>
        <th>${tr("pdfNegotiationOption")}</th>
        <th class="num">${tr("pdfNegotiationAmount")}</th>
        <th class="num">${msg("pdfNegotiationPayerPost", { spouse: negotiationPayerName })}</th>
        <th class="num">${msg("pdfNegotiationReceiverPost", { spouse: negotiationReceiverName })}</th>
      </tr>
    </thead>
    <tbody>
      ${negotiationRowsHtml}
    </tbody>
  </table>
</div>

<!-- NOTE METODOLOGICHE -->
<div class="note-box">
  <strong>${tr("pdfMethodology")}</strong> — ${tr("pdfMethodologyText")}
  ${tr("pdfCalcProfile")}: <strong>${normProfileName}</strong>.
  ${tr("pdfNeedEstimate")}
  ${m.incomeMode === "annual" ? tr("pdfAnnualNote") : ""}
  ${m.incomeMode === "cu" ? tr("cuNetNoteText") : ""}
  ${tr("pdfResultsDepend")}
</div>

<div class="footer">${msg("pdfFooter", { date: genDate })}</div>

<script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`;

      const win = window.open("", "_blank");
      if (!win) {
        alert(tr("pdfPopupBlocked"));
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
    }

    async function exportJson() {
      if (!authSession.username || !authSession.keyBits) {
        setAuthStatus(tr("authLoginBeforeExportStatus"), true);
        alert(tr("authLoginBeforeExportAlert"));
        return;
      }

      const state = serializeState();
      const encrypted = await encryptStateForKey(state, authSession.keyBits);
      const payloadObj = {
        format: "keylock-encrypted-state-v1",
        owner: authSession.username,
        createdAt: new Date().toISOString(),
        cipher: encrypted
      };
      const payload = JSON.stringify(payloadObj, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
      a.href = url;
      a.download = `mantenimento-cifrato-${authSession.username}-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    async function importJsonFromFile(file) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const payload = JSON.parse(String(reader.result || "{}"));
          if (!payload || payload.format !== "keylock-encrypted-state-v1" || !payload.owner || !payload.cipher) {
            throw new Error(tr("authInvalidJsonFormat"));
          }

          if (!authSession.username || !authSession.keyBits) {
            throw new Error(tr("authLoginBeforeImport"));
          }

          if (normalizeUsername(payload.owner) !== normalizeUsername(authSession.username)) {
            throw new Error(tr("authFileOwnedByOther"));
          }

          const state = await decryptStateForKey(payload.cipher, authSession.keyBits);
          if (!state || typeof state !== "object" || !state.base || !Array.isArray(state.spese)) {
            throw new Error(tr("authDecryptedContentInvalid"));
          }

          applyState(state);
          setAuthStatus(tr("authEncryptedJsonImported"));
          alert(tr("authEncryptedJsonLoaded"));
        } catch (err) {
          setAuthStatus(msg("authImportFailedStatus", { message: err.message }), true);
          alert(msg("authImportFailedAlert", { message: err.message }));
        }
      };
      reader.readAsText(file, "utf-8");
    }

    function serializeState() {
      captureUiViewStateFromDom();
      const calcProfileCfg = getCalcProfileConfig(getSelectedCalcProfileId());
      const base = {
        reddito1: num("reddito1"),
        reddito2: num("reddito2"),
        incomeMode: document.getElementById("incomeMode").value,
        calcProfile: calcProfileCfg.id,
        normProfile: calcProfileCfg.normProfile,
        numFigli: num("numFigli"),
        perm1: num("perm1"),
        calcMode: calcProfileCfg.mode,
        simplePerc: num("simplePerc"),
        assegnoPercepito1: num("assegnoPercepito1"),
        assegnoPagato1: num("assegnoPagato1"),
        assegnoFam1: num("assegnoFam1"),
        assegnoPercepito2: num("assegnoPercepito2"),
        assegnoPagato2: num("assegnoPagato2"),
        assegnoFam2: num("assegnoFam2"),
        straordAnn1: num("straordAnn1"),
        straordAnn2: num("straordAnn2")
      };
      const spese = expenseItems.map((_, i) => ({
        c1: num(`c1_${i}`),
        c2: num(`c2_${i}`),
        d1: String(document.getElementById(`c1d_${i}`)?.value || "").trim(),
        d2: String(document.getElementById(`c2d_${i}`)?.value || "").trim()
      }));
      const expenseItemsState = expenseItems.map((item) => ({ label: item.label, help: item.help }));
      const scenariosState = scenarioLab.map((scenario, idx) => ({
        label: SCENARIO_LABELS[idx],
        payload: safeJsonClone(scenario.payload)
      }));
      const uiState = {
        currentLang,
        currentCurrency,
        uiZoom: getCurrentUiZoomValue(),
        view: {
          spiegOpen: !!uiViewState.spiegOpen,
          formulaOpen: !!uiViewState.formulaOpen,
          permCalendarOpen: !!uiViewState.permCalendarOpen,
          cloudHistoryOpen: !!uiViewState.cloudHistoryOpen
        }
      };
      return { base, spese, expenseItems: expenseItemsState,
        scenarioLab: scenariosState,
        scenarioLabSelectedIdx: selectedScenarioIdx,
        permanenceCalendar: exportPermanenceCalendarState(),
        uiState,
        nome1: document.getElementById("nome1").value,
        nome2: document.getElementById("nome2").value };
    }

    function hydrateState(state) {
      if (!state || !state.base || !state.spese) return;
      Object.entries(state.base).forEach(([k, v]) => {
        const el = document.getElementById(k);
        if (el) el.value = v;
      });
      if (Array.isArray(state.expenseItems) && state.expenseItems.length) {
        expenseItems = state.expenseItems.map((item, idx) => normalizeExpenseItem(item, idx));
      } else {
        expenseItems = defaultExpenseItems.map((item) => ({ ...item }));
      }
      while (expenseItems.length < state.spese.length) {
        expenseItems.push(normalizeExpenseItem(null, expenseItems.length));
      }
      scenarioLab = normalizeScenarioLabState(state.scenarioLab);
      selectedScenarioIdx = Number.isInteger(state.scenarioLabSelectedIdx)
        ? Math.max(-1, Math.min(scenarioLab.length - 1, state.scenarioLabSelectedIdx))
        : -1;
      if (state.nome1 !== undefined) document.getElementById("nome1").value = state.nome1;
      if (state.nome2 !== undefined) document.getElementById("nome2").value = state.nome2;
      if (state.uiState && typeof state.uiState === "object") {
        const nextLang = String(state.uiState.currentLang || "").toLowerCase();
        if (SUPPORTED_LANGS.includes(nextLang)) currentLang = nextLang;
        const nextCurrency = String(state.uiState.currentCurrency || "").toUpperCase();
        if (SUPPORTED_CURRENCIES.includes(nextCurrency)) currentCurrency = nextCurrency;
        if (state.uiState.uiZoom !== undefined) {
          setUiZoom(state.uiState.uiZoom, false);
        }
        const view = state.uiState.view || {};
        uiViewState.spiegOpen = view.spiegOpen !== undefined ? !!view.spiegOpen : true;
        uiViewState.formulaOpen = !!view.formulaOpen;
        uiViewState.permCalendarOpen = view.permCalendarOpen !== undefined ? !!view.permCalendarOpen : true;
        uiViewState.cloudHistoryOpen = !!view.cloudHistoryOpen;
      }
      const calcProfileEl = document.getElementById("calcProfile");
      if (calcProfileEl) {
        calcProfileEl.value = resolveCalcProfileIdFromState(state.base);
      }
      const langSelect = document.getElementById("langSelect");
      const currencySelect = document.getElementById("currencySelect");
      if (langSelect) langSelect.value = currentLang;
      if (currencySelect) currencySelect.value = currentCurrency;
      applyStaticTranslations();
      applyUiViewStateToDom();
      importPermanenceCalendarState(state.permanenceCalendar);
      updateSpouseLabels();
      buildExpenseRows();
      syncPermanenza("calendar");
      state.spese.forEach((row, i) => {
        const c1 = document.getElementById(`c1_${i}`);
        const c2 = document.getElementById(`c2_${i}`);
        const d1 = document.getElementById(`c1d_${i}`);
        const d2 = document.getElementById(`c2d_${i}`);
        if (c1) c1.value = row.c1;
        if (c2) c2.value = row.c2;
        if (d1) d1.value = String(row && row.d1 ? row.d1 : "");
        if (d2) d2.value = String(row && row.d2 ? row.d2 : "");
      });
      refreshExpenseDetailButtonState();
    }

    function resetAll() {
      document.querySelectorAll("input[type='number'], input[data-numeric='1']").forEach((el) => {
        if (el.id !== "perm2") {
          el.value = el.defaultValue || 0;
        }
      });
      permanenceCalendarState.byMonth = {};
      selectedScenarioIdx = -1;
      uiViewState.spiegOpen = true;
      uiViewState.formulaOpen = false;
      uiViewState.permCalendarOpen = true;
      uiViewState.cloudHistoryOpen = false;
      const monthInput = document.getElementById("permCalendarMonth");
      const monthValue = monthInput && parseMonthValue(monthInput.value) ? monthInput.value : getCurrentMonthValue();
      permanenceCalendarState.month = monthValue;
      if (monthInput) monthInput.value = monthValue;
      renderPermanenceCalendar(monthValue);
      applyPermanenceFromCalendar(monthValue, { silentRender: true });
      applyUiViewStateToDom();
      syncPermanenza();
      renderAll();
    }

    document.getElementById("btnReset").addEventListener("click", resetAll);

    document.getElementById("btnExportJson").addEventListener("click", async () => {
      await exportJson();
    });

    document.getElementById("btnImportJson").addEventListener("click", () => {
      document.getElementById("fileJson").click();
    });

    document.getElementById("fileJson").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        await importJsonFromFile(file);
      }
      e.target.value = "";
    });

    document.getElementById("btnPdf").addEventListener("click", () => {
      exportPdfDirect();
    });

    document.getElementById("btnSaveScenario").addEventListener("click", () => {
      saveCurrentScenario();
    });

    document.getElementById("btnClearScenarios").addEventListener("click", () => {
      scenarioLab = [];
      selectedScenarioIdx = -1;
      renderScenarioLab();
    });

    document.getElementById("scenarioLabBody").addEventListener("click", (e) => {
      const selectBtn = e.target && e.target.closest("button[data-scenario-select-idx]");
      if (selectBtn) {
        const idx = Number(selectBtn.getAttribute("data-scenario-select-idx"));
        if (Number.isInteger(idx) && idx >= 0 && idx < scenarioLab.length) {
          applyScenarioSelection(idx);
        }
        return;
      }

      const removeBtn = e.target && e.target.closest("button[data-scenario-idx]");
      if (!removeBtn) return;
      const idx = Number(removeBtn.getAttribute("data-scenario-idx"));
      if (Number.isInteger(idx) && idx >= 0 && idx < scenarioLab.length) {
        removeScenario(idx);
      }
    });

    document.getElementById("btnAddExpenseItem").addEventListener("click", () => {
      document.getElementById("expenseItemEditor").classList.remove("is-hidden");
      resetExpenseEditorFields();
      document.getElementById("customExpenseLabel").focus();
    });

    document.getElementById("btnCancelExpenseItem").addEventListener("click", () => {
      document.getElementById("expenseItemEditor").classList.add("is-hidden");
      resetExpenseEditorFields();
    });

    document.getElementById("suggestedExpenseSelect").addEventListener("change", (e) => {
      const raw = String(e.target.value || "").trim();
      if (raw === "") {
        document.getElementById("customExpenseLabel").value = "";
        document.getElementById("customExpenseHelp").value = "";
        return;
      }
      const idx = Number(raw);
      if (!Number.isInteger(idx) || idx < 0 || idx >= suggestedExpenseCatalog.length) {
        document.getElementById("customExpenseLabel").value = "";
        document.getElementById("customExpenseHelp").value = "";
        return;
      }
      const selected = suggestedExpenseCatalog[idx];
      document.getElementById("customExpenseLabel").value = selected.label;
      document.getElementById("customExpenseHelp").value = selected.help;
    });

    document.getElementById("btnCreateExpenseItem").addEventListener("click", () => {
      const labelRaw = document.getElementById("customExpenseLabel").value;
      const helpRaw = document.getElementById("customExpenseHelp").value;
      const label = String(labelRaw || "").trim();
      const help = String(helpRaw || "").trim();
      if (!label) {
        alert("Inserisci il nome della voce spesa.");
        return;
      }

      const currentValues = snapshotExpenseValues();
      expenseItems.push(normalizeExpenseItem({ label, help }, expenseItems.length));
      buildExpenseRows();
      restoreExpenseValues(currentValues);
      updateExpensePartials();
      renderAll();

      resetExpenseEditorFields();
      document.getElementById("expenseItemEditor").classList.add("is-hidden");
    });

    rowsSpese.addEventListener("click", (e) => {
      const detailBtn = e.target && e.target.closest("button[data-detail-target]");
      if (detailBtn) {
        const wrapId = String(detailBtn.getAttribute("data-detail-wrap") || "");
        const targetId = String(detailBtn.getAttribute("data-detail-target") || "");
        const wrap = document.getElementById(wrapId);
        const target = document.getElementById(targetId);
        if (wrap) {
          const willOpen = wrap.classList.contains("is-hidden");
          wrap.classList.toggle("is-hidden", !willOpen);
          detailBtn.classList.toggle("is-open", willOpen);
          if (willOpen && target) target.focus();
        }
        return;
      }

      const btn = e.target && e.target.closest("button[data-remove-expense-idx]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-remove-expense-idx"));
      removeExpenseItemAt(idx);
    });

    rowsSpese.addEventListener("input", (e) => {
      if (e.target && e.target.matches("textarea.spese-detail-text")) {
        refreshExpenseDetailButtonState();
      }
    });

    document.getElementById("btnZoomOut").addEventListener("click", () => {
      const current = normalizeUiZoom(getComputedStyle(document.documentElement).getPropertyValue("--ui-zoom"));
      setUiZoom(current - UI_ZOOM_STEP);
    });

    document.getElementById("btnZoomIn").addEventListener("click", () => {
      const current = normalizeUiZoom(getComputedStyle(document.documentElement).getPropertyValue("--ui-zoom"));
      setUiZoom(current + UI_ZOOM_STEP);
    });

    document.getElementById("btnZoomReset").addEventListener("click", () => {
      setUiZoom(1);
    });

    document.getElementById("btnRegisterKeyLock").addEventListener("click", async () => {
      await registerKeyLockUser();
    });

    document.getElementById("btnLoginKeyLock").addEventListener("click", async () => {
      await loginKeyLockUser();
    });

    document.getElementById("authLoginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (authUiState.mode === "signup") {
        await registerKeyLockUser();
      } else {
        await loginKeyLockUser();
      }
    });

    document.getElementById("btnAuthModeLogin").addEventListener("click", () => {
      setAuthMode("login");
    });

    document.getElementById("btnAuthModeSignup").addEventListener("click", () => {
      setAuthMode("signup");
    });

    document.getElementById("btnVerifyEmailCode").addEventListener("click", async () => {
      await verifySignupEmailCode();
    });

    document.getElementById("btnLogoutKeyLock").addEventListener("click", async () => {
      await logoutKeyLockUser();
    });

    document.getElementById("btnSaveMyScenario").addEventListener("click", async () => {
      await saveScenarioForLoggedUser();
    });

    document.getElementById("btnLoadMyScenario").addEventListener("click", async () => {
      await loadScenarioForLoggedUser();
    });

    document.getElementById("btnHistoryMyScenario").addEventListener("click", () => {
      const panel = document.getElementById("cloudHistoryPanel");
      if (!panel) return;
      renderCloudHistoryPanel();
      panel.open = !panel.open;
    });

    document.getElementById("cloudHistoryList").addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest("button[data-history-delete-idx]");
      if (deleteBtn) {
        const idx = Number(deleteBtn.getAttribute("data-history-delete-idx"));
        await deleteCloudHistoryEntry(idx);
        return;
      }

      const restoreBtn = e.target.closest("button[data-history-idx]");
      if (!restoreBtn) return;
      const idx = Number(restoreBtn.getAttribute("data-history-idx"));
      if (!Number.isInteger(idx) || idx < 0 || idx >= cloudProfileSession.history.length) return;
      const entry = cloudProfileSession.history[idx];
      if (!entry || !entry.state) return;
      applyState(entry.state);
      setAuthStatus(tr("authHistoryRestored"));
    });

    const formulaDetailsEl = document.getElementById("formulaDetails");
    if (formulaDetailsEl) {
      formulaDetailsEl.addEventListener("toggle", () => {
        uiViewState.formulaOpen = !!formulaDetailsEl.open;
      });
    }

    const permCalendarDetailsEl = document.getElementById("permCalendarDetails");
    if (permCalendarDetailsEl) {
      permCalendarDetailsEl.addEventListener("toggle", () => {
        uiViewState.permCalendarOpen = !!permCalendarDetailsEl.open;
      });
    }

    const cloudHistoryPanelEl = document.getElementById("cloudHistoryPanel");
    if (cloudHistoryPanelEl) {
      cloudHistoryPanelEl.addEventListener("toggle", () => {
        uiViewState.cloudHistoryOpen = !!cloudHistoryPanelEl.open;
      });
    }

    document.addEventListener("input", (e) => {
      if (e.target && e.target.matches("input[type='number'], input[data-numeric='1']")) {
        if (e.target.id === "perm1") {
          syncPermanenza("perm1");
        } else if (e.target.id === "perm2") {
          syncPermanenza("perm2");
        } else if (e.target.id === "reddito1" || e.target.id === "reddito2") {
          const activeMode = document.getElementById("incomeMode")?.value || "monthly";
          incomeValuesByMode[activeMode] = {
            r1: num("reddito1"),
            r2: num("reddito2")
          };
        }
        renderAll();
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target && (e.target.id === "calcProfile" || e.target.id === "incomeMode")) {
        if (e.target.id === "incomeMode") {
          const nextMode = document.getElementById("incomeMode").value || "monthly";
          convertIncomeValuesForModeChange(incomeModeLast, nextMode);
          incomeModeLast = nextMode;
        }
        updateModeUi();
        renderAll();
      }
    });

    document.getElementById("langSelect").addEventListener("change", (e) => {
      const next = String(e.target.value || "it").toLowerCase();
      currentLang = SUPPORTED_LANGS.includes(next) ? next : "it";
      try {
        localStorage.setItem(UI_LANG_KEY, currentLang);
      } catch (_) {}
      applyStaticTranslations();
      updateModeUi();
      updateSpouseLabels();
      renderAll();
    });

    document.getElementById("currencySelect").addEventListener("change", (e) => {
      const next = String(e.target.value || "EUR").toUpperCase();
      currentCurrency = SUPPORTED_CURRENCIES.includes(next) ? next : "EUR";
      try {
        localStorage.setItem(UI_CURRENCY_KEY, currentCurrency);
      } catch (_) {}
      updateModeUi();
      updateSpouseLabels();
      renderAll();
    });

    populateSuggestedExpenseOptions();
    initPreferences();
    patchFabricTextBaselineTypo();
    applyStaticTranslations();
    buildExpenseRows();
    initUiZoom();
    initTopActionsMenu();
    initPermSliderBar();
    initPermanenceCalendar();
    initAuthMenu();
    initCoffeeFloatVisibility();
    initCoffeeDonationPicker();
    void initVisitorCounters();
    setAuthMode("login");
    updateAuthUi();
    renderCloudHistoryPanel();
    applyUiViewStateToDom();
    syncPermanenza();
    incomeModeLast = document.getElementById("incomeMode").value || "monthly";
    incomeValuesByMode[incomeModeLast] = {
      r1: num("reddito1"),
      r2: num("reddito2")
    };
    updateModeUi();
    updateSpouseLabels();
    document.getElementById("nome1").addEventListener("input", () => { updateSpouseLabels(); renderAll(); });
    document.getElementById("nome2").addEventListener("input", () => { updateSpouseLabels(); renderAll(); });
    renderAll();