// Vercel serverless function: receives a signup from the Do or Don't app and
// forwards the email to beehiiv. The API key lives ONLY here, never in the
// front-end. Set BEEHIIV_API_KEY (and optionally BEEHIIV_PUBLICATION_ID) as
// Environment Variables in the Vercel project settings.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const key = process.env.BEEHIIV_API_KEY;
  if (!key) { res.status(500).json({ error: 'missing_api_key' }); return; }
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    const email = String(body.email || '').trim();
    if (!email || email.indexOf('@') === -1) { res.status(400).json({ error: 'invalid_email' }); return; }

    // Find the publication id (use env var if provided, else look it up once).
    let pubId = process.env.BEEHIIV_PUBLICATION_ID;
    if (!pubId) {
      const pr = await fetch('https://api.beehiiv.com/v2/publications', {
        headers: { Authorization: 'Bearer ' + key }
      });
      const pj = await pr.json();
      pubId = pj && pj.data && pj.data[0] && pj.data[0].id;
    }
    if (!pubId) { res.status(500).json({ error: 'no_publication' }); return; }

    const r = await fetch('https://api.beehiiv.com/v2/publications/' + pubId + '/subscriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        reactivate_existing: true,
        send_welcome_email: false,
        utm_source: (body.utm_source && String(body.utm_source).trim()) || 'do-or-dont-app',
        utm_medium: body.utm_medium ? String(body.utm_medium).trim() : undefined,
        utm_campaign: body.utm_campaign ? String(body.utm_campaign).trim() : undefined,
        referring_site: body.referring_site ? String(body.referring_site).trim() : undefined
      })
    });
    const ok = r.ok;
    res.status(ok ? 200 : 502).json({ ok: ok });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
}
