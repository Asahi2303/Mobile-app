import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config/config';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Custom Toast Configuration
const toastConfig = {
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

const showToast = (type, title, message) => {
  Toast.show({
    type,
    text1: title || '',
    text2: message || '',
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: StatusBar.currentHeight ? Number(StatusBar.currentHeight) + 10 : 50,
  });
};

const SendResetCodeScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const emailRef = useRef();

  const isValidGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

  useEffect(() => {
    if (resendDisabled) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendDisabled]);

  const shakeAnimation = () => {
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(fadeAnim, {
        toValue: 0,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSendResetCode = async () => {
    Keyboard.dismiss();
    
    if (!email.trim()) {
      setError('Please enter your Gmail');
      showToast('error', 'Invalid Input', 'Please enter your Gmail address');
      shakeAnimation();
      return;
    }
    
    if (!isValidGmail(email)) {
      setError('Only valid Gmail addresses are allowed');
      showToast('error', 'Invalid Email', 'Only valid Gmail addresses are allowed');
      shakeAnimation();
      return;
    }

    setIsLoading(true);
    setError('');
    showToast('info', 'Processing', 'Sending reset code to your email...');

    try {
      const res = await fetch(`${API_URL}/send_reset_code.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (data.status === 'success') {
        showToast('success', 'Success', data.message || 'Reset code sent successfully');
        setTimeout(() => {
          navigation.navigate('ResetPasswordScreen', { email });
        }, 1000);
        setResendDisabled(true);
        setCountdown(30);
      } else {
        setError(data.message || 'Failed to send reset code');
        showToast('error', 'Failed to Send', data.message || 'Failed to send reset code');
        shakeAnimation();
      }
    } catch (err) {
      setError('Network error. Please try again.');
      showToast('error', 'Connection Error', 'Network error. Please check your connection and try again.');
      shakeAnimation();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#f8f9fa', '#e9ecef', '#dee2e6']} style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.select({
            ios: isSmallDevice ? 40 : 60,
            android: 0
          })}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.content}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter your Gmail to receive a password reset code
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Gmail Address</Text>
                  <Animated.View style={{ transform: [{ translateX: fadeAnim }] }}>
                    <TextInput
                      ref={emailRef}
                      style={styles.input}
                      placeholder="example@gmail.com"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="send"
                      onSubmitEditing={handleSendResetCode}
                      blurOnSubmit={false}
                    />
                  </Animated.View>
                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : (
                    <Text style={styles.hintText}>Only Gmail accounts are supported</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    (!email || !isValidGmail(email) || isLoading) && styles.buttonDisabled
                  ]}
                  onPress={handleSendResetCode}
                  disabled={!email || !isValidGmail(email) || isLoading}
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.buttonText}>Sending...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>
                      {resendDisabled ? `Resend Code (${countdown}s)` : 'Send Reset Code'}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.backButtonContainer}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={width > 400 ? 24 : 20} color="#1cac58ff" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
        <Toast config={toastConfig} />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: width > 400 ? 40 : 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: width > 400 ? 32 : 28,
    fontWeight: 'bold',
    color: '#1cac58ff',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: height > 800 ? 50 : 30,
  },
  subtitle: {
    fontSize: width > 400 ? 18 : 16,
    color: '#666',
    marginBottom: height > 800 ? 30 : 20,
    textAlign: 'center',
    paddingHorizontal: width > 400 ? 30 : 20,
    lineHeight: width > 400 ? 24 : 22,
  },
  inputContainer: {
    marginBottom: height > 800 ? 25 : 20,
  },
  inputLabel: {
    fontSize: width > 400 ? 18 : 16,
    color: '#1cac58ff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: Platform.select({
      ios: 15,
      android: 12
    }),
    fontSize: width > 400 ? 18 : 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: Platform.select({
      ios: 50,
      android: 50
    }),
  },
  hintText: {
    fontSize: width > 400 ? 14 : 12,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: width > 400 ? 14 : 12,
    color: '#ff4444',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#1cac58ff',
    padding: Platform.select({
      ios: 16,
      android: 14
    }),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1cac58ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    minHeight: Platform.select({
      ios: 50,
      android: 48
    }),
    marginTop: height > 800 ? 10 : 5,
  },
  buttonDisabled: {
    backgroundColor: '#a0d1afff',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: width > 400 ? 18 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  backButtonText: {
    color: '#1cac58ff',
    fontSize: width > 400 ? 18 : 16,
    marginLeft: 5,
    fontWeight: '500',
  },
  // Toast Styles
  toastContainer: {
    width: '90%',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  infoToast: {
    backgroundColor: '#1cac58ff',
  },
  toastTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  toastTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
});

export default SendResetCodeScreen;