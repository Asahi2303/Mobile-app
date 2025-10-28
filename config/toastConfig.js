import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Custom Toast Configuration
export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <Ionicons name="checkmark-circle" size={24} color="#fff" />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastTitle}>{text1 || ''}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <Ionicons name="alert-circle" size={24} color="#fff" />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastTitle}>{text1 || ''}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <Ionicons name="information-circle" size={24} color="#fff" />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastTitle}>{text1 || ''}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: isSmallDevice ? 30 : 50,
  },
  toastTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  toastMessage: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  successToast: {
    backgroundColor: '#00C851',
  },
  errorToast: {
    backgroundColor: '#ff4444',
  },
  infoToast: {
    backgroundColor: '#33b5e5',
  },
});
export default toastConfig;