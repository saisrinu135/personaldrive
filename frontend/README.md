# Frontend — CloudVault

Next.js 16 frontend for CloudVault, built with TypeScript, Tailwind CSS, shadcn/ui components, and Framer Motion animations. Ships as a Progressive Web App (PWA).

> For full project setup and usage instructions, see the [root README](../README.md).

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across all TypeScript files |
| `npm run test` | Run unit tests once (Vitest) |
| `npm run test:watch` | Run tests in interactive watch mode |
| `npm run test:ui` | Open the Vitest browser UI |

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure the variables described there. Do not commit `.env.local` — it is git-ignored.

---

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout (providers, PWA metadata, SW registration)
│   ├── page.tsx          # Landing / home page
│   ├── dashboard/        # Main file management dashboard
│   ├── login/            # Login page
│   └── register/         # Registration page
│
├── components/
│   ├── base/             # ErrorBoundary, Toast, shared primitives
│   ├── providers/        # ThemeProvider wrapper
│   └── pwa/              # ServiceWorkerRegistration client component
│
├── contexts/
│   └── AuthContext.tsx   # JWT auth state, login/logout helpers
│
├── hooks/                # Custom React hooks
├── services/             # Typed API client functions (axios)
├── types/                # Shared TypeScript types
└── utils/                # Utility helpers

public/
├── manifest.json         # PWA web app manifest
├── sw.js                 # Service worker (cache-first + network-first strategy)
├── icon-192.png          # PWA icon — 192 × 192
└── icon-512.png          # PWA icon — 512 × 512
```

---

## PWA Support

The app is fully installable as a standalone application. See the [root README](../README.md#-installing-as-a-standalone-app-pwa) for installation instructions on desktop and mobile.

The service worker (`public/sw.js`) applies:
- **Network-first** for all `/api/*` requests
- **Cache-first** for pages and static assets (with automatic cache invalidation on update)
