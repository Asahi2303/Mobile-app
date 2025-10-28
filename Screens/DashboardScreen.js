// /Screens/DashboardScreen.js
import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { StudentContext } from '../context/StudentContext';
import { colors, shadow as sh } from '../config/theme';

const { width } = Dimensions.get('window');

export default function Dashboard({ navigation: navProp, studentName: propName = '', email: propEmail = '' }) {
  // Prefer prop navigation when available (more reliable in nested navigators),
  // otherwise fall back to the hook.
  const navFromHook = useNavigation();
  const navigation = navProp ?? navFromHook;
  const { student, studentData, subjects, schedule } = useContext(StudentContext);

  // Helper to navigate to a route regardless of nesting (current or any parent navigator)
  const navigateToRoute = (routeName) => {
    try {
      let nav = navigation;
      // Walk up parents to find a navigator that knows this route
      while (nav && typeof nav.getState === 'function') {
        const state = nav.getState();
        const hasRoute = Array.isArray(state?.routes) && state.routes.some(r => r?.name === routeName);
        if (hasRoute && typeof nav.navigate === 'function') {
          nav.navigate(routeName);
          return true;
        }
        if (typeof nav.getParent === 'function') {
          nav = nav.getParent();
        } else {
          break;
        }
      }
    } catch (_) {
      // ignore
    }
    return false;
  };

  const displayName = useMemo(() => {
    const n = `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
    return n || studentData?.fullName || propName || 'Welcome';
  }, [student, studentData, propName]);

  const sectionText = useMemo(() => {
    const grade = student?.grade || studentData?.grade || student?.grade_level || studentData?.grade_level;
    const section = student?.section || student?.section_name || studentData?.section || studentData?.section_name;
    const g = grade ? `Grade ${grade}` : null;
    const s = section ? `Section ${section}` : null;
    return [g, s].filter(Boolean).join(' • ');
  }, [student, studentData]);

  const stats = useMemo(() => ({
    subjects: Array.isArray(subjects) ? subjects.length : 0,
    classes: Array.isArray(schedule) ? schedule.length : 0,
  }), [subjects, schedule]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={colors.gradient} style={styles.gradient}>
        <View style={styles.headerBox}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{displayName}</Text>
          {!!sectionText && <Text style={styles.meta}>{sectionText}</Text>}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.shadow]}> 
            <MaterialCommunityIcons name="book-education" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{stats.subjects}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
          <View style={[styles.statCard, styles.shadow]}> 
            <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{stats.classes}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
        </View>

        <View style={styles.quickGrid}>
          {/** small helper to avoid crashes if navigation isn't ready */}
          {/** use inline function to keep dependencies minimal */}
          {/** eslint-disable-next-line react/jsx-no-bind */}
          <TouchableOpacity
            style={[styles.quickCard, styles.shadow]}
            activeOpacity={0.85}
            onPress={() => {
              // Direct to Subjects Summary screen (subjects + schedule view)
              if (typeof navigation?.navigate === 'function') {
                navigation.navigate('Subjects Summary');
                return;
              }
              try { navigation?.getParent()?.navigate('Subjects Summary'); } catch (_) {}
            }}
          >
            <View style={styles.quickIconWrap}>
              <MaterialCommunityIcons name="calendar-text" size={26} color="#fff" />
            </View>
            <Text style={styles.quickTitle}>Class Schedule</Text>
            <Text style={styles.quickSub}>View your weekly classes</Text>
          </TouchableOpacity>

          {/** Subjects button removed per request */}

          <TouchableOpacity
            style={[styles.quickCard, styles.shadow]}
            activeOpacity={0.85}
            onPress={() => (typeof navigation?.navigate === 'function' ? navigation.navigate('Grades') : null)}
          >
            <View style={styles.quickIconWrap}>
              <MaterialIcons name="grading" size={26} color="#fff" />
            </View>
            <Text style={styles.quickTitle}>Grades</Text>
            <Text style={styles.quickSub}>Check your performance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, styles.shadow]}
            activeOpacity={0.85}
            onPress={() => {
              if (navigateToRoute('ProfileScreen')) return;
              if (typeof navigation?.navigate === 'function') {
                navigation.navigate('MainDrawer', { screen: 'ProfileScreen' });
              }
            }}
          >
            <View style={styles.quickIconWrap}>
              <MaterialCommunityIcons name="account" size={26} color="#fff" />
            </View>
            <Text style={styles.quickTitle}>Profile</Text>
            <Text style={styles.quickSub}>View your information</Text>
          </TouchableOpacity>

          {/** Announcements card removed per request */}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  gradient: { flex: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 20 },
  headerBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  greeting: { fontSize: 14, color: '#64748b' },
  name: { fontSize: 24, fontWeight: '800', color: '#1E3A8A', marginTop: 2 },
  meta: { fontSize: 13, color: '#334155', marginTop: 4 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: 6 },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 2 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
  quickCard: {
    width: (width - 18 * 2 - 12) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  quickIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  quickSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  shadow: sh.md,
});
