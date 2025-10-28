// context/StudentContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { SUBJECTS_PRIMARY, SUBJECTS_FALLBACKS, SCHEDULE_PRIMARY, SCHEDULE_FALLBACKS, GRADES_PRIMARY, GRADES_FALLBACKS } from '../config/supabaseTables';

// Create the context
export const StudentContext = createContext();

// Create the provider
export const StudentProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [studentNumber, setStudentNumber] = useState('');
  const [studentData, setStudentData] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchDebug, setFetchDebug] = useState({ subjects: null, schedule: null, grades: null });

  // Fetch a student record by id or LRN and populate context
  const fetchStudentData = useCallback(async ({ id, lrn } = {}) => {
    try {
      const byId = id ?? student?.id;
      const byLrn = lrn ?? student?.lrn ?? studentData?.lrn;
      if (!byId && !byLrn) return { ok: false, error: new Error('Missing id or lrn') };

      let query = supabase.from('students').select('*').limit(1);
      query = byId ? query.eq('id', byId) : query.eq('lrn', String(byLrn));
      const { data, error } = await query;
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return { ok: false, error: new Error('Student not found') };

      const fullName = `${row?.first_name || ''} ${row?.last_name || ''}`.trim();
      setStudent(row);
      setStudentData((prev) => ({ ...(prev || {}), ...row, lrn: String(row?.lrn ?? ''), fullName }));

      // If we have a section_id but no section name cached, fetch it
      const hasSectionName = Boolean(studentData?.section || studentData?.section_name);
      if (row?.section_id && !hasSectionName) {
        void fetchSectionMeta(row.section_id);
      }
      return { ok: true, data: row };
    } catch (err) {
      console.warn('fetchStudentData error', err.message || err);
      return { ok: false, error: err };
    }
  }, [student, studentData]);

  // Helper to detect if we already have a section name cached
  const prevHasSectionName = () => Boolean(studentData?.section || studentData?.section_name);

  // Fetch section metadata (name, grade_level) and cache on studentData
  const fetchSectionMeta = useCallback(async (sectionId) => {
    try {
      if (!sectionId) return;
      // Prefer 'grade_sections' (your canonical table), then fallback to 'sections' or 'grade_section'
      let data = null;
      let error = null;

      // Try grade_sections
      {
        const res = await supabase
          .from('grade_sections')
          .select('*')
          .eq('id', sectionId)
          .single();
        data = res.data; error = res.error;
      }
      // Fallback: sections
      if (error || !data) {
        const res = await supabase
          .from('sections')
          .select('*')
          .eq('id', sectionId)
          .single();
        data = data || res.data; error = res.error;
      }
      // Fallback: grade_section (singular)
      if (!data) {
        const res = await supabase
          .from('grade_section')
          .select('*')
          .eq('id', sectionId)
          .single();
        data = res.data;
      }

      if (data) {
        const sectionName = data.name || data.section || data.grade_section || data.section_name || '';
        const gradeLevel = data.grade_level ?? data.grade ?? data.gradelevel ?? null;
        setStudentData((prev) => ({
          ...(prev || {}),
          section_id: sectionId,
          section: sectionName || prev?.section,
          section_name: sectionName || prev?.section_name,
          grade_level: prev?.grade_level ?? gradeLevel ?? prev?.grade_level,
        }));
        setStudent((prev) => ({ ...(prev || {}), section_id: sectionId }));
      }
    } catch (_) {}
  }, []);

  // Resolve a section_id to use for queries. If not present on student, try to find it via grade_sections.
  const resolveSectionId = useCallback(async () => {
    const existing = student?.section_id || studentData?.section_id;
    if (existing) return existing;

    // Try derive from student's grade/section text
    const gradeRaw = student?.grade || studentData?.grade || student?.grade_level || studentData?.grade_level;
    const sectionName = student?.section || studentData?.section || student?.section_name || studentData?.section_name;
    if (!gradeRaw || !sectionName) return null;

    const gradeInt = parseInt(String(gradeRaw).replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(gradeInt)) return null;

    // Look up grade_sections by (grade, section_name); pick the most recent
    const { data, error } = await supabase
      .from('grade_sections')
      .select('id, grade, section_name, academic_year, created_at')
      .eq('grade', gradeInt)
      .ilike('section_name', sectionName)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.id) {
      setStudentData((prev) => ({ ...(prev || {}), section_id: row.id, section: row.section_name, section_name: row.section_name, grade_level: gradeInt }));
      setStudent((prev) => ({ ...(prev || {}), section_id: row.id }));
      return row.id;
    }
    return null;
  }, [student, studentData]);

  const fetchSubjects = useCallback(async (studentId) => {
    try {
      const section = student?.section || studentData?.section || student?.section_name || studentData?.section_name;
      let sectionId = student?.section_id || studentData?.section_id;
      if (!sectionId) sectionId = await resolveSectionId();
      const gradeVal = student?.grade || student?.grade_level || studentData?.grade || studentData?.grade_level;

  const names = [SUBJECTS_PRIMARY, ...(SUBJECTS_FALLBACKS || [])].filter(Boolean);
  const tryList = [];

      // 0) Prefer section_subjects by section_id with subject relation
      if (sectionId != null && names.includes('section_subjects')) {
        tryList.push({ label: 'section_subjects by section_id (rel subjects)', run: async () =>
          supabase
            .from('section_subjects')
            .select('*, subjects(name, units)')
            .eq('section_id', sectionId)
        });
        // Plain select fallback when 'subjects' table doesn't exist
        tryList.push({ label: 'section_subjects by section_id (*)', run: async () =>
          supabase
            .from('section_subjects')
            .select('*')
            .eq('section_id', sectionId)
        });
      }
      // 0a) Also try by section name (even if sectionId exists) to be resilient to legacy rows
      if (section && names.includes('section_subjects')) {
        tryList.push({ label: 'section_subjects by section name (rel subjects)', run: async () =>
          supabase
            .from('section_subjects')
            .select('*, subjects(name, units)')
            .ilike('section', section)
        });
        // Plain select fallback when 'subjects' table doesn't exist
        tryList.push({ label: 'section_subjects by section name (*)', run: async () =>
          supabase
            .from('section_subjects')
            .select('*')
            .ilike('section', section)
        });
      }

      // View fallback (v_sections_subjects), if available
      if (names.includes('v_sections_subjects')) {
        if (sectionId != null) {
          tryList.push({ label: 'v_sections_subjects by section_id', run: async () => supabase.from('v_sections_subjects').select('*').eq('section_id', sectionId) });
        } else if (section) {
          tryList.push({ label: 'v_sections_subjects by section_name', run: async () => supabase.from('v_sections_subjects').select('*').ilike('section_name', section) });
        }
      }

      // 1) By student_id across configured tables
      if (studentId) {
        for (const tbl of names) {
          tryList.push({ label: `${tbl} by student_id`, run: async () => supabase.from(tbl).select('*').eq('student_id', studentId) });
        }
      }

      // 2) By section across configured tables
      if (section) {
        for (const tbl of names) {
          tryList.push({ label: `${tbl} by section (ilike)`, run: async () => supabase.from(tbl).select('*').ilike('section', section) });
          tryList.push({ label: `${tbl} by section_name`, run: async () => supabase.from(tbl).select('*').eq('section_name', section) });
        }
      }

      // 3) By grade/grade_level
      if (gradeVal != null) {
        for (const tbl of names) {
          tryList.push({ label: `${tbl} by grade`, run: async () => supabase.from(tbl).select('*').eq('grade', gradeVal) });
          tryList.push({ label: `${tbl} by grade_level`, run: async () => supabase.from(tbl).select('*').eq('grade_level', gradeVal) });
        }
      }

      // 4) Relational fallbacks (enrollments -> subjects)
      tryList.push({ label: 'enrollments by student_id (rel subjects)', run: async () =>
        supabase
          .from('enrollments')
          .select('id, student_id, subject_id, subjects(name, units)')
          .eq('student_id', studentId || -1)
      });
      tryList.push({ label: 'subject_enrollments by student_id (rel subjects)', run: async () =>
        supabase
          .from('subject_enrollments')
          .select('id, student_id, subject_id, subjects(name, units)')
          .eq('student_id', studentId || -1)
      });

      let found = [];
      let source = null;
      for (const item of tryList) {
        try {
          const { data, error } = await item.run();
          if (error) continue;
          if (Array.isArray(data)) {
            found = data;
            if (found.length > 0) { source = item.label; break; }
          }
        } catch (_) {}
      }

      // Dev-only: last resort sample to verify rendering, fetch a few rows unfiltered
      if (__DEV__ && (!found || found.length === 0)) {
        try {
          const { data } = await supabase.from('section_subjects').select('*').limit(10);
          if (Array.isArray(data) && data.length > 0) {
            found = data;
            source = 'DEV sample: section_subjects limit 10';
          }
        } catch (_) {}
      }

      const normalized = (found || []).map((row, idx) => {
        const subject = row.subjects || (typeof row.subject === 'object' ? row.subject : null) || row;
        return {
          ...row,
          id: String(row.id ?? idx),
          name: subject?.name || row?.name || row?.subject_name || row?.subject || 'Subject',
          units: subject?.units ?? row?.units ?? 1,
        };
      });

      setSubjects(normalized);
      setFetchDebug((prev) => ({ ...(prev || {}), subjects: { source, count: normalized.length, sectionId, sectionName: section || null } }));
    } catch (err) {
      console.warn('fetchSubjects error', err.message || err);
    }
  }, [student, studentData, resolveSectionId]);


  const fetchGrades = useCallback(async (studentId) => {
    try {
      const names = [GRADES_PRIMARY, ...(GRADES_FALLBACKS || [])].filter(Boolean);
      const lrn = student?.lrn || studentData?.lrn || null;
      const studNo = student?.student_number || studentData?.student_number || null;
      const email = student?.email || studentData?.email || null;

      const tryList = [];
      for (const tbl of names) {
        if (studentId != null) tryList.push({ label: `${tbl} by student_id`, run: async () => supabase.from(tbl).select('*').eq('student_id', studentId) });
        if (studentId != null) tryList.push({ label: `${tbl} by studentid`, run: async () => supabase.from(tbl).select('*').eq('studentid', studentId) });
        if (studentId != null) tryList.push({ label: `${tbl} by studentId`, run: async () => supabase.from(tbl).select('*').eq('studentId', studentId) });
        if (studentId != null) tryList.push({ label: `${tbl} by student`, run: async () => supabase.from(tbl).select('*').eq('student', studentId) });
        if (lrn) {
          tryList.push({ label: `${tbl} by lrn`, run: async () => supabase.from(tbl).select('*').eq('lrn', String(lrn)) });
          tryList.push({ label: `${tbl} by student_lrn`, run: async () => supabase.from(tbl).select('*').eq('student_lrn', String(lrn)) });
        }
        if (studNo) {
          tryList.push({ label: `${tbl} by student_number`, run: async () => supabase.from(tbl).select('*').eq('student_number', String(studNo)) });
          tryList.push({ label: `${tbl} by stud_no`, run: async () => supabase.from(tbl).select('*').eq('stud_no', String(studNo)) });
        }
        if (email) {
          tryList.push({ label: `${tbl} by email`, run: async () => supabase.from(tbl).select('*').eq('email', String(email)) });
        }
      }

      let found = [];
      let source = null;
      for (const item of tryList) {
        try {
          const { data, error } = await item.run();
          if (error) continue;
          if (Array.isArray(data)) {
            found = data;
            if (found.length > 0) { source = item.label; break; }
          }
        } catch (_) {}
      }

      // Dev-only: last resort sample to verify rendering
      if (__DEV__ && (!found || found.length === 0)) {
        try {
          const { data } = await supabase.from(GRADES_PRIMARY || 'grades').select('*').limit(10);
          if (Array.isArray(data) && data.length > 0) {
            found = data;
            source = 'DEV sample: grades limit 10';
          }
        } catch (_) {}
      }

      setGrades(found || []);
      setFetchDebug((prev) => ({ ...(prev || {}), grades: { source, count: Array.isArray(found) ? found.length : 0 } }));
    } catch (err) {
      console.warn('fetchGrades error', err.message || err);
    }
  }, [student, studentData]);

  const fetchSchedule = useCallback(async (studentId) => {
    try {
      const section = student?.section || studentData?.section || student?.section_name || studentData?.section_name;
      let sectionId = student?.section_id || studentData?.section_id;
      if (!sectionId) sectionId = await resolveSectionId();
      const gradeVal = student?.grade || student?.grade_level || studentData?.grade || studentData?.grade_level;

  const names = [SCHEDULE_PRIMARY, ...(SCHEDULE_FALLBACKS || [])].filter(Boolean);
  const tryList = [];

      // 0) section_subjects prioritized by section_id with relational join to subjects
      if (sectionId != null && names.includes('section_subjects')) {
        tryList.push({ label: 'section_subjects by section_id (rel subjects)', run: async () =>
          supabase
            .from('section_subjects')
            .select('*, subjects(name, units)')
            .eq('section_id', sectionId)
        });
        // Plain select fallback when 'subjects' table doesn't exist
        tryList.push({ label: 'section_subjects by section_id (*)', run: async () =>
          supabase
            .from('section_subjects')
            .select('*')
            .eq('section_id', sectionId)
        });
      }
      // 0a) also try by section name to handle legacy rows
      if (section && names.includes('section_subjects')) {
        tryList.push({ label: 'section_subjects by section name (rel subjects)', run: async () =>
          supabase
            .from('section_subjects')
            .select('*, subjects(name, units)')
            .ilike('section', section)
        });
        // Plain select fallback when 'subjects' table doesn't exist
        tryList.push({ label: 'section_subjects by section name (*)', run: async () =>
          supabase
            .from('section_subjects')
            .select('*')
            .ilike('section', section)
        });
      }

      // View fallback: v_sections_subjects (already contains joined teacher_name and schedule json)
      if (names.includes('v_sections_subjects')) {
        if (sectionId != null) {
          tryList.push({ label: 'v_sections_subjects by section_id', run: async () => supabase.from('v_sections_subjects').select('*').eq('section_id', sectionId) });
        } else if (section) {
          tryList.push({ label: 'v_sections_subjects by section_name', run: async () => supabase.from('v_sections_subjects').select('*').ilike('section_name', section) });
        }
      }

      // 1) By student_id
      if (studentId) {
        for (const tbl of names) {
          tryList.push({ label: `${tbl} by student_id`, run: async () => supabase.from(tbl).select('*').eq('student_id', studentId) });
        }
      }
      // 2) By section
      if (section) {
        for (const tbl of names) {
          tryList.push({ label: `${tbl} by section (ilike)`, run: async () => supabase.from(tbl).select('*').ilike('section', section) });
          tryList.push({ label: `${tbl} by section_name`, run: async () => supabase.from(tbl).select('*').eq('section_name', section) });
        }
      }
      // 3) By grade
      if (gradeVal != null) {
        for (const tbl of names) {
          tryList.push({ label: `${tbl} by grade`, run: async () => supabase.from(tbl).select('*').eq('grade', gradeVal) });
          tryList.push({ label: `${tbl} by grade_level`, run: async () => supabase.from(tbl).select('*').eq('grade_level', gradeVal) });
        }
      }

      let found = [];
      let source = null;
      for (const item of tryList) {
        try {
          const { data, error } = await item.run();
          if (error) continue;
          if (Array.isArray(data)) {
            found = data;
            if (found.length > 0) { source = item.label; break; }
          }
        } catch (_) {}
      }

      // Dev-only: last resort sample to verify rendering, fetch a few rows unfiltered
      if (__DEV__ && (!found || found.length === 0)) {
        try {
          const { data } = await supabase.from('section_subjects').select('*').limit(10);
          if (Array.isArray(data) && data.length > 0) {
            found = data;
            source = 'DEV sample: section_subjects limit 10';
          }
        } catch (_) {}
      }

      // Normalize schedule rows; expand JSON schedule if present (schema uses jsonb schedule)
      const toDayName = (d) => {
        const map = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
        if (typeof d === 'number') return map[d] || String(d);
        const s = String(d || '').toLowerCase();
        const names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        const idx = names.indexOf(s);
        return idx >= 0 ? names[idx][0].toUpperCase() + names[idx].slice(1) : (d || '');
      };

      const expanded = [];
      (found || []).forEach((row, idx) => {
        const subj = row.subjects || (typeof row.subject === 'object' ? row.subject : null) || {};
        const baseName = subj?.name || row?.name || row?.subject_name || row?.subject || 'Class';
        const teacher = row.teacher_name || row.instructor || row.teacher || row.professor || null;
        // schedule could be JSON string or object
        let sched = row.schedule;
        if (sched && typeof sched === 'string') {
          try { sched = JSON.parse(sched); } catch (_) { sched = null; }
        }

        if (sched && (Array.isArray(sched.days) || sched.start || sched.end)) {
          const days = Array.isArray(sched.days) ? sched.days : [sched.day].filter(Boolean);
          if (days.length > 0) {
            days.forEach((d, i) => {
              expanded.push({
                ...row,
                id: String((row.id ?? idx)) + '-' + String(i),
                name: baseName,
                day: toDayName(d),
                start_time: sched.start || row.start_time || row.start || null,
                end_time: sched.end || row.end_time || row.end || null,
                room: (sched.room ?? row.room ?? row.room_no ?? row.room_number) || null,
                instructor: teacher,
              });
            });
            return;
          }
        }
        // Fallback to flat row fields
        expanded.push({
          ...row,
          id: String(row.id ?? idx),
          name: baseName,
          day: row.day || row.day_name || row.weekday || null,
          start_time: row.start_time || row.start || null,
          end_time: row.end_time || row.end || null,
          room: row.room || row.room_no || row.room_number || null,
          instructor: teacher,
        });
      });

      setSchedule(expanded);
      setFetchDebug((prev) => ({ ...(prev || {}), schedule: { source, count: expanded.length, sectionId, sectionName: section || null } }));
    } catch (err) {
      console.warn('fetchSchedule error', err.message || err);
    }
  }, [student, studentData, resolveSectionId]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.warn('fetchAnnouncements error', err.message || err);
    }
  }, []);

  const updateStudentProfile = useCallback(
    async ({ firstName, lastName, email }) => {
      try {
        if (!student && !studentData) {
          throw new Error('No student in context to update');
        }
        const id = student?.id;
        const lrn = student?.lrn || studentData?.lrn;
        if (!id && !lrn) {
          throw new Error('Missing student identifier');
        }

        const updates = {
          ...(firstName != null ? { first_name: firstName } : {}),
          ...(lastName != null ? { last_name: lastName } : {}),
          ...(email != null ? { email } : {}),
          updated_at: new Date().toISOString(),
        };

        let query = supabase.from('students').update(updates);
        query = id ? query.eq('id', id) : query.eq('lrn', lrn);

        const { data, error } = await query.select('*').single();
        if (error) throw error;

        // Update local state
        const fullName = `${data?.first_name || ''} ${data?.last_name || ''}`.trim();
        setStudent((prev) => ({ ...(prev || {}), ...data }));
        setStudentData((prev) => ({ ...(prev || {}), ...data, fullName }));
        if (data?.student_number) setStudentNumber(data.student_number);
        return { ok: true, data };
      } catch (err) {
        console.warn('updateStudentProfile error', err.message || err);
        return { ok: false, error: err };
      }
    },
    [student, studentData]
  );

  useEffect(() => {
    // Trigger fetches when we have a student id OR when section/grade info is present (for section-based datasets)
    const sid = student?.id;
    const hasSectionOrGrade = Boolean(
      student?.section_id || studentData?.section_id || student?.section || studentData?.section || student?.grade || studentData?.grade || student?.grade_level || studentData?.grade_level
    );

    if (sid || hasSectionOrGrade) {
      fetchSubjects(sid);
      fetchSchedule(sid);
      if (sid) fetchGrades(sid); // grades typically tied to student id
      // Enrich with section metadata if missing
      const secId = student?.section_id || studentData?.section_id;
      if (secId && !prevHasSectionName()) {
        void fetchSectionMeta(secId);
      }
    }
    // Always fetch announcements
    fetchAnnouncements();
  }, [student, studentData, fetchSubjects, fetchGrades, fetchSchedule, fetchAnnouncements]);

  return (
    <StudentContext.Provider
      value={{
        student,
        setStudent,
        studentNumber,
        setStudentNumber,
        studentData,
        setStudentData,
        subjects,
        grades,
        schedule,
        announcements,
        loading,
  fetchDebug,
        fetchStudentData,
        fetchSubjects,
        fetchGrades,
        fetchSchedule,
        fetchAnnouncements,
        updateStudentProfile,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};
