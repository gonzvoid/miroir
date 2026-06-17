import { google } from 'googleapis';
import { shell } from 'electron';
import http from 'http';
import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _require = createRequire(import.meta.url);

let CLIENT_ID = '', CLIENT_SECRET = '';
try {
  const c = _require('./google-credentials.json');
  CLIENT_ID = c.clientId;
  CLIENT_SECRET = c.clientSecret;
} catch {
  console.warn('[miroir] google-credentials.json missing — Google Calendar disabled');
}
const REDIRECT_PORT = 42813;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

let tokenFile;
export function init(dataDir) { tokenFile = path.join(dataDir, 'google-tokens.json'); }

function createClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

// Store shape: { [email]: { tokens: {...}, displayName: string|null } }
async function loadAll() {
  try {
    const data = JSON.parse(await fs.readFile(tokenFile, 'utf-8'));
    // migrate: old flat single-account { access_token, refresh_token }
    if (data.access_token || data.refresh_token) return {};
    // migrate: old multi-account { email: { access_token } } → { email: { tokens, displayName } }
    const migrated = {};
    for (const [k, v] of Object.entries(data)) {
      migrated[k] = v.tokens ? v : { tokens: v, displayName: null };
    }
    return migrated;
  } catch { return {}; }
}

async function saveAll(all) {
  await fs.writeFile(tokenFile, JSON.stringify(all, null, 2), 'utf-8');
}

async function getEmail(auth) {
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const { data } = await oauth2.userinfo.get();
    return data.email;
  } catch { return `account_${Date.now()}`; }
}

export async function isConnected() {
  const all = await loadAll();
  return Object.keys(all).length > 0;
}

export async function getAccounts() {
  const all = await loadAll();
  return Object.entries(all).map(([email, v]) => ({ email, displayName: v.displayName || null }));
}

export async function setDisplayName(email, name) {
  const all = await loadAll();
  if (all[email]) { all[email].displayName = name || null; await saveAll(all); }
}

export async function connect() {
  const auth = createClient();
  const authUrl = auth.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });

  return new Promise((resolve) => {
    let resolved = false;
    const done = (r) => { if (!resolved) { resolved = true; resolve(r); } };

    const server = http.createServer(async (req, res) => {
      try {
        const u = new URL(req.url, REDIRECT_URI);
        const code = u.searchParams.get('code');
        const error = u.searchParams.get('error');
        if (error) { res.end(`Error: ${error}`); server.close(); done({ success: false, error }); return; }
        if (!code) return;
        res.end('<html><body style="font-family:system-ui;padding:48px;background:#121311;color:#ecede9"><h2 style="margin:0 0 12px">✓ Google Calendar connected</h2><p style="color:#9a9c95;margin:0">You can close this tab and go back to Miroir.</p></body></html>');
        server.close();
        const { tokens } = await auth.getToken(code);
        auth.setCredentials(tokens);
        const email = await getEmail(auth);
        const all = await loadAll();
        all[email] = { tokens, displayName: all[email]?.displayName || null };
        await saveAll(all);
        done({ success: true, email });
      } catch (e) { server.close(); done({ success: false, error: e.message }); }
    });

    server.on('error', (e) => done({ success: false, error: e.message }));
    server.listen(REDIRECT_PORT, () => shell.openExternal(authUrl));
    setTimeout(() => { try { server.close(); } catch {} done({ success: false, error: 'timeout' }); }, 120000);
  });
}

export async function disconnect(email) {
  const all = await loadAll();
  if (email) { delete all[email]; await saveAll(all); }
  else await saveAll({});
}

export async function listEvents({ timeMin, timeMax }) {
  const all = await loadAll();
  const entries = Object.entries(all);
  if (!entries.length) return { events: [], errors: {} };

  const allEvents = [];
  const errors = {};

  for (const [email, { tokens }] of entries) {
    const auth = createClient();
    auth.setCredentials(tokens);
    auth.on('tokens', async (t) => {
      const cur = await loadAll();
      if (cur[email]) { cur[email].tokens = { ...cur[email].tokens, ...t }; await saveAll(cur); }
    });
    try {
      const cal = google.calendar({ version: 'v3', auth });
      const res = await cal.events.list({
        calendarId: 'primary', timeMin, timeMax,
        singleEvents: true, orderBy: 'startTime', maxResults: 500,
      });
      allEvents.push(...(res.data.items || []).map((e) => ({
        id: `${email}:${e.id}`,
        calendarId: 'google',
        title: e.summary || '(no title)',
        start: (e.start.date || e.start.dateTime || '').slice(0, 10),
        time: e.start.dateTime ? e.start.dateTime.slice(11, 16) : null,
        loc: e.location || '',
        account: email,
      })));
    } catch (e) {
      console.error(`[google] ${email}:`, e.message);
      errors[email] = e.message;
    }
  }
  return { events: allEvents, errors };
}
