# ShelfLog — Personal Video Game Tracker PWA

**ShelfLog** is an offline-first Progressive Web App (PWA) for cataloging video games, tracking play status (`Backlog`, `Playing`, `Completed`, `Dropped`), logging hours played, managing favorites, and recording play-session logs. Built for Responsi Modul 5 Praktikum PPB using the practicum stack.

## Tech Stack

- **Frontend**: React 19, Vite, Lucide React
- **PWA & Offline**: `vite-plugin-pwa` (Workbox service worker + Web App Manifest + `localStorage` read-through cache & draft persistence)
- **API Client & Backend**: Axios + Supabase PostgREST (`/rest/v1/*`) and Supabase Storage (`/storage/v1/object/game-covers/*`)
- **Hosting**: Vercel

## Pages & Features

- **Shelf**: Searchable, filterable (status + platform), and sortable library with summary counters (`Total Games`, `Playing`, `Completed`, `Total Hours`) and offline cache fallback.
- **Game Detail & Play Logs**: Full game synopsis, specs grid, playthrough milestones, and session log CRUD (`game_logs`).
- **Log Game / Edit Game**: Two-step CRUD form with Supabase Storage cover uploads (and built-in SVG platform presets) plus 30-second auto-saved drafts in `localStorage`.
- **Favorites**: Pinned shortlist synced with `game_favorites` and `localStorage` offline fallback.
- **Profile**: Displays **Nama**, **NIM**, and **Kelompok** alongside avatar upload, UUID copy, live shelf metrics, `Replay Intro`, and local cache controls.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project URL (root origin without `/rest/v1/`) and publishable key:
   ```env
   VITE_API_BASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```
   > Never place `sb_secret_...` keys in `.env` or frontend code.
3. Ensure your Supabase project has the `public.games`, `public.game_favorites`, and `public.game_logs` tables (with RLS policies) plus the public `game-covers` Storage bucket configured.
4. Start development or production preview:
   ```bash
   npm run dev      # local development server
   npm run lint     # run oxlint
   npm run build    # build production bundle + sw.js + manifest
   npm run preview  # serve production build locally
   ```

## Deploying to Vercel

1. Push this repository (without `.env`) to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. In **Project Settings → Environment Variables**, add:
   - `VITE_API_BASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Deploy — [vercel.json](vercel.json) configures SPA rewrites and Service Worker / Manifest headers automatically.

