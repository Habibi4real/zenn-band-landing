// Run locally with `npm run export:waitlist`. CSV files stay in the ignored exports/ folder.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { list, get } = require('@vercel/blob');

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  const envFile = path.join(__dirname, '.env.local');
  if (fs.existsSync(envFile)) {
    const line = fs.readFileSync(envFile, 'utf8').split(/\r?\n/).find(item => item.startsWith('BLOB_READ_WRITE_TOKEN='));
    if (line) process.env.BLOB_READ_WRITE_TOKEN = line.slice('BLOB_READ_WRITE_TOKEN='.length).trim().replace(/^(["'])(.*)\1$/, '$2');
  }
}
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is required. Run `vercel env pull .env.local` first.');

async function allPaths(prefix) {
  const paths = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    paths.push(...page.blobs.map(blob => blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return paths;
}

async function readJson(pathname) {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200) throw new Error(`Could not read ${pathname}`);
  return JSON.parse(await new Response(result.stream).text());
}

function csvCell(value) {
  let text = String(value ?? '');
  // Keep spreadsheet programs from interpreting user supplied ideas as formulas.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function writeCsv(filename, columns, rows) {
  const directory = path.join(__dirname, 'exports');
  fs.mkdirSync(directory, { recursive: true });
  const content = [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  const output = path.join(directory, filename);
  fs.writeFileSync(output, '\uFEFF' + content, { mode: 0o600 });
  return output;
}

(async () => {
  const [signupPaths, ideaPaths, bandPaths] = await Promise.all([
    allPaths('waitlist/'), allPaths('waitlist-interests/'), allPaths('band-interest/')
  ]);
  const signups = await Promise.all(signupPaths.map(readJson));
  const ideas = await Promise.all(ideaPaths.map(readJson));
  const bandHashes = new Set(bandPaths.map(item => path.basename(item, '.json')));
  const emailByHash = new Map(signups.map(item => [createHash('sha256').update(item.email).digest('hex'), item.email]));
  const signupRows = signups.map(item => {
    const hash = createHash('sha256').update(item.email).digest('hex');
    return [item.email, item.updatedAt, bandHashes.has(hash) ? 'yes' : 'no', hash];
  });
  const ideaRows = ideas.map(item => [emailByHash.get(item.emailHash) || '', item.delegate || '', item.createdAt, item.bandInterest ? 'yes' : 'no', item.emailHash]);
  signupRows.sort((a, b) => a[1].localeCompare(b[1]));
  ideaRows.sort((a, b) => a[2].localeCompare(b[2]));
  const emailsFile = writeCsv('waitlist-emails.csv', ['email', 'joined_at', 'band_interest', 'signup_hash'], signupRows);
  const ideasFile = writeCsv('waitlist-ideas.csv', ['email', 'idea', 'submitted_at', 'band_interest', 'signup_hash'], ideaRows);
  console.log(`Exported ${signupRows.length} signup(s) and ${ideaRows.length} response(s).`);
  console.log(`Saved ${emailsFile} and ${ideasFile}`);
})().catch(error => { console.error(`Export failed: ${error.message}`); process.exitCode = 1; });
