import React, { useState, useContext, useRef } from 'react';
import { 
  View, 
  TextInput, 
  Alert, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StudentContext } from '../context/StudentContext';
import { supabase } from '../config/supabase';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [lrnInput, setLrnInput] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameInputRef = useRef(null);

  const { setStudentData, setStudent } = useContext(StudentContext);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setLrnInput('');
        setFullName('');
      };
    }, [])
  );

  // Format LRN as 1234-5678-9012 while typing
  const formatLrn = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const part1 = cleaned.slice(0, 4);
    const part2 = cleaned.slice(4, 8);
    const part3 = cleaned.slice(8, 12);

    if (part3) return `${part1}-${part2}-${part3}`;
    if (part2) return `${part1}-${part2}`;
    if (part1) return `${part1}`;
    return '';
  };

  const handleLrnChange = (text) => {
    setLrnInput(formatLrn(text));
  };

  const handleLogin = async () => {
    // Basic field validation
    if (!lrnInput || !fullName) {
      Alert.alert('Missing Fields', 'Please fill in both LRN and Full Name.');
      return;
    }

    const normalizeName = (s = '') =>
      s
        .toLowerCase()
        .replace(/[.]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const dropSuffixes = (tokens = []) => {
      const suffixes = new Set(['jr', 'sr', 'iii', 'iv', 'ii']);
      const out = [...tokens];
      while (out.length > 0 && suffixes.has(out[out.length - 1])) {
        out.pop();
      }
      return out;
    };

    const parseFirstLast = (name = '') => {
      const tokensRaw = normalizeName(name).split(' ').filter(Boolean);
      const tokens = dropSuffixes(tokensRaw);
      if (tokens.length < 2) return { first: '', last: '' };
      return { first: tokens[0], last: tokens[tokens.length - 1] };
    };

    const cleaned = lrnInput.replace(/\D/g, ''); // just digits
    const dashed = lrnInput; // as typed (with dashes)

    // Quick client-side checks
    if (cleaned.length < 6) {
      Alert.alert('Invalid LRN', 'Please enter a valid LRN.');
      return;
    }
    if (!/\s/.test(fullName.trim())) {
      Alert.alert('Invalid Name', 'Please enter your full name (First Last).');
      return;
    }

    setIsLoading(true);
    try {
      // Helper: try fetching a single row by a column/value; enforce single match
      const fetchOneBy = async (column, value) => {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq(column, value)
          .maybeSingle();
        // maybeSingle returns error if multiple rows match
        if (error) throw error;
        return data || null;
      };

      let row = null;
      // Try common variants for the LRN column/value
      const numericCleaned = cleaned ? Number(cleaned) : null;
      const candidates = [
        { col: 'lrn', val: cleaned },
        ...(numericCleaned ? [{ col: 'lrn', val: numericCleaned }] : []),
        ...(dashed && dashed !== cleaned ? [{ col: 'lrn', val: dashed }] : []),
        // occasional alt column names
        { col: 'student_lrn', val: cleaned },
        ...(numericCleaned ? [{ col: 'student_lrn', val: numericCleaned }] : []),
        { col: 'student_number', val: cleaned },
        { col: 'student_no', val: cleaned },
      ];

      let lastErr = null;
      for (const { col, val } of candidates) {
        try {
          row = await fetchOneBy(col, val);
          if (row) break;
        } catch (e) {
          // If multiple rows match, block login with a clear message
          const msg = String(e?.message || e || '')
            .toLowerCase();
          if (msg.includes('multiple') || msg.includes('more than one')) {
            Alert.alert(
              'Duplicate LRN',
              'Multiple records found for this LRN. Please contact the registrar.'
            );
            return;
          }
          lastErr = e;
        }
      }

      if (!row) {
        if (lastErr) console.warn('Login lookup warning:', lastErr);
        Alert.alert('Login Failed', 'LRN not found. Please check your LRN and try again.');
        return;
      }

      // Strict name check: compare first + last only (ignore middle/suffix/punctuation)
      const inputFL = parseFirstLast(fullName);
      // Prefer explicit columns; otherwise derive from a full_name field
      const dbFirst = normalizeName(row.first_name || row.firstname || '');
      const dbLast = normalizeName(row.last_name || row.lastname || '');
      let dbFL = { first: dbFirst, last: dbLast };
      if (!dbFL.first || !dbFL.last) {
        const nameFromSingle = normalizeName(
          row.full_name || row.fullname || row.name || ''
        );
        const derived = parseFirstLast(nameFromSingle);
        if (derived.first && derived.last) dbFL = derived;
      }

      if (!inputFL.first || !inputFL.last) {
        Alert.alert('Invalid Name', 'Please enter your full name (First Last).');
        return;
      }

      if (!dbFL.first || !dbFL.last) {
        // Missing name fields in DB — treat as mismatch to stay strict
        Alert.alert('Name mismatch', 'Your name could not be verified for this account.');
        return;
      }

      if (inputFL.first !== dbFL.first || inputFL.last !== dbFL.last) {
        Alert.alert('Name mismatch', 'Full name does not match our records for this LRN.');
        return;
      }

      // Store in context (both raw student and derived data)
      const resolvedFullName = (
        row.full_name ||
        row.fullname ||
        row.name ||
        `${row.first_name || ''} ${row.middle_name ? row.middle_name + ' ' : ''}${row.last_name || ''}`
      )
        .replace(/\s+/g, ' ')
        .trim();

      setStudent(row);
      setStudentData({
        ...row,
        lrn: String(row.lrn ?? cleaned ?? dashed),
        fullName: resolvedFullName,
      });

      Alert.alert('✅ Login Success', `Welcome, ${resolvedFullName || fullName}!`);
      navigation.replace('MainDrawer');
    } catch (err) {
      console.warn('Login query error', err?.message || err);
      Alert.alert('Login Error', 'Unable to login right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#ffffffff', '#94f590ff']} style={styles.container}>
      <StatusBar backgroundColor="#1cac58ff" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo1.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>JCACI Portal</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="LRN (1234-5678-9012)"
                placeholderTextColor="#6c757d"
                value={lrnInput}
                onChangeText={handleLrnChange}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => nameInputRef.current.focus()}
                maxLength={14} // includes dashes
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#6c757d"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                ref={nameInputRef}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#000000ff',
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: width * 0.06,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: width * 0.035,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f1f3f6',
    padding: 12,
    borderRadius: 12,
    fontSize: width * 0.04,
    color: '#212529',
  },
  loginButton: {
    backgroundColor: '#1cac58ff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 20,
    alignSelf: 'center',
  },
  registerText: {
    color: '#6c757d',
    fontSize: width * 0.038,
  },
  registerHighlight: {
    color: '#1cac58ff',
    fontWeight: 'bold',
  },
});
