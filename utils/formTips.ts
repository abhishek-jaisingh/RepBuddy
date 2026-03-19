export interface FormTip {
  setup: string;
  cues: string[];
  mistakes: string[];
  videoUrl: string;
}

// Keyed by exercise name (must match DEFAULT_EXERCISES in storage.ts)
const FORM_TIPS: Record<string, FormTip> = {
  'Pull Ups': {
    setup: 'Start from a dead hang with arms fully extended. Grip the bar slightly wider than shoulder-width, palms facing away.',
    cues: [
      'Pack your shoulders down — don\'t shrug toward ears',
      'Lead with your chest, not your chin',
      'Squeeze your shoulder blades together at the top',
      'Control the descent — 2-3 seconds down',
    ],
    mistakes: [
      'Kipping or swinging to get over the bar',
      'Half reps — not reaching full extension at the bottom',
      'Shrugging shoulders up instead of keeping them packed',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  },
  'Wide Grip Pull Ups': {
    setup: 'Grip the bar 1.5x shoulder width, palms facing away. Start from a dead hang.',
    cues: [
      'Drive your elbows down and out toward your hips',
      'Think about pulling the bar to your upper chest',
      'Keep your core tight — avoid excessive arching',
      'Full range of motion: dead hang to chin over bar',
    ],
    mistakes: [
      'Grip too wide causing shoulder impingement',
      'Using momentum instead of controlled pulling',
      'Not reaching full extension at the bottom',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=RHfEuBMBfUk',
  },
  'Push Ups': {
    setup: 'Hands slightly wider than shoulder-width. Body in a straight line from head to heels. Core braced.',
    cues: [
      'Elbows at 45° angle — not flared out to 90°',
      'Touch chest to floor on each rep',
      'Push the floor away from you at the top',
      'Keep your glutes and core tight throughout',
    ],
    mistakes: [
      'Sagging hips — losing the plank position',
      'Flaring elbows straight out to the sides',
      'Partial reps — not reaching full depth',
      'Leading with the head instead of the chest',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  },
  'Bench Press': {
    setup: 'Retract and depress your shoulder blades. Slight arch in the upper back. Feet flat on the floor. Grip ~1.5x shoulder width.',
    cues: [
      '"Bend the bar" — externally rotate hands to engage lats',
      'Touch the bar to your lower chest (nipple line)',
      'Drive feet into the floor for leg drive',
      'Keep wrists stacked directly over elbows',
    ],
    mistakes: [
      'Flaring elbows to 90° — keep them around 45-75°',
      'Losing shoulder blade tightness at the bottom',
      'Bouncing the bar off your chest',
      'Lifting hips off the bench',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  },
  'Incline Bench Press': {
    setup: 'Set bench to 30-45°. Same shoulder blade retraction as flat bench. Feet flat on the floor.',
    cues: [
      'Bar path should touch just below your collarbone',
      'Keep the same shoulder blade setup as flat bench',
      'Press slightly back (toward your face) at the top',
      'Control the descent — don\'t just drop the bar',
    ],
    mistakes: [
      'Bench angle too steep (becomes a shoulder press)',
      'Flaring elbows wide — keep them tucked',
      'Losing upper back tightness',
      'Not adjusting the bar path for the incline angle',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=SrqOu55lrYU',
  },
  'Squat': {
    setup: 'Bar on upper traps (high bar) or rear delts (low bar). Feet shoulder-width, toes slightly out. Brace your core hard before descending.',
    cues: [
      'Break at the hips and knees simultaneously',
      '"Spread the floor" with your feet — knees track over toes',
      'Hit at least parallel — hip crease below the knee',
      'Drive up by pushing your back into the bar',
    ],
    mistakes: [
      'Knees caving inward (valgus collapse)',
      'Rising hips first while chest drops (good-morning squat)',
      'Losing core bracing at the bottom',
      'Heels coming off the floor',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
  },
  'Deadlift': {
    setup: 'Bar over mid-foot. Feet hip-width. Hinge at hips, grip just outside your knees. Shoulders over or slightly in front of the bar.',
    cues: [
      '"Push the floor away" rather than pulling the bar up',
      'Keep the bar against your body the entire lift',
      'Lock out by squeezing glutes — don\'t hyperextend the back',
      'Big breath and brace before every rep',
    ],
    mistakes: [
      'Rounding the lower back',
      'Bar drifting away from the body',
      'Jerking the bar off the floor — take the slack out first',
      'Hyperextending at the top',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
  },
  'Romanian Deadlift': {
    setup: 'Start from the top (standing). Feet hip-width, soft bend in the knees. Hold the bar at hip height.',
    cues: [
      'Push your hips straight back — like closing a car door with your butt',
      'Keep the bar sliding down your thighs',
      'Feel a deep stretch in your hamstrings before reversing',
      'Squeeze glutes hard to return to the top',
    ],
    mistakes: [
      'Bending the knees too much — this isn\'t a squat',
      'Rounding the lower back to reach further down',
      'Not keeping the bar close to the body',
      'Using arms to pull the weight up',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=7j-2w4-P14I',
  },
  'Leg Press': {
    setup: 'Sit with back flat against the pad. Feet shoulder-width on the platform, midway up. Don\'t lock your knees at the top.',
    cues: [
      'Lower until your knees are at about 90°',
      'Push through your whole foot — not just toes',
      'Keep your lower back pressed into the pad',
      'Controlled descent — don\'t let the weight free-fall',
    ],
    mistakes: [
      'Going too deep and letting your lower back round off the pad',
      'Locking knees fully at the top',
      'Placing feet too low — shifts stress to knees',
      'Using a bouncing motion at the bottom',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  },
  'Barbell Row': {
    setup: 'Hinge forward to about 45°. Grip slightly wider than shoulder-width, overhand or underhand. Knees slightly bent.',
    cues: [
      'Pull the bar toward your lower chest / upper belly',
      'Drive your elbows behind your body',
      'Squeeze your shoulder blades at the top for 1 second',
      'Keep your torso angle constant — don\'t stand up',
    ],
    mistakes: [
      'Using too much body English / heaving the weight',
      'Torso rising with each rep (turning it into a shrug)',
      'Not getting a full range of motion',
      'Rounding the lower back',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
  },
  'Lat Pulldown': {
    setup: 'Grip the bar just outside shoulder-width. Sit with thighs secured under the pads. Lean back slightly (~10-15°).',
    cues: [
      'Pull the bar to your upper chest, not behind your neck',
      'Drive your elbows down and back',
      'Initiate the pull by depressing your shoulder blades',
      'Control the return — feel the stretch at the top',
    ],
    mistakes: [
      'Leaning too far back (turns into a row)',
      'Pulling behind the neck — stresses the shoulders',
      'Using momentum / swinging your body',
      'Gripping too wide or too narrow',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  },
  'Cable Row': {
    setup: 'Sit on the bench with feet on the footplate, knees slightly bent. Grab the handle with arms fully extended. Sit tall.',
    cues: [
      'Pull the handle to your lower chest / upper belly',
      'Squeeze your shoulder blades together at the end',
      'Keep your torso upright — minimal lean',
      'Let your arms extend fully on the return to get a stretch',
    ],
    mistakes: [
      'Excessive forward-back rocking with each rep',
      'Shrugging shoulders up instead of pulling back',
      'Cutting the range of motion short',
      'Rounding your upper back',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
  },
  'Seated Shoulder Press': {
    setup: 'Seat back upright or very slightly inclined. Grip the handles at shoulder height. Feet flat on the floor.',
    cues: [
      'Press straight up — don\'t let the handles drift forward',
      'Keep your core braced and back against the pad',
      'Don\'t fully lock out elbows — maintain tension',
      'Control the descent back to shoulder height',
    ],
    mistakes: [
      'Arching the lower back excessively',
      'Pressing unevenly — one arm ahead of the other',
      'Using too much weight and losing control',
      'Flaring elbows straight out to the sides',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  },
  'Lateral Raise': {
    setup: 'Stand with dumbbells at your sides, palms facing in. Slight bend in the elbows. Feet hip-width.',
    cues: [
      'Raise arms out to the sides until parallel with the floor',
      'Lead with your elbows, not your hands',
      'Slight forward lean can help target the side delt',
      'Control the descent — don\'t just drop the weight',
    ],
    mistakes: [
      'Using too much weight and swinging/cheating',
      'Shrugging your traps to lift the weight',
      'Raising above shoulder height (impingement risk)',
      'Internally rotating at the top (pouring water cue is outdated)',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  },
  'Face Pull': {
    setup: 'Set cable to upper chest or face height. Use a rope attachment. Grab with overhand grip, thumbs facing you.',
    cues: [
      'Pull toward your face — split the rope around your ears',
      'Externally rotate at the end so hands are beside your head',
      'Squeeze your rear delts and hold for a beat',
      'Keep your elbows high throughout the movement',
    ],
    mistakes: [
      'Using too much weight — this is a light, high-rep exercise',
      'Pulling to your chest instead of your face',
      'Not getting the external rotation at the end',
      'Leaning back excessively to move the weight',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
  },
  'Bicep Curl': {
    setup: 'Stand with dumbbells at your sides, palms facing forward. Elbows pinned to your sides.',
    cues: [
      'Curl the weight up by bending only at the elbow',
      'Squeeze the bicep hard at the top',
      'Lower slowly — the eccentric builds muscle too',
      'Keep your elbows stationary throughout',
    ],
    mistakes: [
      'Swinging the body to cheat the weight up',
      'Elbows drifting forward — shoulders take over',
      'Dropping the weight on the way down (no control)',
      'Using momentum from the hips',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  },
  'Dumbbell Hammer Curl': {
    setup: 'Stand with dumbbells at your sides, palms facing each other (neutral grip). Elbows close to your body.',
    cues: [
      'Curl straight up — maintain the neutral grip throughout',
      'Keep your wrist straight and strong',
      'Squeeze at the top and lower with control',
      'Alternate arms or curl both simultaneously',
    ],
    mistakes: [
      'Rotating the wrists — keep palms facing each other',
      'Swinging the torso to generate momentum',
      'Elbows flaring out to the sides',
      'Rushing through reps without control',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
  },
  'Tricep Pushdown': {
    setup: 'Stand facing the cable machine. Use a straight bar attachment. Elbows pinned to your sides, forearms parallel to the floor.',
    cues: [
      'Push the bar down by extending only at the elbow',
      'Lock out fully at the bottom and squeeze the triceps',
      'Control the return — don\'t let the cable yank your arms up',
      'Keep your elbows stationary throughout',
    ],
    mistakes: [
      'Leaning over the bar and using body weight',
      'Elbows drifting forward or flaring out',
      'Not fully extending at the bottom',
      'Using too much weight and compensating with shoulders',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
  },
  'Tricep Rope Pushdown': {
    setup: 'Stand facing the cable machine. Use a rope attachment. Elbows pinned to your sides.',
    cues: [
      'Push down and spread the rope apart at the bottom',
      'The split at the bottom gives extra tricep contraction',
      'Keep your upper arms completely still',
      'Slow, controlled reps — pause at the bottom',
    ],
    mistakes: [
      'Not splitting the rope at the bottom (defeats the purpose)',
      'Leaning forward too much',
      'Using momentum instead of muscle',
      'Elbows moving away from your sides',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=kiuVA0gs3EI',
  },
  'Calf Raise': {
    setup: 'Stand on the platform with the balls of your feet on the edge. Shoulders under the pads. Start with calves stretched (heels below the platform).',
    cues: [
      'Push up as high as you can onto your toes',
      'Hold the top position for 1-2 seconds',
      'Lower slowly — feel the full stretch at the bottom',
      'Full range of motion is more important than heavy weight',
    ],
    mistakes: [
      'Bouncing at the bottom without a full stretch',
      'Partial reps — not reaching full extension',
      'Going too heavy and using knee bend to cheat',
      'Rushing through reps without pausing at top or bottom',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
  },
};

export function getFormTip(exerciseName: string): FormTip | null {
  return FORM_TIPS[exerciseName] ?? null;
}
