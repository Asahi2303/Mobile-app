// Configure your Supabase table names here to avoid guesswork in fetchers.
// Set to the exact names you have in your Supabase project. Leave as null to skip.

export const SUBJECTS_PRIMARY = 'section_subjects'; // Use section_subjects as primary per your schema
export const SUBJECTS_FALLBACKS = [
  'v_sections_subjects', // view in your schema; provides subject & schedule json
  'subjects',
  'student_subjects',
  'enrollments',
  'subject_enrollments',
];

export const SCHEDULE_PRIMARY = 'section_subjects'; // Class schedule also comes from section_subjects
export const SCHEDULE_FALLBACKS = [
  'v_sections_subjects',
  'schedule',
  'schedules',
  'class_schedule',
  'class_schedules',
  'timetable',
  'class_meetings',
  'student_schedule',
];

// Grades configuration
export const GRADES_PRIMARY = 'grades';
export const GRADES_FALLBACKS = [
  'student_grades',
  'grades_view',
  'report_cards',
  'grade_reports',
  'v_student_grades',
];
