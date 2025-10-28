# Copilot instructions for MobileApp

This repo is a React Native (Expo) student portal. It uses Supabase for data, React Navigation (stack + drawer), and a centralized StudentContext for data fetching and app state. Follow these conventions to be productive here.

## Architecture and key files
- Navigation
  - `App.js` sets up a Stack and a right-side Drawer. Custom header/drawer use a green gradient.
  - Drawer routes: `Home`, `Dashboard`, `Grades`, `Subjects Summary`, `ProfileScreen`.
  - The “Class Schedule” quick action navigates to `Subjects Summary` (there is no `ScheduleScreen`).
- State & data
  - `context/StudentContext.js` is the source of truth. It loads student, subjects, schedule, grades, and announcements; exposes updateStudentProfile.
  - Fetchers are resilient: they try multiple table names and identifier columns and record their source in `fetchDebug` for diagnostics.
  - Supabase client: `config/supabase.js`. Configure via Expo public env vars (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY) or the defaults.
  - Supabase table names: `config/supabaseTables.js` controls primary and fallback tables for subjects, schedule, and grades. Update these to match the actual database.
- Theming
  - Central palette: `config/theme.js`. Use `colors`, `radii`, `shadow`, etc. Avoid hardcoding colors. Gradients come from `colors.gradient`.
  - Example usage: `import { colors } from '../config/theme'` then use `colors.primary`, `colors.surface`, etc.
- Screens
  - `Screens/DashboardScreen.js`: Safe-area layout, gradient background, stat cards, quick actions.
  - `Screens/SubjectsSummaryScreen.js`: Combines section-filtered subjects and schedule; header shows `Grade • Section`.
  - `Screens/GradesScreen.js`: Normalizes grades from various schemas; shows term/SY and computes totals/averages.
  - `Screens/ProfileScreen.js`: Avatar, academic/contact info, inline edit wired to `updateStudentProfile`.

## Data flow and patterns
- Student loading
  - Login writes both `student` and `studentData` to context with `lrn` and `fullName` filled in.
  - `StudentContext` then triggers fetches for subjects, schedule, and grades when it has either `student.id` or section/grade info.
- Section resolution
  - If `student.section_id` is missing, `resolveSectionId()` infers it via `grade_sections` by grade + section name and caches it.
  - `fetchSectionMeta()` enriches student with section name/grade level when only `section_id` is known.
- Robust fetching
  - Subjects & schedule prefer `section_subjects` (by `section_id` or section name) and may fall back to `v_sections_subjects` or configured tables.
  - Grades try `GRADES_PRIMARY` + fallbacks across several identifier columns (student_id, lrn, student_number, email).
  - In dev, fetchers may fallback to a small sample to verify rendering and tag `fetchDebug.{source,count}`.

## Developer workflows
- Run the app
  - `npm run start` (or `npm run android` / `npm run ios` / `npm run web`). Requires Expo tooling.
- Configure Supabase
  - Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in app config or `.env`. The client reads Expo public vars.
- Adjust schema mapping
  - Edit `config/supabaseTables.js` to match your Supabase tables/views if names differ.
- Styling & UI
  - Use `config/theme.js` tokens; do not hardcode hex values. The header/drawer gradient uses `[colors.primaryDark, colors.primary]`.

## Conventions and examples
- Navigation: Use exact route names. Example: `navigation.navigate('Subjects Summary')` for schedule.
- Theming: Example gradient background for a screen
  ```js
  <LinearGradient colors={colors.gradient} style={{ flex: 1 }} />
  ```
- Soft primary badges: use `colors.primarySoft` background and `colors.primaryDark` text.
- Inputs and cards: prefer `colors.surface`, borders `colors.border`, backgrounds `colors.bg`.

## Gotchas
- Do not reference a `ScheduleScreen`—it was intentionally removed.
- Some tables/columns may vary across environments. Keep fetchers tolerant and update `supabaseTables.js` instead of inlining table names.
- Keep login resilient (LRN with or without dashes, fallback to name/email). Avoid breaking the multi-attempt flow.

## When adding features
- Read patterns from `StudentContext.js` and reuse the multi-try strategy.
- Add new colors or tokens to `config/theme.js` and apply across screens.
- Update `Drawer` with friendly labels/icons in `App.js` if you add routes.
