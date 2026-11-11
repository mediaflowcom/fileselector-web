/*
 * Mock integration backend for the dev server (npm run serve). NOT part of the file selector build.
 *
 * Plays the role of a plugin/add-on backend: it exchanges the refresh token for access tokens
 * server-side, so the file selector itself only ever gets access tokens (auth: 'accesstoken').
 *
 *   POST /mock-integration/token
 *   { domain, client_id, client_secret, refresh_token, username?, lifetime? }
 *   -> { access_token, expires_in, token_type }
 *
 * - username given  -> user token (files, folders, CDN, …)
 * - username absent -> integration token (users/me)
 * - lifetime (s)    -> reports a shorter expires_in, so the file selector's renewal can be tested
 *
 * A real integration keeps client_id/client_secret/refresh_token on its backend; the test page sends
 * them here only because the credentials are picked in the test page.
 */
const ALLOWED_DOMAINS = ['mediaflow.com', 'mediaflow.tech'];

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 10000) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

let issued = 0;

module.exports = function mockIntegrationBackend(app) {
  app.post('/mock-integration/token', async (req, res) => {
    let p;
    try {
      p = await readJson(req);
    } catch (e) {
      return send(res, 400, { error: 'invalid JSON' });
    }
    if (!ALLOWED_DOMAINS.includes(p.domain)) {
      return send(res, 400, { error: 'domain must be one of ' + ALLOWED_DOMAINS.join(', ') });
    }
    if (!p.client_id || !p.client_secret || !p.refresh_token) {
      return send(res, 400, { error: 'client_id, client_secret and refresh_token are required' });
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: p.client_id,
      client_secret: p.client_secret,
      refresh_token: p.refresh_token,
    });
    const kind = p.username ? `user token (username=${p.username})` : 'integration token (no username)';
    if (p.username) body.append('username', p.username);

    try {
      const r = await fetch(`https://accounts.${p.domain}/oauth2/token`, { method: 'POST', body });
      const text = await r.text();
      if (!r.ok) {
        console.warn(`[mock-integration] ${kind}: token endpoint answered ${r.status}`);
        return send(res, 502, { error: `token endpoint answered ${r.status}`, body: text.slice(0, 500) });
      }
      const o = JSON.parse(text);
      let expiresIn = Number(o.expires_in) || undefined;
      const lifetime = Number(p.lifetime);
      if (lifetime > 0) expiresIn = expiresIn ? Math.min(expiresIn, lifetime) : lifetime;
      issued++;
      console.log(`[mock-integration] #${issued} issued ${kind}, expires_in=${expiresIn}` +
        (lifetime > 0 ? ` (reported lifetime overridden, real: ${o.expires_in})` : ''));
      return send(res, 200, { access_token: o.access_token, expires_in: expiresIn, token_type: o.token_type || 'Bearer' });
    } catch (e) {
      console.warn(`[mock-integration] ${kind}: ${e.message}`);
      return send(res, 502, { error: e.message });
    }
  });
};
