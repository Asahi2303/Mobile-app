import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './config/theme';
import { StudentProvider } from './context/StudentContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from './config/toastConfig';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import ForgotEmailScreen from './Screens/ForgotEmailScreen';
import SendResetCodeScreen from './Screens/SendResetCodeScreen';
import ResetPasswordScreen from './Screens/ResetPasswordScreen';
import HomeScreen from './Screens/HomeScreen';
import GradesScreen from './Screens/GradesScreen';
import DashboardScreen from './Screens/DashboardScreen';
import SubjectsSummaryScreen from './Screens/SubjectsSummaryScreen';
import ProfileScreen from './Screens/ProfileScreen';
import LoadingScreen from './Screens/LoadingScreen';

// Logo imports
import logoHeader from './assets/logo.jpg';
import logoDrawer from './assets/logo1.png';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Redesigned Header
const CustomHeader = ({ navigation, title = " " }) => (
  <LinearGradient
    colors={[colors.primaryDark, colors.primary]}
    style={styles.headerContainer}
  >
    <Image source={logoHeader} style={styles.headerLogo} />
    <Text style={styles.headerTitle}>{title}</Text>
    <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.headerButton}>
      <MaterialIcons name="menu" size={28} color="white" />
    </TouchableOpacity>
  </LinearGradient>
);

// Redesigned Drawer
const CustomDrawerContent = (props) => (
  <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, paddingTop: 10 }}>
    <LinearGradient
      colors={[colors.primaryDark, colors.primary]}
      style={styles.drawerHeader}
    >
      <View style={styles.logoContainer}>
        <Image source={logoDrawer} style={{ width: 60, height: 60 }} />
      </View>
      <Text style={styles.drawerHeaderTitle}>Student Portal</Text>
      <Text style={styles.drawerHeaderSubtitle}>Welcome back!</Text>
    </LinearGradient>

    <View style={styles.mainDrawerItems}>
      {props.state.routes.map((route, index) => {
        const focused = index === props.state.index;
        const label = route.name === 'ProfileScreen' ? 'Profile' : route.name;
        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.drawerItemButton, focused && styles.drawerItemActive]}
            onPress={() => props.navigation.navigate(route.name)}
          >
            <MaterialIcons
              name={
                route.name === 'Home' ? 'home' :
                route.name === 'Dashboard' ? 'dashboard' :
                route.name === 'Grades' ? 'grading' :
                route.name === 'Subjects Summary' ? 'menu-book' :
                route.name === 'ProfileScreen' ? 'person' :
                'menu'
              }
              size={22}
              color={focused ? '#fff' : '#333'}
              style={{ marginRight: 15 }}
            />
            <Text style={[styles.drawerItemText, focused && { color: '#fff' }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>

    <View style={styles.bottomSection}>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => props.navigation.navigate('Login')}
      >
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </DrawerContentScrollView>
);

// Main Drawer Navigator
const MainDrawer = () => (
  <Drawer.Navigator
    initialRouteName="Home"
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      header: ({ navigation }) => <CustomHeader navigation={navigation} />,
      // Ensure screen content is rendered BELOW our custom header so touches work
      sceneContainerStyle: {
        paddingTop: 70 + (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0),
      },
      drawerPosition: 'right',
      drawerStyle: { width: 300, backgroundColor: colors.surfaceAlt },
      drawerActiveTintColor: '#fff',
      drawerInactiveTintColor: '#333',
    }}
  >
    <Drawer.Screen name="Home" component={HomeScreen} />
    <Drawer.Screen name="Dashboard" component={DashboardScreen} />
    <Drawer.Screen name="Grades" component={GradesScreen} />
    <Drawer.Screen name="Subjects Summary" component={SubjectsSummaryScreen} />
    <Drawer.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Drawer.Navigator>
);

// App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <StudentProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="LoadingScreen"
            screenOptions={{ headerShown: false, animation: 'fade' }}
          >
            <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotEmailScreen" component={ForgotEmailScreen} />
            <Stack.Screen name="SendResetCodeScreen" component={SendResetCodeScreen} />
            <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
            <Stack.Screen name="MainDrawer" component={MainDrawer} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </StudentProvider>
    </SafeAreaProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  headerContainer: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headerLogo: { width: 50, height: 50, borderRadius: 30 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerButton: { padding: 5 },

  drawerHeader: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  drawerHeaderTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  drawerHeaderSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },

  mainDrawerItems: { flex: 1, paddingTop: 10 },
  drawerItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: 'transparent',
  },
  drawerItemActive: { backgroundColor: colors.primary },
  drawerItemText: { fontSize: 16, color: '#333', fontWeight: '500' },

  bottomSection: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 10,
    borderRadius: 25,
  },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
