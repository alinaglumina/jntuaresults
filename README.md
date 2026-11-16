# JNTUA Results Portal (jntuaresults)

React (Vite) front end + Express/MongoDB API. Staff log in at `/admin` and publish
results by uploading a file (Excel, PDF or any format) or giving a link.

- Excel/CSV results open **inside the site** as a searchable table (25 rows per page) with a Download button.
- PDF/other files open or download directly. Link-type results open the external link.
- Home page lists results newest first, 25 per page, with search.

## Folders
- `client/`  React site  -> deploy on Vercel (Root Directory: `client`)
- `server/`  Express API -> deploy on Render (Root Directory: `server`)

## 1. Server (Render)
1. Create a MongoDB Atlas database (e.g. `jntuaresults`) and a Cloudflare R2 bucket (private).
2. Render -> New Web Service from this repo. Root Directory `server`, Build `npm install`, Start `npm start`.
3. Environment variables (see `server/.env.example`):
   MONGODB_URI, JWT_SECRET (long random), CLIENT_ORIGIN (comma-separated front-end URLs),
   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
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
