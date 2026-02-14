# RepBuddy – Product & Build Plan

## 1. App Overview
**App Name:** RepBuddy  
**Platform:** React based (so can run across all platforms)  
**App Type:** Workout tracker

**One-line description:**  
RepBuddy is a simple gym workout tracking app focused on logging sets, reps, and weights.

**Core Goal:**  
Help users quickly log workouts and track progression with minimal friction.

## 2. Target Users
**Primary audience:**  
Weightlifting enthusiasts

**What problem are we solving?**  
* forgetting last weights
* slow logging

## 3. Core Features (MVP)
### Must Have
- [x] Add exercises
- [x] Log sets
- [x] Track reps
- [x] Track weights
- [x] Create workout routines
- [x] Workout history
- [x] Edit/delete logs

### Nice to Have (Post-MVP)
- [x] Rest timer

## 4. Exercise System
**Exercise Source:**
- Fully custom 

**Fields per exercise:**
- Name
- Sets
- Weight
- Muscle group (optional)
- Equipment (optional)
- Notes (optional)

## 5. Workout Logging Model
**Structure:**
Workout → Exercises → Sets
**Fields per set:**
- Weight
- Reps

## 6. Routine / Program Logic
**Can users create routines?**  
Yes

**Routine Structure:**
Routine → Exercises list

**Examples:**
- Push Day
- Pull Day
- Leg Day

## 7. Progress Tracking
**Metrics to calculate:**
- Volume (weight × reps × sets) [we can show this somehwere in app when user looks at the exercise]

## 8. UI / UX Philosophy
**App feel:**
- Minimal / Clean / Hardcore / Playful

**Logging style:**
- Ultra fast tap logging

**Design priorities:**
1. Speed
2. Clarity
3. Low cognitive load

## 9. Screens Required
List screens explicitly.

- Home
- Start Workout
- Exercise Library
- Active Workout
- History
- Routine Builder
- Settings

## 10. Data Storage
Local storage

**Offline support required?**  
Yes

## 11. Technical Preferences
React Expo SDK 54

## 12. Constraints for LLM
Important instructions for Claude.

- Prioritize simplicity over complexity
- Avoid feature creep
- Build modular architecture
- Clean, readable code
- No overengineering

## 13. Non-Goals (Avoid scope creep)
RepBuddy will NOT initially include:

- Meal tracking
- AI coaching
- Social feed
- Wearable integration

## 14. Success Criteria
How do we define success?

- Users can log workout < 10 seconds per exercise
- No learning curve
- Stable performance

