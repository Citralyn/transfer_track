# Transfer Track

Transfer Track is a solo hackathon MVP built with React, TypeScript, Vite, and Tailwind CSS.

## What it does

- Collects a transfer student profile with community college, major, completed courses, interests, and career goals
- Stores the profile in localStorage for a demo-ready workflow
- Recommends professors and research opportunities with rule-based matching
- Shows course prep resources and transfer readiness next steps
- Lets a student "Express Interest" in a professor and saves the request locally
- Includes a professor dashboard for interested students

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Build the app:

```bash
npm run build
```

## Project structure

- `src/App.tsx` — app routes and page wiring
- `src/pages/` — landing, onboarding, dashboard, professor detail, professor dashboard
- `src/components/` — cards, navbar, checklist, badges
- `src/data/` — mock professors, opportunities, resources
- `src/lib/` — matching logic and localStorage helpers
- `src/types/` — shared TypeScript models

## Notes

- This MVP uses localStorage and mock data only
- No authentication, backend, or real database is included
- Tailwind CSS is enabled via the Vite plugin and `@import "tailwindcss"` in `src/index.css`
