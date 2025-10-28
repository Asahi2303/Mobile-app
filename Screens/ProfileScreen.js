import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { StudentContext } from '../context/StudentContext';
import { colors } from '../config/theme';

export default function ProfileScreen() {
  const { student, studentData, updateStudentProfile } = useContext(StudentContext);

  const fullName = useMemo(() => {
    const n = `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
    return n || studentData?.fullName || 'Student';
  }, [student, studentData]);

  const initials = useMemo(() => {
    const first = (student?.first_name || studentData?.first_name || '').trim();
    const last = (student?.last_name || studentData?.last_name || '').trim();
    return (first[0] || '') + (last[0] || '');
  }, [student, studentData]);

  const grade = student?.grade || student?.grade_level || studentData?.grade || studentData?.grade_level;
  const section = student?.section || student?.section_name || studentData?.section || studentData?.section_name;
  const lrn = String(student?.lrn || studentData?.lrn || '').trim();
  const email = (student?.email || studentData?.email || '').trim();
  const sectionName = (student?.section || student?.section_name || studentData?.section || studentData?.section_name || '').trim();

  // Edit state
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(student?.first_name || studentData?.first_name || '');
  const [lastName, setLastName] = useState(student?.last_name || studentData?.last_name || '');
  const [editEmail, setEditEmail] = useState(email);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    try {
      setSaving(true);
      const { ok, error } = await updateStudentProfile({ firstName, lastName, email: editEmail });
      if (!ok) throw error || new Error('Update failed');
      Toast.show({ type: 'success', text1: 'Profile updated' });
      setEditing(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to update', text2: String(err?.message || err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Card */}
        <View style={[styles.card, styles.headerCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(initials || 'ST').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{fullName}</Text>
          {!!(grade || section) && (
            <Text style={styles.muted}>{[grade && `Grade ${grade}`, section && `Section ${section}`].filter(Boolean).join(' • ')}</Text>
          )}
          {!!email && <Text style={styles.muted}>{email}</Text>}
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing((v) => !v)}>
          <MaterialIcons name={editing ? 'close' : 'edit'} size={20} color="#1CAC58" />
          <Text style={styles.editBtnText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
        </View>

        {/* Academic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Academic</Text>
          <View style={styles.row}> 
            <MaterialCommunityIcons name="card-account-details" size={20} color="#1CAC58" style={styles.rowIcon} />
            <Text style={styles.rowLabel}>LRN</Text>
            <Text style={styles.rowValue}>{lrn || '—'}</Text>
          </View>
          <View style={styles.row}> 
            <MaterialCommunityIcons name="account-school" size={20} color="#1CAC58" style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Section</Text>
            <Text style={styles.rowValue}>{sectionName || '—'}</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.row}> 
            <MaterialCommunityIcons name="email-outline" size={20} color="#1CAC58" style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{email || '—'}</Text>
          </View>
        </View>

        {/** Actions removed per request */}

        {/* Inline Edit */}
        {editing && (
          <View style={[styles.card, styles.editCard]}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>First name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Last name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter email"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  scrollContent: { paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 12,
  },
  headerCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  name: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  muted: { fontSize: 13, color: '#64748b', marginTop: 3 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, marginLeft: 10 },
  editBtnText: { marginLeft: 6, color: colors.primary, fontWeight: '700' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowIcon: { marginRight: 10 },
  rowLabel: { width: 110, fontSize: 13, color: '#334155' },
  rowValue: { flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '600' },

  

  editCard: {},
  inputRow: { marginBottom: 10 },
  inputLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  editActions: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 10 },
  saveBtnText: { marginLeft: 8, color: '#fff', fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 10 },
  cancelBtnText: { color: '#334155', fontWeight: '700' },
});
