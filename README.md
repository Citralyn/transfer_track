# Transfer Track

Transfer Track is a social networking and academic opportunity platform specifically for California transfer students and 4-year university professors.

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (UI/Global state) + TanStack Query (Server state)
- **Backend**: Supabase (Database, Auth, Storage)
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Features

- **Multi-step Onboarding**: Customized paths for Community College Students and 4-year Professors.
- **Academic Feed**: Social-style feed for sharing research, advice, and updates.
- **Opportunities Board**: Professors can post research assistantships, lab openings, and workshops.
- **Network Discovery**: Search and connect with students and professors across California.
- **Rich Profiles**: Role-specific profile sections highlighting transfer goals or research areas.
- **Dark Mode Support**: Elegant transitions between light and dark themes.

## Getting Started

### 1. Prerequisites

- Node.js (v18+)
- A Supabase account

### 2. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the contents of `supabase/schema.sql`.
3. Go to **Project Settings -> API** to get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Folder Structure

- `src/components/`: Reusable UI and feature-specific components.
- `src/pages/`: Main application routes.
- `src/layouts/`: Application layouts (Main, Auth).
- `src/store/`: Zustand state management.
- `src/hooks/`: Custom hooks and TanStack Query logic.
- `src/lib/`: Third-party library configurations (Supabase).
- `src/styles/`: Global styles and Tailwind configuration.
- `supabase/`: SQL schema and migration files.

## Project Vision

Transfer Track aims to bridge the gap between California's Community College system and major 4-year universities by fostering meaningful academic connections early in a student's journey.
