import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StudentContext } from '../context/StudentContext';
import { colors } from '../config/theme';

export default function GradesScreen() {
  const { student, studentData, grades } = useContext(StudentContext);

  // Normalize grades for display
  const normalized = useMemo(() => {
    // Parse numeric grade from varied string/number inputs (e.g., "85%", "85.5")
    const toNum = (v) => {
      if (v == null) return null;
      const sv = String(v).trim();
      if (!sv) return null;
      const parsed = parseFloat(sv.replace(/[^0-9\.\-]/g, ''));
      return Number.isFinite(parsed) ? parsed : null;
    };

    // Normalize a key: lowercase and strip spaces/underscores/hyphens
    const keyNorm = (k) => String(k).toLowerCase().replace(/\s+|_|-/g, '');

    // Case-insensitive key pick with normalization
    const pickFromKeysCI = (obj, keys) => {
      if (!obj || typeof obj !== 'object') return null;
      const map = new Map();
      Object.keys(obj).forEach((k) => map.set(keyNorm(k), obj[k]));
      for (const raw of keys) {
        const kn = keyNorm(raw);
        if (map.has(kn)) {
          const n = toNum(map.get(kn));
          if (n != null) return n;
        }
      }
      return null;
    };

    // Read from nested containers; support JSON string, object, and arrays
    const getQuarterFromNested = (g, keys, idx) => {
      const containers = ['quarters', 'grading', 'gradings', 'periods', 'period', 'quarter', 'grades', 'terms'];
      for (const c of containers) {
        let node = g?.[c];
        if (!node) continue;
        if (typeof node === 'string') {
          try { node = JSON.parse(node); } catch { node = null; }
        }
        if (!node) continue;
        if (Array.isArray(node)) {
          const v = node[idx];
          const n = toNum(v);
          if (n != null) return n;
        } else if (typeof node === 'object') {
          const n = pickFromKeysCI(node, keys);
          if (n != null) return n;
        }
      }
      return null;
    };

    const variants = {
      q1: ['q1','q_1','first','1st','firstquarter','first_quarter','quarter1','quarter_1','prelim','firstgrading','first_grading','firstperiod','period1','grading1','g1','qtr1','q1grade','q1_grades'],
      q2: ['q2','q_2','second','2nd','secondquarter','second_quarter','quarter2','quarter_2','midterm','secondgrading','second_grading','secondperiod','period2','grading2','g2','qtr2','q2grade','q2_grades'],
      q3: ['q3','q_3','third','3rd','thirdquarter','third_quarter','quarter3','quarter_3','semi','thirdgrading','third_grading','thirdperiod','period3','grading3','g3','qtr3','q3grade','q3_grades'],
      q4: ['q4','q_4','fourth','4th','fourthquarter','fourth_quarter','quarter4','quarter_4','finals','fourthgrading','fourth_grading','fourthperiod','period4','grading4','g4','qtr4','q4grade','q4_grades'],
    };

    // Determine a subject key to group by
    // Normalize an identifier for stable grouping (strip spaces/punctuation, lower-case)
    const normalizeId = (v) => String(v ?? '').toLowerCase().trim().replace(/\s+|[^a-z0-9]/g, '') || '';

    // Determine a subject key to group by. We group by subject identifier (id/code/name) and
    // academic year only. Term/semester values in exported rows are noisy and may differ
    // across rows, which caused the same subject to split into multiple cards. We will
    // collect term values separately so all quarters appear in the same container.
    const subjectKeyFrom = (g, name) => {
      const sid = g.subject_id ?? g.subjectId ?? g.subjectid ?? null;
      const code = g.subject_code ?? g.code ?? null;
      const sy = g.academic_year ?? g.sy ?? g.school_year ?? '';
      const base = normalizeId(sid ?? code ?? name ?? 'subject');
      const syClean = normalizeId(sy);
      return `${base}|${syClean}`;
    };

    // Determine which single quarter a row represents (when the row doesn’t contain all quarters)
    const quarterIndexFrom = (g) => {
      // Prefer an explicit semester/semester_no field if present (some exports use this)
      const semRaw = g.semester ?? g.sem ?? g.sem_no ?? g.semester_no ?? null;
      if (semRaw != null) {
        const ss = keyNorm(semRaw);
        // If semester explicitly contains 1/2/3/4 or first/second etc., map accordingly
        if (ss === '1' || ss === 'first' || ss === '1st' || ss === 'sem1' || ss === 'semester1') return 0;
        if (ss === '2' || ss === 'second' || ss === '2nd' || ss === 'sem2' || ss === 'semester2') return 1;
        if (ss === '3' || ss === 'third' || ss === '3rd' || ss === 'sem3' || ss === 'semester3') return 2;
        if (ss === '4' || ss === 'fourth' || ss === '4th' || ss === 'sem4' || ss === 'semester4') return 3;
        const snum = Number(ss.replace(/[^0-9]/g, ''));
        if (Number.isFinite(snum) && snum >= 1 && snum <= 4) return snum - 1;
      }

      // Fallback to other possible quarter indicators
      const raw = g.quarter ?? g.grading_period ?? g.grading ?? g.period ?? g.term ?? g.qtr ?? g.q ?? null;
      if (raw == null) return null;
      const s = keyNorm(raw);
      if (s === '1' || s === 'q1' || s === 'first' || s === '1st' || s === 'prelim' || s === 'period1' || s === 'grading1') return 0;
      if (s === '2' || s === 'q2' || s === 'second' || s === '2nd' || s === 'midterm' || s === 'period2' || s === 'grading2') return 1;
      if (s === '3' || s === 'q3' || s === 'third' || s === '3rd' || s === 'semi' || s === 'period3' || s === 'grading3') return 2;
      if (s === '4' || s === 'q4' || s === 'fourth' || s === '4th' || s === 'finals' || s === 'period4' || s === 'grading4') return 3;
      const num = Number(s.replace(/[^0-9]/g, ''));
      if (Number.isFinite(num) && num >= 1 && num <= 4) return num - 1;
      return null;
    };

    // Extract quarter values present in the row, possibly all quarters
    const getRowQuarters = (g) => {
      const q1 = pickFromKeysCI(g, variants.q1) ?? getQuarterFromNested(g, variants.q1, 0);
      const q2 = pickFromKeysCI(g, variants.q2) ?? getQuarterFromNested(g, variants.q2, 1);
      const q3 = pickFromKeysCI(g, variants.q3) ?? getQuarterFromNested(g, variants.q3, 2);
      const q4 = pickFromKeysCI(g, variants.q4) ?? getQuarterFromNested(g, variants.q4, 3);
      return { q1, q2, q3, q4 };
    };

    // Choose a "grade" value for single-quarter rows
    const pickSingleGrade = (g) => toNum(g.grade ?? g.score ?? g.value ?? g.points ?? g.final_grade ?? g.mark);

    // Merge rows per subject
    const map = new Map();
    (grades || []).forEach((g, idx) => {
      const name = g.subject_name || g.subject || g?.subjects?.name || 'Subject';
      const key = subjectKeyFrom(g, name);
      const ts = new Date(g.updated_at || g.created_at || g.date || 0).getTime() || (idx + 1); // stable fallback

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          // keep a canonical academic year (raw if present)
          academicYear: g.academic_year || g.sy || g.school_year || null,
          // we'll collect term/semester values into a set and render a friendly label later
          _terms: new Set(),
          q1: null, q2: null, q3: null, q4: null,
          _t: { q1: 0, q2: 0, q3: 0, q4: 0 },
          _finals: [],
        });
      }

      const acc = map.get(key);
  // collect noisy term/semester indicators so we can display them but not split groups
  const termRaw = g.term ?? g.semester ?? g.period ?? null;
  if (termRaw) acc._terms.add(String(termRaw).trim());
  if (!acc.academicYear && (g.academic_year || g.sy || g.school_year)) acc.academicYear = g.academic_year || g.sy || g.school_year;

      // extract quarters from this row
      const rowQs = getRowQuarters(g);
      const hasAnyQ = [rowQs.q1, rowQs.q2, rowQs.q3, rowQs.q4].some((v) => v != null);
      if (hasAnyQ) {
        ['q1','q2','q3','q4'].forEach((qk) => {
          const val = rowQs[qk];
          if (val != null && ts >= (acc._t[qk] || 0)) { acc[qk] = val; acc._t[qk] = ts; }
        });
      } else {
        // maybe a single-quarter row with an indicator
        const qIdx = quarterIndexFrom(g);
        const val = pickSingleGrade(g);
        if (qIdx != null && val != null) {
          const qk = ['q1','q2','q3','q4'][qIdx];
          if (ts >= (acc._t[qk] || 0)) { acc[qk] = val; acc._t[qk] = ts; }
        }
      }

      // collect finals if present
      const f = toNum(g.grade ?? g.final_grade ?? g.final ?? g.average ?? g.quarterly_average ?? g.quarterlyavg ?? g.q_average);
      if (f != null) acc._finals.push({ val: f, ts });
    });

    // finalize array and compute totals
    const out = Array.from(map.values()).map((it) => {
      const quarters = [it.q1, it.q2, it.q3, it.q4].filter((x) => x != null);
      const total = quarters.length ? quarters.reduce((a, b) => a + b, 0) : null;
      const average = quarters.length ? (total / quarters.length) : null;
      // prefer latest provided final; else use average
      const latestFinal = it._finals.sort((a, b) => b.ts - a.ts)[0]?.val ?? null;
      const final = latestFinal != null ? latestFinal : (average != null ? average : null);
      const remark = final != null ? (final >= 75 ? 'PASSED' : 'FAILED') : null;
      // Determine a friendly term display: single term => show it, multiple => 'Multiple'
      const terms = Array.from(it._terms).filter(Boolean);
      const termDisplay = terms.length === 0 ? null : (terms.length === 1 ? terms[0] : 'Multiple');
      return {
        id: it.id,
        name: it.name,
        term: termDisplay,
        academicYear: it.academicYear,
        q1: it.q1, q2: it.q2, q3: it.q3, q4: it.q4,
        total, average, final, remark,
      };
    });

    return out;
  }, [grades]);

  const counts = normalized.length;
  const overall = useMemo(() => {
    const vals = normalized.map((g) => g.final).filter((v) => v != null);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  }, [normalized]);

  // Average across all quarter entries (Q1–Q4) from all subjects
  const overallQuarterlyAverage = useMemo(() => {
    const vals = [];
    normalized.forEach((n) => {
      [n.q1, n.q2, n.q3, n.q4].forEach((v) => { if (v != null) vals.push(v); });
    });
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  }, [normalized]);

  const gradeColor = (g) => {
    if (g == null) return colors.muted;
    return g >= 90 ? '#10b981' : g >= 85 ? '#22c55e' : g >= 80 ? '#84cc16' : g >= 75 ? '#f59e0b' : '#ef4444';
  };

  const headerGradeSection = (() => {
    const grade = student?.grade || student?.grade_level || studentData?.grade || studentData?.grade_level;
    const section = student?.section || student?.section_name || studentData?.section || studentData?.section_name;
    const g = grade ? `Grade ${grade}` : '';
    const sTxt = section ? `Section ${section}` : '';
    return g || sTxt ? `${g}${g && sTxt ? ' • ' : ''}${sTxt}` : '';
  })();

  // Overall per-quarter averages across all subjects
  const quarterAverages = useMemo(() => {
    const acc = { q1: [], q2: [], q3: [], q4: [] };
    normalized.forEach((n) => {
      if (n.q1 != null) acc.q1.push(n.q1);
      if (n.q2 != null) acc.q2.push(n.q2);
      if (n.q3 != null) acc.q3.push(n.q3);
      if (n.q4 != null) acc.q4.push(n.q4);
    });
    const avg = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : null);
    return { q1: avg(acc.q1), q2: avg(acc.q2), q3: avg(acc.q3), q4: avg(acc.q4) };
  }, [normalized]);

  const renderItem = ({ item }) => (
    <View style={styles.gradeCard}>
      {/* Header: Subject + SY/Term */}
      <View style={styles.gradeCardHeader}>
        <Text style={styles.subjectName}>{item.name}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>SY: {item.academicYear || '—'}</Text>
        <Text style={styles.metaText}>Term: {item.term || '—'}</Text>
      </View>

      {/* Quarter grid */}
      <View style={styles.quarterGrid}>
        <View style={styles.quarterCell}>
          <Text style={styles.quarterLabel}>1st Quarter</Text>
          <View style={[
            styles.quarterValueBox,
            { borderColor: item.q1 != null ? gradeColor(item.q1) : colors.border }
          ]}>
            <Text style={[
              styles.quarterValue,
              { color: item.q1 != null ? gradeColor(item.q1) : '#6b7280' }
            ]}>
              {item.q1 != null ? item.q1 : '—'}
            </Text>
          </View>
        </View>
        <View style={styles.quarterCell}>
          <Text style={styles.quarterLabel}>2nd Quarter</Text>
          <View style={[
            styles.quarterValueBox,
            { borderColor: item.q2 != null ? gradeColor(item.q2) : colors.border }
          ]}>
            <Text style={[
              styles.quarterValue,
              { color: item.q2 != null ? gradeColor(item.q2) : '#6b7280' }
            ]}>
              {item.q2 != null ? item.q2 : '—'}
            </Text>
          </View>
        </View>
        <View style={styles.quarterCell}>
          <Text style={styles.quarterLabel}>3rd Quarter</Text>
          <View style={[
            styles.quarterValueBox,
            { borderColor: item.q3 != null ? gradeColor(item.q3) : colors.border }
          ]}>
            <Text style={[
              styles.quarterValue,
              { color: item.q3 != null ? gradeColor(item.q3) : '#6b7280' }
            ]}>
              {item.q3 != null ? item.q3 : '—'}
            </Text>
          </View>
        </View>
        <View style={styles.quarterCell}>
          <Text style={styles.quarterLabel}>4th Quarter</Text>
          <View style={[
            styles.quarterValueBox,
            { borderColor: item.q4 != null ? gradeColor(item.q4) : colors.border }
          ]}>
            <Text style={[
              styles.quarterValue,
              { color: item.q4 != null ? gradeColor(item.q4) : '#6b7280' }
            ]}>
              {item.q4 != null ? item.q4 : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer stats: show Total and move Quarterly Avg to the rightmost slot (remove Final) */}
      <View style={styles.footerRow}>
        <View style={styles.footerStat}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerValue}>{item.total != null ? item.total.toFixed(2) : '—'}</Text>
        </View>
        <View style={styles.footerStat}>
          <Text style={styles.footerLabel}>Quarterly Avg</Text>
          <Text style={[styles.footerValue, { color: gradeColor(item.average) }]}>{item.average != null ? item.average.toFixed(2) : '—'}</Text>
        </View>
      </View>

      {item.remark ? (
        <View style={styles.remarkBox}>
          <Text style={styles.remarkText}>{item.remark}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <LinearGradient
      colors={colors.gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Academic Grades</Text>
            {!!headerGradeSection && <Text style={styles.termText}>{headerGradeSection}</Text>}
          </View>

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{counts}</Text>
              <Text style={styles.summaryLabel}>Subjects Graded</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: overall != null ? gradeColor(overall) : '#64748b' }]}>{overall != null ? overall.toFixed(2) : '—'}</Text>
              <Text style={styles.summaryLabel}>Average</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: overallQuarterlyAverage != null ? gradeColor(overallQuarterlyAverage) : '#64748b' }]}>
                {overallQuarterlyAverage != null ? overallQuarterlyAverage.toFixed(2) : '—'}
              </Text>
              <Text style={styles.summaryLabel}>Quarterly Avg</Text>
            </View>
          </View>

          {/* Per-quarter averages across subjects */}
          <View style={styles.quarterSummaryRow}>
            <View style={styles.quarterSummaryCard}>
              <Text style={styles.qSumLabel}>Q1 Avg</Text>
              <Text style={[styles.qSumValue, { color: gradeColor(quarterAverages.q1) }]}>
                {quarterAverages.q1 != null ? quarterAverages.q1.toFixed(2) : '—'}
              </Text>
            </View>
            <View style={styles.quarterSummaryCard}>
              <Text style={styles.qSumLabel}>Q2 Avg</Text>
              <Text style={[styles.qSumValue, { color: gradeColor(quarterAverages.q2) }]}>
                {quarterAverages.q2 != null ? quarterAverages.q2.toFixed(2) : '—'}
              </Text>
            </View>
            <View style={styles.quarterSummaryCard}>
              <Text style={styles.qSumLabel}>Q3 Avg</Text>
              <Text style={[styles.qSumValue, { color: gradeColor(quarterAverages.q3) }]}>
                {quarterAverages.q3 != null ? quarterAverages.q3.toFixed(2) : '—'}
              </Text>
            </View>
            <View style={styles.quarterSummaryCard}>
              <Text style={styles.qSumLabel}>Q4 Avg</Text>
              <Text style={[styles.qSumValue, { color: gradeColor(quarterAverages.q4) }]}>
                {quarterAverages.q4 != null ? quarterAverages.q4.toFixed(2) : '—'}
              </Text>
            </View>
          </View>

          {/* List or Empty */}
          {counts === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="notebook-edit-outline" size={60} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Your Grades Will Appear Here</Text>
              <Text style={styles.emptyText}>
                Once your instructors publish the grades for this term, they'll be displayed in this section.
              </Text>
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.primary} />
                <Text style={styles.infoText}>
                  Check back at the end of the semester or contact your instructors for grade updates.
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={normalized}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  termText: {
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryCard: { width: '32%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 18, paddingVertical: 25, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  summaryNumber: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  summaryLabel: { fontSize: 14, color: '#666', marginTop: 4 },

  quarterSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  quarterSummaryCard: { width: '23%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  qSumLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  qSumValue: { fontSize: 16, fontWeight: '800', color: colors.text },

  gradeCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderWidth: 1, borderColor: colors.border },
  gradeCardHeader: { marginBottom: 8 },
  subjectName: { fontSize: 18, fontWeight: '800', color: colors.heading },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  quarterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  quarterCell: { width: '48%', backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  quarterLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '600' },
  quarterValueBox: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  quarterValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  footerStat: { alignItems: 'flex-start', flex: 1 },
  footerLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  footerValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  remarkBox: { marginTop: 10, backgroundColor: colors.primarySoft, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'flex-start' },
  remarkText: { color: colors.primaryDark, fontWeight: '700', fontSize: 12 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconContainer: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 55,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
});
