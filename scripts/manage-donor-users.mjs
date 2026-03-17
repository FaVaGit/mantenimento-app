#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function loadDotEnvFromWorkspaceRoot() {
  try {
    const root = process.cwd();
    const envPath = path.join(root, '.env');
    if (!fs.existsSync(envPath)) return;

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = String(content || '').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!key || process.env[key] != null) continue;
      process.env[key] = value;
    }
  } catch (_) {
    // best effort only
  }
}

loadDotEnvFromWorkspaceRoot();

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const mode = String(getArg('mode', '') || '').trim().toLowerCase();
const usernamesRaw = String(getArg('users', '') || '').trim();
const emailsRaw = String(getArg('emails', '') || '').trim();
const dryRun = hasFlag('dry-run');

const supabaseUrl = String(process.env.DONOR_ADMIN_SUPABASE_URL || process.env.AUTH_URL_LOGIN_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const serviceRoleKey = String(process.env.DONOR_ADMIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function usage() {
  console.log([
    'Usage:',
    '  node scripts/manage-donor-users.mjs --mode=grant --users=favagit,fabio.vacchino',
    '  node scripts/manage-donor-users.mjs --mode=revoke --users=favagit',
    '  node scripts/manage-donor-users.mjs --mode=grant --emails=user1@example.com,user2@example.com',
    '',
    'Options:',
    '  --mode=grant|revoke      Required',
    '  --users=a,b,c            Comma-separated username local parts (email before @)',
    '  --emails=a@x.com,b@y.it  Comma-separated full emails',
    '  --dry-run                Print actions without writing changes',
    '',
    'Environment variables:',
    '  DONOR_ADMIN_SUPABASE_URL',
    '  DONOR_ADMIN_SUPABASE_SERVICE_ROLE_KEY'
  ].join('\n'));
}

if (!mode || !['grant', 'revoke'].includes(mode)) {
  usage();
  fail('\nMissing or invalid --mode. Use grant or revoke.');
}

const targetUsers = new Set(parseCsv(usernamesRaw));
const targetEmails = new Set(parseCsv(emailsRaw));
if (!targetUsers.size && !targetEmails.size) {
  usage();
  fail('\nSpecify at least one target via --users or --emails.');
}

if (!supabaseUrl) {
  fail('Missing DONOR_ADMIN_SUPABASE_URL (or AUTH_URL_LOGIN_SUPABASE_URL).');
}
if (!serviceRoleKey) {
  fail('Missing DONOR_ADMIN_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json'
};

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function listAllUsers() {
  const out = [];
  let page = 1;
  while (true) {
    const url = `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`;
    const response = await fetchJson(url, { headers });
    if (!response.ok) {
      const err = String(response.body?.msg || response.body?.error || `HTTP ${response.status}`);
      fail(`Cannot list users: ${err}`);
    }

    const users = Array.isArray(response.body?.users) ? response.body.users : [];
    out.push(...users);
    if (!users.length || users.length < 1000) break;
    page += 1;
  }
  return out;
}

function emailLocalPart(email) {
  return String(email || '').trim().toLowerCase().split('@')[0] || '';
}

function shouldTargetUser(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  const local = emailLocalPart(email);
  if (targetEmails.has(email)) return true;
  if (targetUsers.has(local)) return true;
  return false;
}

function truthy(value) {
  if (value === true || value === 1) return true;
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function patchUserMetadata(existingMeta, selectedMode) {
  const next = { ...(existingMeta && typeof existingMeta === 'object' ? existingMeta : {}) };
  if (selectedMode === 'grant') {
    next.is_donor = true;
    next.role = 'donor';
    return next;
  }

  delete next.is_donor;
  delete next.isDonor;
  delete next.premium;
  if (String(next.role || '').trim().toLowerCase() === 'donor') {
    delete next.role;
  }
  return next;
}

function isAlreadyAligned(existingMeta, selectedMode) {
  const meta = existingMeta && typeof existingMeta === 'object' ? existingMeta : {};
  if (selectedMode === 'grant') {
    return truthy(meta.is_donor) && String(meta.role || '').trim().toLowerCase() === 'donor';
  }

  return !truthy(meta.is_donor)
    && !truthy(meta.isDonor)
    && !truthy(meta.premium)
    && String(meta.role || '').trim().toLowerCase() !== 'donor';
}

async function updateUserMetadata(userId, nextMeta) {
  const url = `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`;
  const response = await fetchJson(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ user_metadata: nextMeta })
  });

  if (!response.ok) {
    const err = String(response.body?.msg || response.body?.error || `HTTP ${response.status}`);
    throw new Error(err);
  }
}

(async () => {
  const allUsers = await listAllUsers();
  const targets = allUsers.filter(shouldTargetUser);

  if (!targets.length) {
    console.log('No matching users found.');
    process.exit(0);
  }

  let changed = 0;
  let skipped = 0;

  for (const user of targets) {
    const email = String(user?.email || '').trim().toLowerCase();
    const userId = String(user?.id || '').trim();
    const currentMeta = user?.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};

    if (!userId || !email) {
      skipped += 1;
      continue;
    }

    if (isAlreadyAligned(currentMeta, mode)) {
      console.log(`[skip] ${email} already aligned for mode=${mode}`);
      skipped += 1;
      continue;
    }

    const nextMeta = patchUserMetadata(currentMeta, mode);
    if (dryRun) {
      console.log(`[dry-run] would ${mode} donor for ${email}`);
      changed += 1;
      continue;
    }

    await updateUserMetadata(userId, nextMeta);
    console.log(`[ok] ${mode} donor for ${email}`);
    changed += 1;
  }

  console.log(`Done. targets=${targets.length} changed=${changed} skipped=${skipped} dryRun=${dryRun}`);
})();
