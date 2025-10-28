import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../config/theme';
import { StudentContext } from '../context/StudentContext';

// Map subject names to icons
const getIconNameBySubject = (name = '') => {
  const n = String(name).toLowerCase();
  if (n.includes('math')) return 'calculator-variant';
  if (n.includes('sci')) return 'atom';
  if (n.includes('engl')) return 'book-open-page-variant';
  if (n.includes('fil')) return 'alphabetical-variant';
  if (n.includes('mapeh') || n.includes('pe')) return 'run';
  if (n.includes('ap') || n.includes('araling')) return 'earth';
  return 'book-open-variant';
};

export default function SubjectsSummaryScreen() {
  const { student, studentData, subjects: ctxSubjects, schedule: ctxSchedule, fetchDebug } = useContext(StudentContext);

  const subjectsUI = useMemo(() => {
    return (ctxSubjects || []).map((s, idx) => ({
      id: String(s.id ?? idx),
      name: s.name || s.subject_name || s.title || 'Subject',
      units: Number(s.units) || 1,
      icon: getIconNameBySubject(s.name || s.subject_name || ''),
    }));
  }, [ctxSubjects]);

  const totalSubjects = subjectsUI.length;
  const totalUnits = subjectsUI.reduce((sum, subj) => sum + (Number(subj.units) || 0), 0) || totalSubjects;

  // Group schedule by day for display
  const dayNameMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const scheduleByDay = useMemo(() => {
    const byDay = {};
    (ctxSchedule || []).forEach((row, idx) => {
      const day = row.day || row.day_name || row.weekday || '';
      if (!day) return;
      const start = row.start_time || row.start || '';
      const end = row.end_time || row.end || '';
      const time = row.time || (start && end ? `${start} - ${end}` : '');
      const cls = {
        id: String(row.id ?? idx),
        code: row.code || row.section || '',
        name: row.name || row.subject || row.subject_name || 'Class',
        time,
        room: row.room || row.room_no || row.room_number || '',
        instructor: row.instructor || row.teacher || row.professor || '',
      };
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(cls);
    });
    const order = dayNameMap.reduce((acc, d, i) => (acc[d] = i, acc), {});
    const days = Object.keys(byDay).sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99));
    return days.map((d) => ({ day: d, classes: byDay[d] }));
  }, [ctxSchedule]);

  const getColorBySubject = (name) => {
    const map = {
      Mathematics: '#4ECDC4',
      English: '#A37AFC',
      Science: '#1CAC58',
      Filipino: '#FF6B6B',
      MAPEH: '#FFA36C',
    };
    return map[name] || '#4ECDC4';
  };

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.8} style={styles.subjectCard}>
      <LinearGradient
        colors={[colors.surface, colors.surfaceAlt]}
        style={styles.cardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.subjectInfo}>
          <View style={[styles.iconContainer, { backgroundColor: getColorBySubject(item.name) }]}>
            <MaterialCommunityIcons name={item.icon} size={26} color="white" />
          </View>
          <Text style={styles.subjectName}>{item.name}</Text>
        </View>
        <Text style={styles.units}>{item.units} units</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={colors.gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerTitle}>Class Schedule and Subjects</Text>
        {(student || studentData) && (
          <Text style={styles.headerSub}>
            {(() => {
              const grade = student?.grade || student?.grade_level || studentData?.grade || studentData?.grade_level;
              const section = student?.section || student?.section_name || studentData?.section || studentData?.section_name;
              const g = grade ? `Grade ${grade}` : '';
              const s = section ? `Section ${section}` : '';
              const sep = g && s ? ' • ' : '';
              return g || s ? `${g}${sep}${s}` : '';
            })()}
          </Text>
        )}

        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.shadow]}>
            <Text style={styles.summaryNumber}>{totalSubjects}</Text>
            <Text style={styles.summaryLabel}>Total Subjects</Text>
          </View>

          <View style={[styles.summaryCard, styles.shadow]}>
            <Text style={styles.summaryNumber}>{totalUnits}</Text>
            <Text style={styles.summaryLabel}>Total Units</Text>
          </View>
        </View>

        <View style={styles.subjectsContainer}>
          <Text style={styles.subjectsTitle}>Your Subjects</Text>
          <FlatList
            data={subjectsUI}
            keyExtractor={(item) => item.id}
            renderItem={renderSubjectItem}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No subjects found.</Text>}
          />
        </View>

        <View style={styles.subjectsContainer}>
          <Text style={styles.subjectsTitle}>Class Schedule</Text>
          {scheduleByDay.length === 0 ? (
            <Text style={styles.emptyText}>No classes scheduled.</Text>
          ) : (
            scheduleByDay.map((d) => (
              <View key={d.day} style={styles.dayBlock}>
                <Text style={styles.dayHeading}>{d.day}</Text>
                {d.classes.map((cls) => (
                  <View key={cls.id} style={styles.classRow}>
                    <View style={styles.classDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.className}>{cls.name}</Text>
                      {!!cls.time && <Text style={styles.classMeta}>{cls.time}</Text>}
                      {!!cls.room && <Text style={styles.classMeta}>Room: {cls.room}</Text>}
                      {!!cls.instructor && <Text style={styles.classMeta}>Instructor: {cls.instructor}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {__DEV__ && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>
              Debug • section_id: {String(student?.section_id || studentData?.section_id || '')} • section: {String(student?.section || student?.section_name || studentData?.section || studentData?.section_name || '')}
            </Text>
            {!!fetchDebug && (
              <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                Subjects: {(fetchDebug.subjects?.count ?? 0)} via {(fetchDebug.subjects?.source || 'n/a')} • Schedule: {(fetchDebug.schedule?.count ?? 0)} via {(fetchDebug.schedule?.source || 'n/a')}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginVertical: 20,
  },
  headerSub: {
    textAlign: 'center',
    color: '#334155',
    marginTop: -10,
    marginBottom: 16,
    fontSize: 14,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    paddingVertical: 25,
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1CAC58',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
  },
  subjectsContainer: {
    marginTop: 10,
  },
  dayBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dayHeading: { fontSize: 16, fontWeight: '700', color: '#1E3A8A', marginBottom: 8 },
  classRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  classDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 10,
  },
  className: { fontSize: 15, fontWeight: '700', color: '#111827' },
  classMeta: { fontSize: 12, color: '#374151' },
  subjectsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  subjectCard: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardInner: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333',
  },
  units: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
});
