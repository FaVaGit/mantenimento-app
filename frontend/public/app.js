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

    const QUOTA_MANTENIMENTO_PERC = 35;

    const rowsSpese = document.getElementById("rowsSpese");
    const KEYLOCK_PROFILE_TABLE = "keylock_profiles";
    const CLOUD_PROFILE_FORMAT = "keylock-cloud-profile-v2";
    const CLOUD_HISTORY_MAX = 24;
    const UI_ZOOM_KEY = "keylock_ui_zoom";
    const UI_ZOOM_MIN = 0.9;
    const UI_ZOOM_MAX = 1.5;
    const UI_ZOOM_STEP = 0.1;
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
    const cloudProfileSession = {
      loaded: null,
      history: []
    };
    let netDiffFabricCanvas = null;
    let authFlowInProgress = false;
    let authRateLimitedUntilTs = 0;
    let incomeModeLast = "monthly";

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
      const n = Number(v || 0);
      return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
    }

    function eurTiny(v) {
      const n = Number(v || 0);
      const short = new Intl.NumberFormat("it-IT", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(n);
      return `${short} EUR`;
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

    function num(id) {
      const raw = document.getElementById(id).value;
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
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
        list.innerHTML = "Nessuna versione storica disponibile al momento.";
        return;
      }

      const rows = [...cloudProfileSession.history]
        .reverse()
        .map((entry, idx) => {
          const ts = entry && entry.savedAt ? new Date(entry.savedAt).toLocaleString("it-IT") : "Data non disponibile";
          const originalIndex = cloudProfileSession.history.length - 1 - idx;
          return `<div class="history-item"><div><strong>Versione ${idx + 1}</strong><small>${ts}</small></div><button class="btn-secondary" type="button" data-history-idx="${originalIndex}">Ripristina</button></div>`;
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
        setAuthStatus(`Rate limit Supabase attivo. Attendi ${rem}s prima di riprovare Login/Registrati.`, true);
        return false;
      }
      return true;
    }

    function isInvalidCredentialAuthMessage(msg) {
      return /invalid login credentials/i.test(String(msg || ""));
    }

    async function signInWithPseudoEmailCandidates(username, password) {
      const emails = buildPseudoEmailCandidates(username);
      let lastErrorMessage = "";
      for (const email of emails) {
        const signInRes = await supabaseClient.auth.signInWithPassword({ email, password });
        if (!signInRes.error && signInRes.data && signInRes.data.user) {
          return { ok: true, email, result: signInRes, lastErrorMessage };
        }

        lastErrorMessage = String((signInRes.error && signInRes.error.message) || "");
        if (isRateLimitAuthMessage(lastErrorMessage)) {
          const waitSec = setLocalAuthCooldown(parseRetryAfterSeconds(lastErrorMessage));
          lastErrorMessage = `Rate limit Supabase. Attendi ${waitSec}s e riprova.`;
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
      return `Login effettuato come ${username}.`;
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
        toggleBtn.querySelector("span").textContent = logged ? `Utente: ${authSession.username}` : "KeyLock Login";
      }

      document.getElementById("btnRegisterKeyLock").disabled = logged;
      document.getElementById("btnLoginKeyLock").disabled = logged;
      document.getElementById("btnLogoutKeyLock").disabled = !logged;
      document.getElementById("btnSaveMyScenario").disabled = !logged;
      document.getElementById("btnLoadMyScenario").disabled = !logged;

      if (logged) {
        setAuthStatus("", false);
      } else {
        setAuthStatus("Non autenticato.", false);
      }
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

      document.addEventListener("click", () => {
        setAuthMenuOpen(false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setAuthMenuOpen(false);
        }
      });
    }

    async function deriveSessionKeyBits(password, userId) {
      const enc = new TextEncoder();
      const salt = await sha256Bytes(enc.encode(`keylock:${userId}`));
      return deriveKeyBits(password, salt);
    }

    async function ensureSupabaseReady(actionLabel) {
      if (!(window.crypto && window.crypto.subtle)) {
        setAuthStatus("KeyLock non supportato da questo browser.", true);
        return false;
      }
      if (!supabaseClient) {
        setAuthStatus(`Configura Supabase in supabase-config.js prima di ${actionLabel}.`, true);
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
        setAuthStatus("Operazione auth gia in corso, attendi qualche secondo.", true);
        return;
      }
      if (!ensureAuthNotCoolingDown()) return;
      authFlowInProgress = true;
      try {

      const username = normalizeUsername(text("keylockUser"));
      const password = text("keylockPass");
      if (!isValidUsername(username)) {
        setAuthStatus("Nome utente non valido: usa 3-40 caratteri tra lettere minuscole, numeri, punto, trattino o underscore.", true);
        return;
      }
      if (password.length < 6) {
        setAuthStatus("Password troppo corta: minimo 6 caratteri.", true);
        return;
      }

      const email = usernameToPseudoEmail(username);
      const signUpRes = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });

      let signUpRateLimited = false;

      if (signUpRes.error) {
        const signUpMsg = String(signUpRes.error.message || "");
        if (/already|registered/i.test(signUpMsg)) {
          // User may already exist: continue with login flow.
        } else if (isRateLimitAuthMessage(signUpMsg)) {
          const waitSec = setLocalAuthCooldown(parseRetryAfterSeconds(signUpMsg));
          signUpRateLimited = true;
          setAuthStatus(`Rate limit Supabase su Registrati. Attendi ${waitSec}s e riprova.`, true);
          return;
        } else {
          setAuthStatus(`Registrazione fallita: ${signUpRes.error.message}`, true);
          return;
        }
      }

      const postLogin = await signInWithPseudoEmailCandidates(username, password);
      if (!postLogin.ok) {
        if (signUpRateLimited || isRateLimitAuthMessage(postLogin.lastErrorMessage)) {
          setAuthStatus("Rate limit Supabase su registrazione/login. Se l'utente esiste, attendi 1-2 minuti e riprova Login. Se e nuovo, attendi e riprova Registrati.", true);
          return;
        }

        if (isInvalidCredentialAuthMessage(postLogin.lastErrorMessage)) {
          setAuthStatus("Registrazione non completata o credenziali non corrette. Riprova Login.", true);
          return;
        }

        setAuthStatus("Registrazione eseguita ma login non completato. In Supabase disattiva la conferma email per usare KeyLock con solo utente/password.", true);
        return;
      }

      const loginMsg = await completeAuthSession(username, password, postLogin.result.data.user);
      if (signUpRateLimited) {
        setAuthStatus(`Rate limit registrazione rilevato, ma accesso effettuato: ${loginMsg}`);
      } else {
        setAuthStatus(`Utente ${username} registrato e login effettuato.`);
      }
      await loadScenarioForLoggedUser({ silentNoData: true, fromLogin: true });
      } finally {
        authFlowInProgress = false;
      }
    }

    async function loginKeyLockUser() {
      if (!await ensureSupabaseReady("effettuare il login")) return;
      if (authFlowInProgress) {
        setAuthStatus("Operazione auth gia in corso, attendi qualche secondo.", true);
        return;
      }
      if (!ensureAuthNotCoolingDown()) return;
      authFlowInProgress = true;
      try {

      const username = normalizeUsername(text("keylockUser"));
      const password = text("keylockPass");
      if (!isValidUsername(username)) {
        setAuthStatus("Nome utente non valido.", true);
        return;
      }

      const signIn = await signInWithPseudoEmailCandidates(username, password);
      if (!signIn.ok) {
        const loginMsg = String(signIn.lastErrorMessage || "");
        if (isRateLimitAuthMessage(loginMsg)) {
          setAuthStatus("Troppi tentativi ravvicinati. Attendi 1-2 minuti e riprova il Login.", true);
          return;
        }
        if (isInvalidCredentialAuthMessage(loginMsg)) {
          setAuthStatus("Login fallito: credenziali non valide o utente non presente nel nuovo cloud. Usa Registrati solo se l'utente non e mai stato creato su Supabase.", true);
          return;
        }
        setAuthStatus(`Login fallito: ${loginMsg || "utente non trovato"}`, true);
        return;
      }

      const loginMsg = await completeAuthSession(username, password, signIn.result.data.user);
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
      setAuthStatus("Logout eseguito.");
    }

    async function saveScenarioForLoggedUser() {
      if (!authSession.username || !authSession.userId || !authSession.keyBits) {
        setAuthStatus("Effettua prima il login.", true);
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
        setAuthStatus(`Salvataggio profilo fallito: ${existingRes.error.message}`, true);
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
        setAuthStatus(`Salvataggio profilo fallito: ${error.message}`, true);
        return;
      }

      cloudProfileSession.loaded = cloudDoc;
      cloudProfileSession.history = history;
      renderCloudHistoryPanel();
      setAuthStatus(`Profilo cloud salvato. Versioni storiche: ${history.length}.`);
    }

    async function loadScenarioForLoggedUser(options = {}) {
      if (!authSession.username || !authSession.userId || !authSession.keyBits) {
        setAuthStatus("Effettua prima il login.", true);
        return false;
      }

      const { data, error } = await supabaseClient
        .from(KEYLOCK_PROFILE_TABLE)
        .select("scenario_cipher, updated_at")
        .eq("user_id", authSession.userId)
        .maybeSingle();

      if (error) {
        setAuthStatus(`Caricamento profilo fallito: ${error.message}`, true);
        return false;
      }
      if (!data || !data.scenario_cipher) {
        cloudProfileSession.loaded = null;
        cloudProfileSession.history = [];
        renderCloudHistoryPanel();
        if (!options.silentNoData) setAuthStatus("Nessun profilo cloud salvato per questo utente.", true);
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
          ? `Login effettuato e ultimo profilo cloud caricato. Versioni storiche: ${cloudProfileSession.history.length}.`
          : `Profilo cloud caricato. Versioni storiche: ${cloudProfileSession.history.length}.`);
        return true;
      } catch (_) {
        setAuthStatus("Impossibile decifrare il profilo: verifica username/password.", true);
        return false;
      }
    }

    function buildExpenseRows() {
      rowsSpese.innerHTML = "";
      document.getElementById("speseCountNote").textContent = `Elenco spese compilabili: ${expenseItems.length} voci.`;
      expenseItems.forEach((item, idx) => {
        const labelEsc = escapeHtml(item.label);
        const helpEsc = escapeHtml(item.help);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><span class="label-row">${labelEsc}<span class="hint" title="${helpEsc}">i</span></span></td>
          <td>
            <div class="spese-input-wrap">
              <input type="number" min="0" step="0.01" id="c1_${idx}" value="0" />
              <span class="spese-partial" id="p1_${idx}" title="Somma parziale progressiva">Tot: ${eurTiny(0)}</span>
            </div>
          </td>
          <td>
            <div class="spese-input-wrap">
              <input type="number" min="0" step="0.01" id="c2_${idx}" value="0" />
              <span class="spese-partial" id="p2_${idx}" title="Somma parziale progressiva">Tot: ${eurTiny(0)}</span>
            </div>
          </td>
          <td class="col-actions">
            <button class="btn-secondary spese-remove-btn" type="button" data-remove-expense-idx="${idx}" title="Rimuovi voce spesa">Rimuovi</button>
          </td>
        `;
        rowsSpese.appendChild(tr);
      });
    }

    function snapshotExpenseValues() {
      return expenseItems.map((_, i) => ({ c1: num(`c1_${i}`), c2: num(`c2_${i}`) }));
    }

    function restoreExpenseValues(values) {
      if (!Array.isArray(values)) return;
      values.forEach((row, i) => {
        const c1 = document.getElementById(`c1_${i}`);
        const c2 = document.getElementById(`c2_${i}`);
        if (c1) c1.value = Number.isFinite(Number(row && row.c1)) ? Number(row.c1) : 0;
        if (c2) c2.value = Number.isFinite(Number(row && row.c2)) ? Number(row.c2) : 0;
      });
    }

    function removeExpenseItemAt(index) {
      if (!Number.isInteger(index) || index < 0 || index >= expenseItems.length) return;
      if (expenseItems.length <= 1) {
        alert("Deve restare almeno una voce spesa.");
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
          p1.textContent = `Tot: ${eurTiny(partial1)}`;
          p1.title = `Somma parziale progressiva: ${eur(partial1)}`;
        }
        if (p2) {
          p2.textContent = `Tot: ${eurTiny(partial2)}`;
          p2.title = `Somma parziale progressiva: ${eur(partial2)}`;
        }
      });
    }

    function syncPermanenza(source = "perm1") {
      let p1 = Math.min(100, Math.max(0, num("perm1")));
      let p2 = Math.min(100, Math.max(0, num("perm2")));

      if (source === "perm2") {
        p1 = 100 - p2;
      } else if (source === "slider") {
        p1 = Math.min(100, Math.max(0, num("permSlider")));
      }

      p1 = Math.round(p1);
      p2 = 100 - p1;

      document.getElementById("perm1").value = p1;
      document.getElementById("perm2").value = p2;
      const slider = document.getElementById("permSlider");
      if (slider) slider.value = p1;
    }

    function sumSpese(prefix) {
      return expenseItems.reduce((acc, _, idx) => acc + num(`${prefix}_${idx}`), 0);
    }

    function convertIncomeValuesForModeChange(prevMode, nextMode) {
      if (!prevMode || !nextMode || prevMode === nextMode) return;
      const factor = prevMode === "monthly" && nextMode === "annual"
        ? 12
        : (prevMode === "annual" && nextMode === "monthly" ? 1 / 12 : 1);
      if (factor === 1) return;

      ["reddito1", "reddito2"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const raw = Number(el.value);
        if (!Number.isFinite(raw)) return;
        const converted = Math.round((raw * factor) * 100) / 100;
        el.value = String(converted);
      });
    }

    function updateModeUi() {
      const mode = document.getElementById("calcMode").value || "legal";
      const incomeMode = document.getElementById("incomeMode").value || "monthly";
      const simplePerc = document.getElementById("simplePerc");
      const simplePercField = document.getElementById("simplePercField");
      const isSimple = mode === "simple";
      simplePerc.disabled = !isSimple;
      if (simplePercField) simplePercField.classList.toggle("is-hidden", !isSimple);
      simplePerc.title = isSimple
        ? "Percentuale usata nella formula semplificata."
        : "Campo inattivo: viene usato solo nella modalita semplificata.";

      const redditoLabel1 = document.getElementById("lblReddito1");
      const redditoLabel2 = document.getElementById("lblReddito2");
      const redditoHint1 = document.getElementById("hintReddito1");
      const redditoHint2 = document.getElementById("hintReddito2");
      const annual = incomeMode === "annual";
      const labelText = annual ? "Reddito annuale netto (EUR)" : "Reddito mensile netto (EUR)";
      const hintText1 = annual
        ? "Entrate nette annuali del Coniuge 1: il sistema converte automaticamente in quota mensile (/12)."
        : "Entrate nette mensili disponibili del Coniuge 1.";
      const hintText2 = annual
        ? "Entrate nette annuali del Coniuge 2: il sistema converte automaticamente in quota mensile (/12)."
        : "Entrate nette mensili disponibili del Coniuge 2.";
      if (redditoLabel1) redditoLabel1.textContent = labelText;
      if (redditoLabel2) redditoLabel2.textContent = labelText;
      if (redditoHint1) redditoHint1.title = hintText1;
      if (redditoHint2) redditoHint2.title = hintText2;

      const guideline = document.getElementById("modeGuideline");
      if (guideline) {
        if (mode === "genova") {
          guideline.innerHTML = "Riferimento modalita selezionata: <a href=\"https://www.ufficigiudiziarigenova.it/documentazione/D_112851.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">Linee guida del Tribunale di Genova (PDF)</a>.";
          guideline.style.display = "block";
        } else {
          guideline.innerHTML = "";
          guideline.style.display = "none";
        }
      }
    }

    function collectCalculationPayload() {
      return {
        incomeMode: document.getElementById("incomeMode").value || "monthly",
        r1Raw: num("reddito1"),
        r2Raw: num("reddito2"),
        figli: Math.max(1, Math.round(num("numFigli"))),
        perm1: Math.min(100, Math.max(0, num("perm1"))),
        mode: document.getElementById("calcMode").value || "legal",
        simplePerc: Math.min(100, Math.max(0, num("simplePerc"))),
        aPerc1: num("assegnoPercepito1"),
        aPag1: num("assegnoPagato1"),
        aPerc2: num("assegnoPercepito2"),
        aPag2: num("assegnoPagato2"),
        aFam1: num("assegnoFam1"),
        aFam2: num("assegnoFam2"),
        c1Spese: expenseItems.map((_, idx) => num(`c1_${idx}`)),
        c2Spese: expenseItems.map((_, idx) => num(`c2_${idx}`))
      };
    }

    function computeModel() {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/calculate", false);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(collectCalculationPayload()));

      if (xhr.status >= 200 && xhr.status < 300) {
        const body = JSON.parse(xhr.responseText || "{}");
        if (body && body.ok && body.model) return body.model;
      }

      throw new Error("Calcolo backend non disponibile. Avvia il server Node (npm run dev).");
    }

    function c1n() { return (document.getElementById("nome1").value || "").trim() || "Coniuge 1"; }
    function c2n() { return (document.getElementById("nome2").value || "").trim() || "Coniuge 2"; }

    function updateSpouseLabels() {
      const th1 = document.getElementById("thSpese1");
      const th2 = document.getElementById("thSpese2");
      const lp1 = document.getElementById("lblPerm1");
      const lp2 = document.getElementById("lblPerm2");
      if (th1) th1.textContent = c1n() + " (EUR)";
      if (th2) th2.textContent = c2n() + " (EUR)";
      if (lp1) lp1.textContent = c1n();
      if (lp2) lp2.textContent = c2n();
    }

    function renderLivePanel(m) {
      const liveNet = document.getElementById("liveNet");
      const liveBreakdown = document.getElementById("liveBreakdown");

      const entrate1 = m.r1 + m.aPerc1 + m.aFam1;
      const entrate2 = m.r2 + m.aPerc2 + m.aFam2;
      const uscite1 = m.match12 + m.esternoPag1 + m.spese1;
      const uscite2 = m.match21 + m.esternoPag2 + m.spese2;
      const diffDisp = m.disp1 - m.disp2;
      const absDiffDisp = Math.abs(diffDisp);
      liveNet.innerHTML = `
        <div class="live-k">
          Netto disponibile ${c1n()}
          <strong class="${m.disp1 >= 0 ? "ok" : "bad"}">${eur(m.disp1)}</strong>
        </div>
        <div class="live-k">
          Netto disponibile ${c2n()}
          <strong class="${m.disp2 >= 0 ? "ok" : "bad"}">${eur(m.disp2)}</strong>
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
            <div class="live-row"><span>Entrate totali (reddito + assegni + INPS)</span><strong class="ok">${eur(entrate1)}</strong></div>
            <div class="live-row"><span>Assegno mantenimento pagato all'altro coniuge</span><strong class="warn">${eur(m.match12)}</strong></div>
            <div class="live-row"><span>Assegno mantenimento pagato esterno</span><strong class="warn">${eur(m.esternoPag1)}</strong></div>
            <div class="live-row"><span>Totale spese inserite</span><strong class="warn">${eur(m.spese1)}</strong></div>
            <div class="live-row"><span>Uscite totali</span><strong class="warn">${eur(uscite1)}</strong></div>
          </div>
          <div class="live-col">
            <h4>${c2n()}</h4>
            <div class="live-row"><span>Entrate totali (reddito + assegni + INPS)</span><strong class="ok">${eur(entrate2)}</strong></div>
            <div class="live-row"><span>Assegno mantenimento pagato all'altro coniuge</span><strong class="warn">${eur(m.match21)}</strong></div>
            <div class="live-row"><span>Assegno mantenimento pagato esterno</span><strong class="warn">${eur(m.esternoPag2)}</strong></div>
            <div class="live-row"><span>Totale spese inserite</span><strong class="warn">${eur(m.spese2)}</strong></div>
            <div class="live-row"><span>Uscite totali</span><strong class="warn">${eur(uscite2)}</strong></div>
          </div>
        </div>
      `;
    }

    function renderLiveDiffFabric(m, diffDisp, absDiffDisp) {
      if (!window.fabric) return;
      const canvasEl = document.getElementById("liveDiffCanvas");
      if (!canvasEl) return;

      const w = Math.max(280, Math.round(canvasEl.parentElement.clientWidth - 16));
      const h = 156;
      canvasEl.width = w;
      canvasEl.height = h;

      if (netDiffFabricCanvas) {
        netDiffFabricCanvas.dispose();
        netDiffFabricCanvas = null;
      }

      const fc = new window.fabric.StaticCanvas(canvasEl, { selection: false, renderOnAddRemove: false });
      netDiffFabricCanvas = fc;

      const centerX = w / 2;
      const centerY = 104;
      const radius = Math.min(50, Math.max(38, (w * 0.16)));
      const totalAbs = Math.max(1, Math.abs(m.disp1) + Math.abs(m.disp2));
      const shift = (diffDisp / totalAbs) * (radius * 1.5);
      const pointerX = Math.max(centerX - radius * 1.6, Math.min(centerX + radius * 1.6, centerX + shift));

      fc.add(new window.fabric.Rect({
        left: 8,
        top: 8,
        width: w - 16,
        height: h - 16,
        rx: 16,
        ry: 16,
        fill: "#f7fcfb",
        stroke: "#b8d2cd",
        strokeWidth: 1
      }));

      const statusText = diffDisp === 0
        ? "Netti equivalenti"
        : `Vantaggio netto: ${diffDisp > 0 ? c1n() : c2n()}`;

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
          ? { bg: "#ddf2ec", stroke: "#9ccfc2", ink: "#0d625a" }
          : role === "loser"
            ? { bg: "#f8ecd9", stroke: "#dfbf8f", ink: "#8a580f" }
            : { bg: "#eaf2f0", stroke: "#bfd2cd", ink: "#3d5c59" };

        const scale = figRadius / 38;

        fc.add(new window.fabric.Circle({
          left,
          top,
          radius: figRadius,
          fill: palette.bg,
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
      const badgeAvailableW = Math.max(120, Math.min(w - 20, w - reservedForFigures));
      const badgeW = Math.min(520, badgeAvailableW);
      const badgeX = (w - badgeW) / 2;
      const badgeText = `${statusText} | Delta ${eur(absDiffDisp)}`;
      const badgeMaxFontSize = isNarrow ? 16 : (w < 560 ? 24 : 28);
      const badgeMinFontSize = isNarrow ? 12 : 10;
      const badgeInnerW = badgeW - 36;
      const badgeBaseHeight = isNarrow ? 46 : (w < 560 ? 56 : 62);

      // Allow multiline on narrow screens: shrink font only if needed, then grow badge height if text still wraps.
      let badgeFontSize = badgeMaxFontSize;
      let badgeProbe = new window.fabric.Textbox(badgeText, {
        width: badgeInnerW,
        fontSize: badgeFontSize,
        fontFamily: "Candara",
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 1.05
      });
      while (badgeProbe.height > (badgeBaseHeight - 10) && badgeFontSize > badgeMinFontSize) {
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
        top: 18,
        width: badgeW,
        height: badgeHeight,
        rx: 20,
        ry: 20,
        fill: "#ffffff",
        stroke: diffDisp === 0 ? "#98b8b3" : (diffDisp > 0 ? "#8ec3b9" : "#d9b47e"),
        strokeWidth: 1
      }));
      fc.add(new window.fabric.Textbox(badgeText, {
        left: badgeX + badgeW / 2,
        top: 18 + (badgeHeight - badgeProbe.height) / 2,
        width: badgeInnerW,
        originX: "center",
        textAlign: "center",
        lineHeight: 1.05,
        fontSize: badgeFontSize,
        fill: diffDisp === 0 ? "#355a57" : (diffDisp > 0 ? "#0e655f" : "#85520c"),
        fontFamily: "Candara",
        fontWeight: "700"
      }));

      const trackLeft = 26;
      const trackWidth = w - 52;

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
        fill: "#bfe3da"
      }));
      fc.add(new window.fabric.Rect({
        left: centerX,
        top: centerY - 9,
        width: trackWidth / 2,
        height: 18,
        rx: 9,
        ry: 9,
        fill: "#efd7b0"
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
        fill: diffDisp >= 0 ? "#0b6e66" : "#c77a11",
        stroke: "#ffffff",
        strokeWidth: 3,
        shadow: "0 2px 7px rgba(0,0,0,0.24)"
      }));

      // Side labels: full names, anchored to edges, with adaptive font size.
      const sideLabelTop = centerY + 21;
      const sideLabelMaxW = Math.max(58, trackWidth / 2 - 34);
      const sideBaseFont = 13;
      const sideFontFamily = "Candara";
      const sideFontWeight = "700";

      const leftName = c1n();
      const leftProbe = new window.fabric.Text(leftName, {
        fontSize: sideBaseFont,
        fontFamily: sideFontFamily,
        fontWeight: sideFontWeight
      });
      const leftFont = leftProbe.width <= sideLabelMaxW
        ? sideBaseFont
        : Math.max(10, Math.floor(sideBaseFont * sideLabelMaxW / leftProbe.width));

      const rightName = c2n();
      const rightProbe = new window.fabric.Text(rightName, {
        fontSize: sideBaseFont,
        fontFamily: sideFontFamily,
        fontWeight: sideFontWeight
      });
      const rightFont = rightProbe.width <= sideLabelMaxW
        ? sideBaseFont
        : Math.max(10, Math.floor(sideBaseFont * sideLabelMaxW / rightProbe.width));

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

    function calculate() {
      const m = computeModel();
      const formulaNote = document.getElementById("formulaNote");

      const modeName = m.mode === "legal"
        ? "Legale-proporzionale"
        : (m.mode === "simple" ? `Semplificata (${m.simplePerc.toFixed(0)}%)` : "Linee guida Tribunale di Genova");

      let modeSpecific = "";
      if (m.mode === "simple") {
        modeSpecific = `
          <br /><strong>Regola specifica modalita semplificata</strong>
          <br />1) Differenza netti = |Disponibilita C1 - Disponibilita C2| = ${eur(Math.abs(m.disp1 - m.disp2))}.
          <br />2) Assegno suggerito = differenza netti x ${m.simplePerc.toFixed(0)}%.
          <br />3) Paga il coniuge con disponibilita netta maggiore.
        `;
      } else if (m.mode === "genova") {
        const nonColl = m.collocatario === 1 ? 2 : 1;
        modeSpecific = `
          <br /><strong>Regola specifica linee guida Genova</strong>
          <br />1) Collocatario stimato: Coniuge ${m.collocatario} (maggiore permanenza).
          <br />2) Non collocatario: Coniuge ${nonColl}.
          <br />3) Costo giornaliero medio figli = fabbisogno figli / 30 = ${eur(m.costoGiornalieroFiglio)}.
          <br />4) Quota diretta non collocatario = costo giornaliero x giorni di permanenza presso non collocatario.
          <br />5) Assegno suggerito = max(0, quota teorica non collocatario - quota diretta non collocatario).
        `;
      } else {
        modeSpecific = `
          <br /><strong>Regola specifica modalita legale-proporzionale</strong>
          <br />1) Quota teorica = fabbisogno figli x peso contributivo del coniuge.
          <br />2) Quota diretta = fabbisogno figli x permanenza presso quel coniuge.
          <br />3) Saldo = quota teorica - quota diretta.
          <br />4) L'assegno e il saldo positivo del coniuge debitore verso l'altro.
        `;
      }

      formulaNote.innerHTML = `
        <strong>Impostazione generale del calcolo</strong>
        <br />Modalita attiva: ${modeName}.
        <br />Disponibilita netta C1 = reddito netto C1 + assegni percepiti C1 + assegni familiari C1 - assegni pagati C1 - spese C1.
        <br />Disponibilita netta C2 = reddito netto C2 + assegni percepiti C2 + assegni familiari C2 - assegni pagati C2 - spese C2.
        <br />Peso contributivo = disponibilita positiva del coniuge / somma disponibilita positive.
        <br />Fabbisogno figli stimato = totale spese inserite x 35%.

        <br /><strong>Significato delle principali voci richieste in input</strong>
        <br />- Reddito netto: entrata disponibile del coniuge (mensile oppure annuale, se selezionata base annuale).
        <br />- Assegno percepito: importo ricevuto mensilmente dal coniuge.
        <br />- Assegno pagato: importo versato mensilmente dal coniuge.
        <br />- Assegni familiari/INPS: componenti assistenziali percepite.
        <br />- Permanenza figli (%): ripartizione dei giorni medi mensili tra i due coniugi.
        <br />- Spese per voce: costi mensili attribuiti a ciascun coniuge.

        <br /><strong>Lettura dei risultati e KPI</strong>
        <br />- Netto disponibile: situazione prima del nuovo assegno calcolato dal modello.
        <br />- Totale spese inserite: somma C1 + C2 delle voci compilate.
        <br />- Quota teorica: quota di fabbisogno figli attribuita in base al peso economico.
        <br />- Post-assegno: netto disponibile dopo applicazione dell'assegno suggerito.
        <br />- Importo per figlio: assegno mensile suggerito diviso per numero figli.
        <br />- Assegno pagato esterno: quota pagata non compensata da assegni percepiti dell'altro coniuge (non accreditata all'altro).

        ${modeSpecific}
        ${m.incomeMode === "annual" ? "<br /><strong>Nota base reddito:</strong> i redditi annuali sono convertiti automaticamente in mensili (/12) prima di tutti i calcoli." : ""}
      `;

      let mainText = "Nessun trasferimento suggerito";
      if (m.assegnoDa1a2 > 0.005) {
        mainText = `${c1n()} \u2192 ${c2n()}: ${eur(m.assegnoDa1a2)} / mese`;
      } else if (m.assegnoDa2a1 > 0.005) {
        mainText = `${c2n()} \u2192 ${c1n()}: ${eur(m.assegnoDa2a1)} / mese`;
      }
      document.getElementById("risultatoMain").textContent = mainText;

      const kpi = document.getElementById("kpi");
      kpi.innerHTML = "";

      const items = [
        ["Modalita attiva", m.mode === "legal" ? "Legale-proporzionale" : (m.mode === "simple" ? `Semplificata (${m.simplePerc.toFixed(0)}%)` : "Linee guida Tribunale di Genova"), "warn"],
        ["Base reddito", m.incomeMode === "annual" ? "Annuale (convertito in mensile)" : "Mensile", "warn"],
        [`Disponibilita netta ${c1n()}`, eur(m.disp1), m.disp1 >= 0 ? "ok" : "bad"],
        [`Disponibilita netta ${c2n()}`, eur(m.disp2), m.disp2 >= 0 ? "ok" : "bad"],
        ["Totale spese inserite", eur(m.speseTot), "warn"],
        ["Fabbisogno figli stimato", eur(m.fabbisognoFigli), "warn"],
        [`Quota teorica ${c1n()}`, eur(m.quotaTeorica1), "ok"],
        [`Quota teorica ${c2n()}`, eur(m.quotaTeorica2), "ok"],
        [`Post-assegno ${c1n()}`, eur(m.post1), m.post1 >= 0 ? "ok" : "bad"],
        [`Post-assegno ${c2n()}`, eur(m.post2), m.post2 >= 0 ? "ok" : "bad"],
        ["Importo per figlio", eur((Math.max(m.assegnoDa1a2, m.assegnoDa2a1)) / m.figli), "warn"]
      ];

      items.forEach(([label, value, cls]) => {
        const el = document.createElement("div");
        el.className = "kpi-item";
        el.innerHTML = `<span>${label}</span><strong class="${cls}">${value}</strong>`;
        kpi.appendChild(el);
      });
    }

    function renderAll() {
      const m = computeModel();
      updateExpensePartials();
      renderLivePanel(m);
      calculate();
    }

    function applyState(state) {
      hydrateState(state);
      incomeModeLast = document.getElementById("incomeMode").value || "monthly";
      updateModeUi();
      renderAll();
    }

    function exportPdfDirect() {
      const m = computeModel();
      const now = new Date();
      const genDate = now.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
      const genTime = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      const c1Name = c1n();
      const c2Name = c2n();
      const c1NameEsc = escapeHtml(c1Name);
      const c2NameEsc = escapeHtml(c2Name);

      const modeName = m.mode === "legal"
        ? "Legale-proporzionale"
        : (m.mode === "simple" ? `Semplificata (${m.simplePerc.toFixed(0)}%)` : "Linee guida Tribunale di Genova");

      let assegnoText = "Nessun trasferimento";
      let assegnoDir = "";
      if (m.assegnoDa1a2 > 0.005) {
        assegnoText = eur(m.assegnoDa1a2) + " / mese";
        assegnoDir = `${c1NameEsc} &rarr; ${c2NameEsc}`;
      } else if (m.assegnoDa2a1 > 0.005) {
        assegnoText = eur(m.assegnoDa2a1) + " / mese";
        assegnoDir = `${c2NameEsc} &rarr; ${c1NameEsc}`;
      }

      const speseRows = expenseItems.map((item, i) => {
        const c1 = num(`c1_${i}`);
        const c2 = num(`c2_${i}`);
        return `<tr>
          <td>${item.label}</td>
          <td class="num">${c1 > 0 ? eur(c1) : "–"}</td>
          <td class="num">${c2 > 0 ? eur(c2) : "–"}</td>
          <td class="num bold">${(c1 + c2) > 0 ? eur(c1 + c2) : "–"}</td>
        </tr>`;
      }).join("");

      const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<title>Report Mantenimento – ${genDate}</title>
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
    <div class="rpt-title">Calcolo Mantenimento Figli</div>
    <div class="rpt-subtitle">Stima indicativa a supporto della negoziazione assistita</div>
  </div>
  <div class="rpt-meta">Generato il ${genDate}<br/>${genTime}</div>
</div>

<!-- ASSEGNO BANNER -->
<div class="banner">
  ${assegnoDir ? `
  <div>
    <div class="banner-lbl">Assegno mensile suggerito dal modello</div>
    <div class="banner-dir">${assegnoDir}</div>
  </div>
  <div>
    <div class="banner-amount">${assegnoText}</div>
    ${m.figli > 1 ? `<div class="banner-sub">${eur(Math.max(m.assegnoDa1a2, m.assegnoDa2a1) / m.figli)} per figlio</div>` : ""}
  </div>
  ` : `
  <div style="width:100%;text-align:center;padding:4px 0;">
    <div class="banner-lbl" style="font-size:9pt;margin-bottom:6px;">Assegno mensile suggerito dal modello</div>
    <div class="banner-dir" style="font-size:14pt;">✓ Nessun assegno di mantenimento necessario</div>
  </div>
  `}
</div>

<!-- LIVE PANEL (replica del blocco visivo dell'app) -->
<div class="live-panel">
  <div class="live-panel-title">Impatto in Tempo Reale sul Netto</div>
  <div class="live-net-row">
    <div class="live-net-card">
      <div class="live-net-label">Netto disponibile ${c1NameEsc}</div>
      <div class="live-net-value c1">${eur(m.disp1)}</div>
    </div>
    <div class="live-net-card">
      <div class="live-net-label">Netto disponibile ${c2NameEsc}</div>
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
            if (absDiff < 0.5) return `Parità | Delta ${eur(0)}`;
            const winner = diff > 0 ? c1NameEsc : c2NameEsc;
            return `Vantaggio netto: ${winner} | Delta ${eur(absDiff)}`;
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
    <div class="assegno-lbl">Assegno suggerito</div>
    <div class="assegno-val">${assegnoDir}: ${assegnoText}</div>
  </div>` : ""}
</div>
<div class="section">
  <div class="section-title">Parametri di Input</div>
  <div class="two-col">
    <table>
      <thead><tr><th colspan="2">Impostazioni Generali</th></tr></thead>
      <tbody>
        <tr><td>Modalità di calcolo</td><td>${modeName}</td></tr>
        <tr><td>Base reddito</td><td>${m.incomeMode === "annual" ? "Annuale (÷12 per mensile)" : "Mensile"}</td></tr>
        <tr><td>Numero figli</td><td>${m.figli}</td></tr>
        <tr><td>Permanenza ${c1n()}</td><td>${m.perm1.toFixed(0)}%</td></tr>
        <tr><td>Permanenza ${c2n()}</td><td>${m.perm2.toFixed(0)}%</td></tr>
      </tbody>
    </table>
    <table class="data-table">
      <thead><tr><th>Voce</th><th class="num">${c1n()}</th><th class="num">${c2n()}</th></tr></thead>
      <tbody>
        <tr><td>Reddito netto${m.incomeMode === "annual" ? " annuo" : " mensile"}</td>
            <td class="num">${eur(m.r1Raw)}</td><td class="num">${eur(m.r2Raw)}</td></tr>
        ${m.incomeMode === "annual" ? `<tr><td>Reddito netto mensile (÷12)</td><td class="num">${eur(m.r1)}</td><td class="num">${eur(m.r2)}</td></tr>` : ""}
        <tr><td>Assegno percepito</td><td class="num">${eur(m.aPerc1)}</td><td class="num">${eur(m.aPerc2)}</td></tr>
        <tr><td>Assegno pagato</td><td class="num">${eur(m.aPag1)}</td><td class="num">${eur(m.aPag2)}</td></tr>
        <tr><td>Assegni familiari / INPS</td><td class="num">${eur(m.aFam1)}</td><td class="num">${eur(m.aFam2)}</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- SPESE -->
<div class="section">
  <div class="section-title">Voci di Spesa</div>
  <table>
    <thead>
      <tr>
        <th>Voce</th>
        <th class="num" style="width:110px">${c1n()} €/mese</th>
        <th class="num" style="width:110px">${c2n()} €/mese</th>
        <th class="num" style="width:110px">Totale €/mese</th>
      </tr>
    </thead>
    <tbody>
      ${speseRows}
      <tr class="total-row">
        <td>TOTALE</td>
        <td class="num">${eur(m.spese1)}</td>
        <td class="num">${eur(m.spese2)}</td>
        <td class="num">${eur(m.speseTot)}</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ANALISI COMPARATIVA -->
<div class="section">
  <div class="section-title">Analisi Economica Comparativa</div>
  <div class="balance-row">
    <div class="bal-card c1">
      <div class="bal-card-title">${c1n()}</div>
      <div class="bal-line"><span class="bal-lbl">Reddito netto mensile</span><span class="bal-val">${eur(m.r1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">+ Assegno percepito</span><span class="bal-val">+ ${eur(m.aPerc1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">+ Assegni familiari</span><span class="bal-val">+ ${eur(m.aFam1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">– Assegno pagato</span><span class="bal-val">– ${eur(m.aPag1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">– Spese dirette</span><span class="bal-val">– ${eur(m.spese1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">Disponibilità netta</span>
        <span class="bal-val ${m.disp1 >= 0 ? 'green' : 'red'}">${eur(m.disp1)}</span></div>
      <div class="bal-line"><span class="bal-lbl">Peso contributivo</span><span class="bal-val">${(m.peso1 * 100).toFixed(1)}%</span></div>
      <div class="bal-line"><span class="bal-lbl">Disponibilità post-assegno</span>
        <span class="bal-val ${m.post1 >= 0 ? 'green' : 'red'}">${eur(m.post1)}</span></div>
    </div>
    <div class="bal-card c2">
      <div class="bal-card-title">${c2n()}</div>
      <div class="bal-line"><span class="bal-lbl">Reddito netto mensile</span><span class="bal-val">${eur(m.r2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">+ Assegno percepito</span><span class="bal-val">+ ${eur(m.aPerc2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">+ Assegni familiari</span><span class="bal-val">+ ${eur(m.aFam2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">– Assegno pagato</span><span class="bal-val">– ${eur(m.aPag2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">– Spese dirette</span><span class="bal-val">– ${eur(m.spese2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">Disponibilità netta</span>
        <span class="bal-val ${m.disp2 >= 0 ? 'green' : 'red'}">${eur(m.disp2)}</span></div>
      <div class="bal-line"><span class="bal-lbl">Peso contributivo</span><span class="bal-val">${(m.peso2 * 100).toFixed(1)}%</span></div>
      <div class="bal-line"><span class="bal-lbl">Disponibilità post-assegno</span>
        <span class="bal-val ${m.post2 >= 0 ? 'green' : 'red'}">${eur(m.post2)}</span></div>
    </div>
  </div>
</div>

<!-- KPI -->
<div class="section">
  <div class="section-title">Indicatori Chiave</div>
  <div class="three-col">
    <div class="kpi-box"><div class="kpi-lbl">Totale spese</div><div class="kpi-val warn">${eur(m.speseTot)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Fabbisogno figli stimato</div><div class="kpi-val warn">${eur(m.fabbisognoFigli)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Importo per figlio</div><div class="kpi-val warn">${eur(Math.max(m.assegnoDa1a2, m.assegnoDa2a1) / m.figli)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Quota teorica ${c1n()}</div><div class="kpi-val ok">${eur(m.quotaTeorica1)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Quota teorica ${c2n()}</div><div class="kpi-val ok">${eur(m.quotaTeorica2)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Assegno suggerito</div>
      <div class="kpi-val ${Math.max(m.assegnoDa1a2, m.assegnoDa2a1) > 0 ? 'warn' : 'ok'}">${eur(Math.max(m.assegnoDa1a2, m.assegnoDa2a1))}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Post-assegno ${c1n()}</div>
      <div class="kpi-val ${m.post1 >= 0 ? 'ok' : 'bad'}">${eur(m.post1)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Post-assegno ${c2n()}</div>
      <div class="kpi-val ${m.post2 >= 0 ? 'ok' : 'bad'}">${eur(m.post2)}</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Quota diretta C1 / C2</div>
      <div class="kpi-val ok" style="font-size:10pt">${eur(m.quotaDiretta1)} / ${eur(m.quotaDiretta2)}</div></div>
  </div>
</div>

<!-- NOTE METODOLOGICHE -->
<div class="note-box">
  <strong>Note metodologiche</strong> — Documento generato automaticamente con finalità illustrativa e non costituisce parere legale.
  Modalità di calcolo: <strong>${modeName}</strong>.
  Il fabbisogno figli è stimato come il 35% delle spese totali inserite.
  ${m.incomeMode === "annual" ? "I redditi inseriti in base annuale sono stati convertiti in mensili (÷12)." : ""}
  I risultati dipendono esclusivamente dai dati immessi e non sostituiscono la valutazione di un professionista.
</div>

<div class="footer">Calcolatore Mantenimento Figli — Uso privato e riservato — ${genDate}</div>

<script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`;

      const win = window.open("", "_blank");
      if (!win) {
        alert("Il popup è stato bloccato dal browser. Consenti i popup per questo sito e riprova.");
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
    }

    async function exportJson() {
      if (!authSession.username || !authSession.keyBits) {
        setAuthStatus("Effettua il login KeyLock prima di esportare JSON cifrato.", true);
        alert("Per esportare, devi prima fare login KeyLock.");
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
            throw new Error("Formato JSON non valido: e richiesto un export cifrato KeyLock");
          }

          if (!authSession.username || !authSession.keyBits) {
            throw new Error("Effettua prima il login KeyLock per importare il file cifrato");
          }

          if (normalizeUsername(payload.owner) !== normalizeUsername(authSession.username)) {
            throw new Error("Questo file appartiene a un altro utente KeyLock");
          }

          const state = await decryptStateForKey(payload.cipher, authSession.keyBits);
          if (!state || typeof state !== "object" || !state.base || !Array.isArray(state.spese)) {
            throw new Error("Contenuto decifrato non valido");
          }

          applyState(state);
          setAuthStatus("JSON cifrato importato correttamente.");
          alert("Dati caricati da JSON cifrato.");
        } catch (err) {
          setAuthStatus(`Import JSON fallito: ${err.message}`, true);
          alert(`Impossibile caricare il JSON: ${err.message}`);
        }
      };
      reader.readAsText(file, "utf-8");
    }

    function serializeState() {
      const base = {
        reddito1: num("reddito1"),
        reddito2: num("reddito2"),
        incomeMode: document.getElementById("incomeMode").value,
        numFigli: num("numFigli"),
        perm1: num("perm1"),
        calcMode: document.getElementById("calcMode").value,
        simplePerc: num("simplePerc"),
        assegnoPercepito1: num("assegnoPercepito1"),
        assegnoPagato1: num("assegnoPagato1"),
        assegnoFam1: num("assegnoFam1"),
        assegnoPercepito2: num("assegnoPercepito2"),
        assegnoPagato2: num("assegnoPagato2"),
        assegnoFam2: num("assegnoFam2")
      };
      const spese = expenseItems.map((_, i) => ({ c1: num(`c1_${i}`), c2: num(`c2_${i}`) }));
      const expenseItemsState = expenseItems.map((item) => ({ label: item.label, help: item.help }));
      return { base, spese, expenseItems: expenseItemsState,
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
      if (state.nome1 !== undefined) document.getElementById("nome1").value = state.nome1;
      if (state.nome2 !== undefined) document.getElementById("nome2").value = state.nome2;
      updateSpouseLabels();
      buildExpenseRows();
      syncPermanenza();
      state.spese.forEach((row, i) => {
        const c1 = document.getElementById(`c1_${i}`);
        const c2 = document.getElementById(`c2_${i}`);
        if (c1) c1.value = row.c1;
        if (c2) c2.value = row.c2;
      });
    }

    function resetAll() {
      document.querySelectorAll("input[type='number']").forEach((el) => {
        if (el.id !== "perm2") {
          el.value = el.defaultValue || 0;
        }
      });
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
      const btn = e.target && e.target.closest("button[data-remove-expense-idx]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-remove-expense-idx"));
      removeExpenseItemAt(idx);
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
      await loginKeyLockUser();
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

    document.getElementById("cloudHistoryList").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-history-idx]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-history-idx"));
      if (!Number.isInteger(idx) || idx < 0 || idx >= cloudProfileSession.history.length) return;
      const entry = cloudProfileSession.history[idx];
      if (!entry || !entry.state) return;
      applyState(entry.state);
      setAuthStatus("Versione storica ripristinata nel form. Salva profilo cloud per renderla corrente.");
    });

    document.addEventListener("input", (e) => {
      if (e.target && e.target.id === "permSlider") {
        syncPermanenza("slider");
        renderAll();
        return;
      }

      if (e.target && e.target.matches("input[type='number']")) {
        if (e.target.id === "perm1") {
          syncPermanenza("perm1");
        } else if (e.target.id === "perm2") {
          syncPermanenza("perm2");
        }
        renderAll();
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target && (e.target.id === "calcMode" || e.target.id === "incomeMode")) {
        if (e.target.id === "incomeMode") {
          const nextMode = document.getElementById("incomeMode").value || "monthly";
          convertIncomeValuesForModeChange(incomeModeLast, nextMode);
          incomeModeLast = nextMode;
        }
        updateModeUi();
        renderAll();
      }
    });

    populateSuggestedExpenseOptions();
    buildExpenseRows();
    initUiZoom();
    initTopActionsMenu();
    initAuthMenu();
    updateAuthUi();
    renderCloudHistoryPanel();
    syncPermanenza();
    incomeModeLast = document.getElementById("incomeMode").value || "monthly";
    updateModeUi();
    updateSpouseLabels();
    document.getElementById("nome1").addEventListener("input", () => { updateSpouseLabels(); renderAll(); });
    document.getElementById("nome2").addEventListener("input", () => { updateSpouseLabels(); renderAll(); });
    renderAll();