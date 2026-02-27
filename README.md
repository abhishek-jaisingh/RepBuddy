# RepBuddy

A minimalist workout tracker built for people who just want to log their lifts and get back to the gym. No accounts, no subscriptions, no cloud — everything stays on your device.

**Live web app → [repbuddy.vercel.app](https://repbuddy.vercel.app)**

---

## Features

- **Exercise Library** — create and manage your own exercises
- **Routines** — build routines with ordered exercise lists
- **Active Workout** — log sets with weight (kg) and reps; auto-fills last used weight per exercise
- **History** — browse all past workouts with volume totals
- **Export** — export workout history as Markdown to paste into any LLM for insights
- **Profile** — track age, bodyweight, and height alongside your workout data
- **Dark theme** — easy on the eyes in the gym

## Stack

- [Expo](https://expo.dev) SDK 54 (React Native)
- [expo-router](https://expo.github.io/router) v6 — file-based routing
- [`@react-native-async-storage`](https://github.com/react-native-async-storage/async-storage) — local-only storage, no backend
- [@expo/vector-icons](https://icons.expo.fyi) — FontAwesome icons

## Running locally

```bash
npm install

# Web
npx expo start --web

# iOS simulator
npx expo run:ios

# Android emulator
npx expo run:android
```

## Deploying to web

```bash
npm run build:web       # exports to dist/ and fixes asset paths for Vercel
npx vercel --prod       # deploy to production
```

The `build:web` script runs `expo export --platform web` and then renames `node_modules` → `vendor` inside `dist/assets/` so Vercel serves the font files correctly.

## Project structure

```
app/
  _layout.tsx           # Root stack navigator
  (tabs)/
    _layout.tsx         # Bottom tab navigator
    index.tsx           # Home — weekly stats + start workout
    exercises.tsx       # Exercise library (CRUD)
    routines.tsx        # Routine list
    history.tsx         # Past workouts
    settings.tsx        # Profile, export, data management
  workout/
    active.tsx          # Active workout session
  routine/
    create.tsx          # New routine
    [id].tsx            # Edit routine

utils/
  storage.ts            # AsyncStorage CRUD for all entities
  helpers.ts            # generateId, formatDate, totalVolume, workoutsToMarkdown

types/
  index.ts              # WorkoutSet, ExerciseLog, Workout, Exercise, Routine, UserProfile

constants/
  Colors.ts             # Dark theme palette (neon green #a6f20d accent)
```

## Data model

All data lives in `AsyncStorage` under `repbuddy_*` keys — no server, no sync.

| Key | Contents |
|---|---|
| `repbuddy_workouts` | `Workout[]` — completed sessions |
| `repbuddy_routines` | `Routine[]` — exercise templates |
| `repbuddy_exercises` | `Exercise[]` — exercise library |
| `repbuddy_profile` | `UserProfile` — age, weight, height |

---

*Made with ~~❤️~~ 🤖*
