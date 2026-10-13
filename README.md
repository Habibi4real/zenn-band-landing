# Zenn landing page

Zenn Band-first website for joining the product waitlist. The homepage introduces the wearable as a new interface to Zenn and explains the assistant behind it. The `/band/` page expands the concept with proposed usage, control, and FAQs. The site has no checkout or purchasing flow; the Band image is an original concept render. Hardware specifications, pricing, and release date are deliberately left unconfirmed.

Production: https://zenn-band-page.vercel.app

## Waitlist

`POST /api/waitlist` validates an email and saves it to a private Vercel Blob store. The project must be linked to the private `zenn-band-waitlist` store, which provides `BLOB_READ_WRITE_TOKEN` to the server function. The token is never sent to the browser or committed. A SHA-256 digest of the normalized email names the private blob, so repeated submissions update one record instead of creating duplicates. Band interest is stored separately when a visitor signs up from the Band page. After homepage signup, an optional interests form uses a short-lived signed token and saves separate private feedback.

If storage is temporarily unavailable, the page reports the failure and does not claim signup succeeded.

## Local preview

The visual page can be viewed with any static server. The serverless waitlist endpoint runs on Vercel or with `vercel dev`.

