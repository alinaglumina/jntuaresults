# JNTUA Results Portal (jntuaresults)

React (Vite) front end + Express/MongoDB API. Staff log in at `/admin` and publish
results by uploading a file (Excel, PDF or any format) or giving a link.

- **Excel/CSV results are private by design.** "Show" opens a page where a student enters a hall ticket number and ticks
  "I am human" (hCaptcha); only that student's rows are shown. The whole sheet can never be downloaded by the public.
- PDF/other files open or download directly. Link-type results open the external link.
- Home page lists results newest first, 25 per page, with search.

## Folders
- `client/`  React site  -> deploy on Vercel (Root Directory: `client`)
- `server/`  Express API -> deploy on Render (Root Directory: `server`)

## Excel format (important)
Each sheet must have a header row (within the first 10 rows) containing a column titled like
**Hall Ticket No** (also accepted: Hallticket, HTNO, Roll No, Regd No, Registration No). Students go under it.
- One row per student, or several rows per student (e.g. one per subject); all rows for a hall ticket are shown together.
- Shown above the table: the hall ticket and the **Student Name** column (any column whose title contains "Name", other than Subject/Course/Branch names). Every other column becomes a column of the subject table, in the same order (S.No columns are left out). So a sheet like
  `S.No | Hall Ticket No | Student Name | Subject Code | Subject Name | Internal Marks | External Marks | Total Marks | Result Status | Credits | Grade` shows exactly like the portal's reference page.
- Several sheets are fine. Sheets without such a column (e.g. a Summary tab) are skipped.
- If no sheet has the column, the upload is rejected with a clear message.
- Re-uploading a file on "Edit" replaces all stored rows for that result.

## hCaptcha (the "I am human" box)
Create a free account at https://dashboard.hcaptcha.com, add a site for your domains, and copy the **site key** and **secret**.
- Render (server): `HCAPTCHA_SECRET=<secret>`  (required in production)
- Vercel (client): `VITE_HCAPTCHA_SITEKEY=<site key>`  (redeploy after adding)
Locally, with both blank, hCaptcha's public test key is used and verification is skipped.

## 1. Server (Render)
1. Create a MongoDB Atlas database (e.g. `jntuaresults`) and a Cloudflare R2 bucket (private).
2. Render -> New Web Service from this repo. Root Directory `server`, Build `npm install`, Start `npm start`.
3. Environment variables (see `server/.env.example`):
   MONGODB_URI, JWT_SECRET (long random), CLIENT_ORIGIN (comma-separated front-end URLs),
   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, HCAPTCHA_SECRET, NODE_ENV=production.
4. Create the first admin (run once, from `server/` with a local `.env` that has ADMIN_EMAIL and ADMIN_PASSWORD):
   `npm install && npm run seed-admin`
   Re-running it with a new ADMIN_PASSWORD resets that admin's password.

## 2. Client (Vercel)
1. Import the repo, Root Directory `client`, framework Vite. Project name: `jntuaresults`.
2. In `client/vercel.json` the API address is `https://jntuaresults-server.onrender.com`.
   Change it to your real Render service URL if it differs.
3. Add `https://jntuaresults.vercel.app` (and your custom domain) to `CLIENT_ORIGIN` on Render.

## Local development
    cd server && cp .env.example .env   # fill it in; leave R2_* blank to store files in ./uploads
    npm install && npm run seed-admin && npm run dev
    cd ../client && npm install && npm run dev      # http://localhost:5173, /api is proxied to :5000

## Notes
- Allowed: any file type up to 25 MB, except ones a browser could execute (.exe, .html, .js, .svg, .sh ...).
- Unpublish a result with the "Published" box (it stays in the admin list but is hidden from the site).
- Deleting a result also deletes its stored file.
