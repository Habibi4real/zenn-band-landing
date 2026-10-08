# Zenn Band landing page

Single-page Zenn Band concept website. The page invites visitors to join a waitlist; it has no checkout or purchasing flow. Product imagery is an original concept render.

## Waitlist setup

1. Apply `supabase/band_waitlist.sql` to the Zenn Supabase project.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project environment. Never expose the service role key to the browser or commit it.
3. Deploy to Vercel. `POST /api/waitlist` validates the email and stores it in `band_waitlist`, ignoring duplicates.

Until step 1 and 2 are complete, the form returns an explicit temporary-unavailable message and offers an email alternative. It does not claim signup succeeded.

## Local preview

The visual page can be viewed with any static server. The serverless waitlist endpoint runs on Vercel or with `vercel dev`.
