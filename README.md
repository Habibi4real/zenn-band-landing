# Zenn Band landing page

Single-page Zenn Band concept website. The page invites visitors to join a waitlist; it has no checkout or purchasing flow. Product imagery is an original concept render.

## Waitlist

`POST /api/waitlist` validates an email and saves it to a private Vercel Blob store. The project must be linked to the private `zenn-band-waitlist` store, which provides `BLOB_READ_WRITE_TOKEN` to the server function. The token is never sent to the browser or committed. A SHA-256 digest of the normalized email names the private blob, so repeated submissions update one record instead of creating duplicates.

If storage is temporarily unavailable, the page offers an email alternative. It does not claim signup succeeded.

## Local preview

The visual page can be viewed with any static server. The serverless waitlist endpoint runs on Vercel or with `vercel dev`.
