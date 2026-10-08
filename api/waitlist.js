const { createHash } = require('node:crypto');
const { put } = require('@vercel/blob');
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'The waitlist is temporarily unavailable. Please try again later.' });
  try {
    const id = createHash('sha256').update(email).digest('hex');
    await put(`waitlist/${id}.json`, JSON.stringify({ email, source: 'zenn-band-page', updatedAt: new Date().toISOString() }), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/json'
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Waitlist storage unavailable', error?.name || 'unknown');
    return res.status(502).json({ error: 'Could not join right now. Please try again later.' });
  }
};
