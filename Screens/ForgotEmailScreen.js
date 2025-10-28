import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

export default function ForgotEmailScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.title}>Forgot Email</Text>
        <Text style={styles.sub}>This is a placeholder Forgot Email screen.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6faf7', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 14, color: '#334155', marginTop: 6 },
});
