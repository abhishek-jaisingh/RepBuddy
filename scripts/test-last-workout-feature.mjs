/**
 * Visual test: "Last workout volume/reps" feature
 *
 * What it does:
 *  1. Seeds localStorage with exercises + a past workout containing both
 *     weighted (Bench Press) and bodyweight (Pull Ups) exercises
 *  2. Opens the active workout screen in Chrome (iPhone 14 Pro viewport)
 *  3. Waits for the LAST TIME card to render
 *  4. Takes a screenshot so you can visually confirm the feature works
 *
 * Run:  node scripts/test-last-workout-feature.mjs
 * Requires Expo web server to be running:  npx expo start --web
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:8081';

// ─── Seed data ────────────────────────────────────────────────────────────────

const EXERCISES = [
  { id: 'ex-bench',    name: 'Bench Press',  muscleGroup: 'Chest', equipment: 'Barbell', bodyweight: false },
  { id: 'ex-pullups',  name: 'Pull Ups',     muscleGroup: 'Back',  bodyweight: true },
  { id: 'ex-squat',    name: 'Squat',        muscleGroup: 'Legs',  equipment: 'Barbell', bodyweight: false },
];

// A past workout done yesterday
const PAST_WORKOUT = {
  id: 'workout-past-1',
  date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  durationMs: 3600000,
  exercises: [
    {
      id: 'log-bench-1',
      exerciseId: 'ex-bench',
      name: 'Bench Press',
      bodyweight: false,
      sets: [
        { weight: 80, reps: 8 },   // 640
        { weight: 80, reps: 8 },   // 640
        { weight: 82.5, reps: 6 }, // 495 → total: 1775 kg
      ],
    },
    {
      id: 'log-pullups-1',
      exerciseId: 'ex-pullups',
      name: 'Pull Ups',
      bodyweight: true,
      sets: [
        { weight: 0, reps: 10 },
        { weight: 0, reps: 8 },
        { weight: 0, reps: 7 }, // total: 25 reps
      ],
    },
    {
      id: 'log-squat-1',
      exerciseId: 'ex-squat',
      name: 'Squat',
      bodyweight: false,
      sets: [
        { weight: 100, reps: 5 },
        { weight: 100, reps: 5 },
        { weight: 100, reps: 5 }, // total: 1500 kg
      ],
    },
  ],
};

// A routine that includes all three exercises
const ROUTINE = {
  id: 'routine-push-pull',
  name: 'Push + Pull',
  type: 'gym',
  exerciseIds: ['ex-bench', 'ex-pullups', 'ex-squat'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedLocalStorage(page) {
  await page.evaluate(({ exercises, workouts, routines }) => {
    localStorage.setItem('repbuddy_exercises', JSON.stringify(exercises));
    localStorage.setItem('repbuddy_workouts',  JSON.stringify(workouts));
    localStorage.setItem('repbuddy_routines',  JSON.stringify(routines));
  }, {
    exercises: EXERCISES,
    workouts: [PAST_WORKOUT],
    routines: [ROUTINE],
  });
}

async function waitForText(page, text, timeout = 10000) {
  await page.waitForFunction(
    (t) => document.body.innerText.includes(t),
    { timeout },
    text
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('Launching Chrome (iPhone 14 Pro view)…');

  const browser = await puppeteer.launch({
    headless: false,           // keep visible so you can see the app
    defaultViewport: null,     // let devtools set viewport
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();

  // iPhone 14 Pro dimensions & UA
  await page.emulate({
    name: 'iPhone 14 Pro',
    viewport: {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      isLandscape: false,
    },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  // ── Step 1: load the app shell so localStorage is available ──────────────
  console.log('Loading app…');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // ── Step 2: seed workout history ─────────────────────────────────────────
  console.log('Seeding workout history into localStorage…');
  await seedLocalStorage(page);

  // ── Step 3: navigate to active workout with our routine ──────────────────
  console.log('Opening active workout screen…');
  await page.goto(
    `${BASE_URL}/workout/active?routineId=routine-push-pull`,
    { waitUntil: 'networkidle2', timeout: 30000 }
  );

  // ── Step 4: wait for the LAST TIME card ──────────────────────────────────
  console.log('Waiting for LAST TIME card to appear…');
  try {
    await waitForText(page, 'LAST TIME', 12000);
    console.log('✓ LAST TIME card found');
  } catch {
    console.warn('⚠ LAST TIME card not found within timeout');
  }

  // ── Step 5: screenshot ───────────────────────────────────────────────────
  const screenshotPath = 'scripts/test-screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot saved → ${screenshotPath}`);

  // Check the card content for both expected values
  const bodyText = await page.evaluate(() => document.body.innerText);

  const checks = [
    { label: 'Bench Press LAST TIME card',    pass: bodyText.includes('LAST TIME') },
    { label: 'Bench Press volume (1,775 kg)', pass: bodyText.includes('1,775') },
    { label: 'Pull Ups total reps (25 reps)', pass: bodyText.includes('25 reps') },
  ];

  console.log('\n── Feature checks ──────────────────────────────');
  let allPassed = true;
  for (const { label, pass } of checks) {
    console.log(`${pass ? '✓' : '✗'} ${label}`);
    if (!pass) allPassed = false;
  }
  console.log('────────────────────────────────────────────────');
  console.log(allPassed ? '✓ All checks passed' : '✗ Some checks failed');
  console.log('\nBrowser left open — review the screen, then close it manually.');

  // Leave browser open for visual inspection
})();
