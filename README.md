# FOCUS TUTORIALS UI — Vercel test package

This package adapts the existing FOCUS TUTORIALS UI Express application for a separate Vercel test deployment. It retains the existing student/admin portal, registration and login, subscription plans, payment submission and manual approval, registration email (Resend and SMTP), learning materials, announcements, tutorial schedules, student support requests, subscription expiry handling, and CSV export.

## Important: keep the test separate

Use the **separate Neon test project** for `DATABASE_URL`. Do not use the production database connection string from the existing Render website. This package does not connect to GitHub, deploy itself, change DNS, or modify the Render website.

## Vercel setup

1. Upload the contents of this folder to your separate GitHub test repository.
2. Import that repository into Vercel as a new project.
3. Set the environment variables below in the Vercel project settings. Use the separate Neon test database connection string.
4. Deploy the test project only after the environment variables are set.

### Required environment variables

- `DATABASE_URL`: connection string for the separate Neon **test** database.
- `SESSION_SECRET`: a random secret of at least 32 characters.
- `ADMIN_EMAIL`: administrator email for the test portal.
- `ADMIN_PASSWORD`: strong administrator password (at least 12 characters recommended).
- `ADMIN_NAME`: administrator display name.
- `SITE_URL`: the Vercel test URL.

### Email settings

For Resend, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `RESEND_FROM` (a sender address on a domain verified inside Resend). A Vercel website domain by itself does **not** automatically authorize email sending: add the domain in Resend, publish the DNS records Resend supplies at your domain DNS provider, wait until Resend shows the domain as verified, then use an address such as `FOCUS TUTORIALS UI <noreply@your-verified-domain>` for `RESEND_FROM`. Set `SITE_URL` to the exact deployed Vercel URL. Keep the API key private in Vercel Environment Variables. Alternatively set `EMAIL_PROVIDER=smtp` and configure `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, and optionally `SMTP_FROM`. Email delivery is not required for login or payment review to work.

## File uploads on Vercel — Supabase Storage is integrated

Payment receipts and learning materials upload **directly from the browser to your private Supabase Storage bucket** using short-lived signed upload URLs. The file bytes do not pass through the Vercel Function, avoiding Vercel's request-body limit. Neon stores the file metadata and private Storage object path. Existing BYTEA uploads remain readable for older records.

Add these Vercel environment variables (Production/Preview as appropriate):

- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_BUCKET`: the exact name of the private bucket you created.
- `SUPABASE_SECRET_KEY`: server-only Supabase secret key (or `SUPABASE_SERVICE_ROLE_KEY` for a legacy service-role JWT). Never put this value in frontend code or commit it.
- `SUPABASE_PUBLISHABLE_KEY`: your Supabase publishable/anon key, used only as the public API key during the signed browser upload.

The upload signing handler accepts Supabase Storage signed URL response formats (`signedURL`, `signedUrl`, or `url`) and the token-based response, and constructs the complete Storage URL before returning it to the browser. The app uses a 5 MB receipt limit (JPG/PNG/PDF) and a 20 MB learning-material limit (PDF, Office documents, JPG/PNG). Configure the bucket's maximum file size to **20 MB** in Supabase Storage. Keep the bucket private; the app creates short-lived signed URLs for authorized receipt/material viewing. The app automatically adds nullable `storage_path` columns and makes legacy BYTEA columns nullable when it starts; existing stored files are not migrated or deleted.

The upload flow is: authenticated user requests a one-time upload URL → browser sends the file directly to Supabase → server verifies the stored object → Neon records the metadata. Admin-only receipt access and student-authenticated material access are retained. Deleting a payment or material also removes its Supabase object.

**Testing limitation:** this source package can be checked locally, but a real end-to-end Storage test requires your Supabase project URL and server-side key, plus the separate Neon test database. Do not send secret keys in chat. Configure them in Vercel environment settings, then test one small receipt and one learning material after deployment.

## Quick deployment checks

After deployment, open `/api/health`; it should return JSON with `ok: true`. `storageConfigured: true` confirms the required Supabase URL and server key are present (it does not replace a real upload test). Test `/login` and `/register` on both desktop and a phone. The mobile header is configured to keep **Sign in** visible beside **Join a class**. If Vercel shows an older page after redeployment, open the site in a private/incognito tab or clear the installed app/browser cache once.

## Local development

Requires Node.js 20 or newer and a PostgreSQL database. Copy `.env.example` to `.env`, fill in test credentials, then run:

```bash
npm install
npm start
```

The app creates its required tables when it starts. The first administrator is created from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` if that email is not already present in the database.

## Existing payment rule

Submitting payment details and a receipt only creates a pending payment. A subscription is activated only after an administrator approves the payment in the admin dashboard.
