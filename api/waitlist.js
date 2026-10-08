const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'The waitlist is temporarily unavailable. Please try again later.' });
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/band_waitlist`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({ email, source: 'zenn-band-page' })
    });
    if (!response.ok) {
      console.error('Waitlist storage failed', response.status);
      return res.status(502).json({ error: 'Could not join right now. Please try again later.' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Waitlist storage unavailable', error?.name || 'unknown');
    return res.status(502).json({ error: 'Could not join right now. Please try again later.' });
  }
};
