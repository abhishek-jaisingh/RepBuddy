---
name: RepBuddy Puppeteer visual testing setup
description: How to write and run visual/feature tests for RepBuddy using Puppeteer on the Expo web build
type: project
---

# RepBuddy Visual Testing with Puppeteer

## Setup
- Puppeteer is installed as a dev dependency (`npm install --save-dev puppeteer`)
- Test scripts live in `scripts/` as `.mjs` ES modules
- Run with `node scripts/<script-name>.mjs`
- Requires Expo web server running first: `npx expo start --web` (port 8081)

## Key pattern: seeding data

Expo web uses `@react-native-async-storage/async-storage` which on web maps **directly** to `window.localStorage` with **no key prefix** — keys are exactly as defined in `utils/storage.ts`:

```
repbuddy_exercises  → Exercise[]
repbuddy_workouts   → Workout[]
repbuddy_routines   → Routine[]
repbuddy_profile    → UserProfile
```

Seed via `page.evaluate()` before navigating to the screen under test:
```js
await page.evaluate(({ exercises, workouts, routines }) => {
  localStorage.setItem('repbuddy_exercises', JSON.stringify(exercises));
  localStorage.setItem('repbuddy_workouts',  JSON.stringify(workouts));
  localStorage.setItem('repbuddy_routines',  JSON.stringify(routines));
}, { exercises, workouts, routines });
```

**Important:** Seed on a blank page load first (`goto BASE_URL`), then navigate to the target route. If you seed after navigating to the route, the app may have already loaded with empty data.

## iPhone mobile view

```js
await page.emulate({
  name: 'iPhone 14 Pro',
  viewport: { width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: false },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ...',
});
```

## Routing

Active workout with a routine: `http://localhost:8081/workout/active?routineId=<id>`

## Assertion tips

- Use `page.waitForFunction(() => document.body.innerText.includes('LAST TIME'))` to wait for async-rendered cards
- For string checks: use **specific** strings (e.g. `'25 reps'`, `'1,775'`) not bare numbers — bare numbers like `'25'` will false-negative match other content on screen
- Volume for weighted exercises renders as locale-formatted: `1,775` not `1775`

## Example test
`scripts/test-last-workout-feature.mjs` — tests that the "LAST TIME" card shows:
- Total volume (kg) for weighted exercises
- Total reps for bodyweight exercises

**Why:** The seeded past workout has Bench Press (80kg×8, 80kg×8, 82.5kg×6 = 1,775 kg) and Pull Ups (10+8+7 = 25 reps). These specific numbers confirm the summary line renders correctly.
