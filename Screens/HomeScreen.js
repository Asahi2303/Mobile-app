import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, BackHandler, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {

  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <LinearGradient
      colors={['#ffffffff', '#94f590ff']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Top-left text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.appName}>JCACI PORTAL</Text>
        <Text style={styles.subtitle}>Your gateway to academic success</Text>
      </View>

      {/* Centered logo */}
      <View style={styles.centerContent}>
        <Image
          source={require('../assets/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          “Learning by Heart for a Brighter Start.”
        </Text>
        {/*<Text style={styles.footerAuthor}>— Proverbs 22:6</Text>*/}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },

  textContainer: {
    position: 'absolute',
    top: 40, // closer to the top edge
    left: 20, // aligned near left edge
  },

  title: {
    fontSize: 22,
    color: '#4a4a4a',
    fontWeight: '400',
    textAlign: 'left',
  },

  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2020ff',
    marginTop: 5,
    textAlign: 'left',
  },

  subtitle: {
    fontSize: 16,
    color: '#5f5f5f',
    marginTop: 6,
    textAlign: 'left',
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: width * 0.45,
    height: width * 0.45,
  },

  footer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 30,
  },

  footerText: {
    fontSize: 14,
    color: '#4a4a4a',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  footerAuthor: {
    fontSize: 13,
    color: '#007d99',
    marginTop: 5,
  },
});
