const { createHash, createHmac, timingSafeEqual, randomUUID } = require('node:crypto');
const { put } = require('@vercel/blob');
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

function sign(value) {
  return createHmac('sha256', process.env.BLOB_READ_WRITE_TOKEN).update(value).digest('hex');
}

function verifySignupToken(token) {
  const match = /^([a-f0-9]{64})\.(\d{10,13})\.([a-f0-9]{64})$/.exec(String(token || ''));
  if (!match) return null;
  const [, emailHash, expiry, signature] = match;
  if (Date.now() > Number(expiry)) return null;
  const expected = Buffer.from(sign(`${emailHash}.${expiry}`), 'hex');
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
  return emailHash;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'The waitlist is temporarily unavailable. Please try again later.' });

  try {
    if (req.body?.mode === 'integration') {
      const integration = String(req.body?.integration || '').trim();
      if (!integration || integration.length > 120) return res.status(400).json({ error: 'Enter an app or service name under 120 characters.' });
      await put(`integration-suggestions/${randomUUID()}.json`, JSON.stringify({ integration, createdAt: new Date().toISOString() }), {
        access: 'private', contentType: 'application/json'
      });
      return res.status(200).json({ ok: true });
    }
    if (req.body?.mode === 'interests') {
      const emailHash = verifySignupToken(req.body?.signupToken);
      if (!emailHash) return res.status(403).json({ error: 'This signup session expired. Please join again to share your interests.' });
      const delegate = String(req.body?.delegate || '').trim();
      const bandInterest = req.body?.bandInterest === true;
      if (delegate.length > 500 || (!delegate && !bandInterest)) return res.status(400).json({ error: 'Add a short idea or select Zenn Band.' });
      await put(`waitlist-interests/${emailHash}/${randomUUID()}.json`, JSON.stringify({ emailHash, delegate, bandInterest, createdAt: new Date().toISOString() }), { access: 'private', contentType: 'application/json' });
      return res.status(200).json({ ok: true });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    const emailHash = createHash('sha256').update(email).digest('hex');
    await put(`waitlist/${emailHash}.json`, JSON.stringify({ email, source: 'zenn-website', updatedAt: new Date().toISOString() }), {
      access: 'private', allowOverwrite: true, contentType: 'application/json'
    });
    if (req.body?.bandInterest === true) {
      await put(`band-interest/${emailHash}.json`, JSON.stringify({ emailHash, bandInterest: true, updatedAt: new Date().toISOString() }), {
        access: 'private', allowOverwrite: true, contentType: 'application/json'
      });
    }
    const expiry = String(Date.now() + 60 * 60 * 1000);
    return res.status(200).json({ ok: true, signupToken: `${emailHash}.${expiry}.${sign(`${emailHash}.${expiry}`)}` });
  } catch (error) {
    console.error('Waitlist storage unavailable', error?.name || 'unknown');
    return res.status(502).json({ error: 'Could not save right now. Please try again later.' });
  }
};
