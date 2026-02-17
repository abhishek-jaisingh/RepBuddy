# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RepBuddy is a workout tracking mobile app built with React Native (Expo SDK 54) and expo-router v6 (file-based routing). It uses a dark theme with neon green (#a6f20d) as the accent color. Weight unit is KG.

## Commands

- `npx expo start` — start the Expo dev server
- `npx expo run:ios` — build and run on iOS simulator
- `npx expo run:android` — build and run on Android emulator
- `npx expo start --web` — run in web browser

Package manager: npm (package-lock.json).

No test runner or linter is currently configured.

## Architecture

### Routing (expo-router, file-based)

- `app/_layout.tsx` — Root Stack navigator, wraps app in dark ThemeProvider
- `app/(tabs)/_layout.tsx` — Bottom tab navigator with 5 tabs: Home, Library, Routines, History, Settings
- `app/(tabs)/index.tsx` — Home screen (weekly stats, start workout CTA, recent routines)
- `app/(tabs)/exercises.tsx` — Exercise library (CRUD)
- `app/(tabs)/routines.tsx` — Routine management
- `app/(tabs)/history.tsx` — Past workout log
- `app/(tabs)/settings.tsx` — Settings (currently only data clearing)
- `app/workout/active.tsx` — Active workout session (full-screen, not in tabs)
- `app/routine/create.tsx` — Create routine (modal presentation)
- `app/routine/[id].tsx` — Edit routine

### Data Layer

All persistence uses `@react-native-async-storage/async-storage` with JSON serialization. No backend/API — everything is local-only.

- `utils/storage.ts` — CRUD functions for workouts, routines, and exercises. Each entity is stored as a JSON array under a `repbuddy_*` key.
- `types/index.ts` — Core data models: `WorkoutSet` (weight, reps), `ExerciseLog`, `Workout`, `Exercise`, `Routine`
- `utils/helpers.ts` — `generateId()` (timestamp+random), `formatDate()`, `totalVolume()`

### State Management

No global state library. Each screen loads its own data from AsyncStorage on focus using `useFocusEffect`. There is no shared context or store.

### Styling

- `constants/Colors.ts` — Central color palette (dark theme with neon green primary)
- Styles are co-located in each screen file using `StyleSheet.create()`
- Icons use `@expo/vector-icons/FontAwesome`
