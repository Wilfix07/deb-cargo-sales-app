Inventory App

Overview

Modern inventory and sales tracking app built with React + Vite, Tailwind CSS, and Supabase.

Getting Started

1) Prerequisites
- Node.js 18+
- npm 9+

2) Install dependencies

```bash
npm install
```

3) Environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

4) Run the app (development)

```bash
npm run dev
```

5) Build for production

```bash
npm run build
```

Scripts

- `npm run dev`: Start Vite dev server
- `npm run build`: Build production assets
- `npm run preview`: Preview production build locally
- `npm run lint`: Run ESLint

Project Notes

- This project uses Vite. Only variables prefixed with `VITE_` are exposed to the client.
- Supabase client is configured in `src/lib/supabase.ts` and expects the two env vars above.
- Build artifacts in `dist/` and dependencies in `node_modules/` are ignored by Git.

Deploying

- Netlify: A `netlify.toml` is included. After building, deploy the `dist/` directory.
- Any static host: Serve the `dist/` directory after `npm run build`.

License

Proprietary – all rights reserved unless a LICENSE file is added.
