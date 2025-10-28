import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
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
import Toast from 'react-native-toast-message';
import { API_URL } from '../config/config';

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false); // Add this state
  
  const inputRefs = useRef([]);
  const newPasswordRef = useRef();
  const confirmPasswordRef = useRef();
  
  const passwordStrength = newPassword.length > 0 ? 
    Math.min(newPassword.length / 10 * 100, 100) : 0;
  
  const strengthColor = passwordStrength < 30 ? '#ff4444' : 
    passwordStrength < 70 ? '#ffbb33' : '#00C851';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  const handleCodeChange = (value, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      shakeAnimation();
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the complete 6-digit verification code'
      });
      return;
    }

    setVerificationLoading(true);

    try {
      const res = await fetch(`${API_URL}/verify_reset_code.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setIsCodeVerified(true);
        // Animate to show password fields
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        shakeAnimation();
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Invalid verification code'
        });
        // Clear the code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      shakeAnimation();
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error. Please try again.'
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResetPassword = async () => {
  // Prevent multiple submissions if already successful
  if (passwordResetSuccess) {
    return;
  }

  if (newPassword.length < 6) {
    shakeAnimation();
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Password must be at least 6 characters'
    });
    return;
  }
  if (newPassword !== confirmPassword) {
    shakeAnimation();
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Passwords do not match'
    });
    return;
  }

  setIsLoading(true);

  try {
    const res = await fetch(`${API_URL}/reset_password.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        code: code.join(''), 
        new_password: newPassword 
      }),
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      // Set password reset success flag to prevent any further actions
      setPasswordResetSuccess(true);
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Your password has been reset successfully.'
      });

      // Navigate to Login immediately and clear navigation stack
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 1500);
      
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: data.message || 'Could not reset password'
      });
    }
  } catch (err) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Network error. Please try again.'
    });
  } finally {
    setIsLoading(false);
  }
};

  const handleResendCode = async () => {
    // Prevent resending if password reset was successful
    if (passwordResetSuccess) {
      return;
    }

    setResendLoading(true);
    try {
      const res = await fetch(`${API_URL}/send_reset_code.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Verification code resent successfully'
        });
        setResendDisabled(true);
        setCountdown(30);
        // Clear code and reset verification state
        setCode(['', '', '', '', '', '']);
        setIsCodeVerified(false);
        slideAnim.setValue(0);
        inputRefs.current[0]?.focus();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to resend code'
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error. Please try again.'
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackButton = () => {
    if (passwordResetSuccess) {
      // If password was successfully reset, go directly to Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }
    
    if (isCodeVerified) {
      // If code is verified but password not reset yet, go back to verification
      setIsCodeVerified(false);
      slideAnim.setValue(0);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      // Go back to previous screen (Login or ForgotPassword)
      navigation.goBack();
    }
  };

  const shakeAnimation = () => {
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isCodeComplete = code.every(digit => digit !== '');
  const isPasswordFormValid = newPassword.length >= 6 && 
                              newPassword === confirmPassword && 
                              confirmPassword.length > 0;

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
                {passwordResetSuccess ? (
                  // Success State - Show success message
                  <View style={styles.successContainer}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="checkmark-circle" size={80} color="#00C851" />
                    </View>
                    <Text style={styles.title}>Password Reset Successfully!</Text>
                    <Text style={styles.subtitle}>
                      Your password has been changed successfully.{'\n'}
                      You can now login with your new password.
                    </Text>
                    <TouchableOpacity
                      style={styles.successButton}
                      onPress={() => navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.successButtonText}>Go to Login</Text>
                    </TouchableOpacity>
                  </View>
                ) : !isCodeVerified ? (
                  // Verification Code Step
                  <>
                    <View style={styles.iconContainer}>
                      <Ionicons name="mail" size={60} color="#4f81bc" />
                    </View>
                    
                    <Text style={styles.title}>Verify Your Code</Text>
                    <Text style={styles.subtitle}>
                      Enter the 6-digit code sent to {'\n'}
                      <Text style={styles.emailText}>{email}</Text>
                    </Text>

                    <Animated.View 
                      style={[
                        styles.codeContainer,
                        { transform: [{ translateX: fadeAnim }] }
                      ]}
                    >
                      {code.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={ref => inputRefs.current[index] = ref}
                          style={[
                            styles.codeInput,
                            digit ? styles.codeInputFilled : styles.codeInputEmpty
                          ]}
                          value={digit}
                          onChangeText={(value) => handleCodeChange(value, index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          keyboardType="numeric"
                          maxLength={1}
                          textAlign="center"
                          selectTextOnFocus
                          blurOnSubmit={false}
                          onFocus={() => {
                            if (digit) {
                              const newCode = [...code];
                              newCode[index] = '';
                              setCode(newCode);
                            }
                          }}
                        />
                      ))}
                    </Animated.View>

                    <TouchableOpacity
                      style={[
                        styles.verifyButton,
                        (!isCodeComplete || verificationLoading) && styles.verifyButtonDisabled
                      ]}
                      onPress={handleVerifyCode}
                      disabled={!isCodeComplete || verificationLoading}
                      activeOpacity={0.7}
                    >
                      {verificationLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.verifyButtonText}>Verify Code</Text>
                      )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                      <Text style={styles.resendText}>Didn't receive the code? </Text>
                      <TouchableOpacity 
                        onPress={handleResendCode} 
                        disabled={resendDisabled || resendLoading || passwordResetSuccess}
                      >
                        <Text style={[
                          styles.resendLink,
                          (resendDisabled || resendLoading || passwordResetSuccess) && styles.resendDisabled
                        ]}>
                          {resendLoading ? 'Sending...' : 
                           resendDisabled ? `Resend in ${countdown}s` : 'Resend'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  // Password Reset Step
                  <Animated.View 
                    style={[
                      styles.passwordSection,
                      {
                        opacity: slideAnim,
                        transform: [{
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark-circle" size={60} color="#00C851" />
                    </View>
                    
                    <Text style={styles.title}>Create New Password</Text>
                    <Text style={styles.subtitle}>
                      Your code has been verified!{'\n'}
                      Now set your new password.
                    </Text>

                    <Animated.View style={{ transform: [{ translateX: fadeAnim }] }}>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>New Password</Text>
                        <View style={styles.passwordInputContainer}>
                          <TextInput
                            ref={newPasswordRef}
                            style={[styles.input, styles.passwordInput]}
                            placeholder="Enter new password"
                            placeholderTextColor="#999"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showPassword}
                            returnKeyType="next"
                            onSubmitEditing={() => confirmPasswordRef.current.focus()}
                            blurOnSubmit={false}
                          />
                          <TouchableOpacity 
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                          >
                            <Ionicons 
                              name={showPassword ? 'eye-off' : 'eye'} 
                              size={20} 
                              color="#666" 
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.strengthContainer}>
                          <View style={styles.strengthMeter}>
                            <View 
                              style={[
                                styles.strengthBar, 
                                { 
                                  width: `${passwordStrength}%`,
                                  backgroundColor: strengthColor,
                                }
                              ]}
                            />
                          </View>
                          <Text style={[styles.hintText, { color: strengthColor, marginTop: 4 }]}>
                            {newPassword.length < 6 ? 'Minimum 6 characters' : 
                              passwordStrength < 30 ? 'Weak' :
                              passwordStrength < 70 ? 'Moderate' : 'Strong'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View style={styles.passwordInputContainer}>
                          <TextInput
                            ref={confirmPasswordRef}
                            style={[styles.input, styles.passwordInput]}
                            placeholder="Confirm new password"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            returnKeyType="done"
                            onSubmitEditing={handleResetPassword}
                          />
                          <TouchableOpacity 
                            style={styles.eyeIcon}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <Ionicons 
                              name={showConfirmPassword ? 'eye-off' : 'eye'} 
                              size={20} 
                              color="#666" 
                            />
                          </TouchableOpacity>
                        </View>
                        {confirmPassword.length > 0 && (
                          <View style={styles.matchContainer}>
                            <Ionicons 
                              name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'} 
                              size={16} 
                              color={newPassword === confirmPassword ? '#00C851' : '#ff4444'} 
                            />
                            <Text style={[
                              styles.matchText,
                              { color: newPassword === confirmPassword ? '#00C851' : '#ff4444' }
                            ]}>
                              {newPassword === confirmPassword ? 'Passwords match' : 'Passwords don\'t match'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Animated.View>

                    <TouchableOpacity
                      style={[
                        styles.resetButton,
                        (!isPasswordFormValid || isLoading) && styles.resetButtonDisabled
                      ]}
                      onPress={handleResetPassword}
                      disabled={!isPasswordFormValid || isLoading}
                      activeOpacity={0.7}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.resetButtonText}>Reset Password</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {!passwordResetSuccess && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={width > 400 ? 24 : 20} color="#4f81bc" />
                    <Text style={styles.backButtonText}>
                      {!isCodeVerified ? 'Back to Login' : 'Back to Verification'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <Toast config={toastConfig} />
    </SafeAreaView>
  );
}

// Custom Toast Configuration
const toastConfig = {
  success: ({ text1, text2, props }) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <Ionicons name="checkmark-circle" size={24} color="#fff" />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastTitle}>{text1 || ''}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2, props }) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <Ionicons name="alert-circle" size={24} color="#fff" />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastTitle}>{text1 || ''}</Text>
        {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2, props }) => (
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: '#4f81bc',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  codeInput: {
    width: 45,
    height: 50,
    borderRadius: 10,
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 2,
  },
  codeInputFilled: {
    borderColor: '#4f81bc',
    backgroundColor: '#fff',
    color: '#333',
  },
  codeInputEmpty: {
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  verifyButton: {
    backgroundColor: '#4f81bc',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: '#a0b3d6',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    color: '#666',
  },
  resendLink: {
    color: '#4f81bc',
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#999',
  },
  passwordSection: {
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthMeter: {
    height: 5,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 5,
  },
  hintText: {
    fontSize: 12,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    marginLeft: 5,
    fontSize: 12,
  },
  resetButton: {
    backgroundColor: '#1cac58ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonDisabled: {
    backgroundColor: '#1cac58ff',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#1cac58ff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  successButton: {
    backgroundColor: '#00C851',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    minWidth: 200,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    backgroundColor: '#1cac58ff',
  },
});