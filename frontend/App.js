import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Components & Screens
import MobileFrame from './src/components/MobileFrame';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import HomeScreen from './src/screens/HomeScreen';
import RouteFinderScreen from './src/screens/RouteFinderScreen';
import SOSScreen from './src/screens/SOSScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  // App Config & Auth States
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000');
  
  // Settings States
  const [shakeAlertEnabled, setShakeAlertEnabled] = useState(true);
  const [emergencyNumber, setEmergencyNumber] = useState('100');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');

  // Emulator Simulator States (for side logging panel)
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [audioRecording, setAudioRecording] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [triggerType, setTriggerType] = useState('SOS_BUTTON');

  // Helper to log actions
  const logSimEvent = (text) => {
    const time = new Date().toLocaleTimeString();
    setSimulationLogs(prev => [{ time, text }, ...prev]);
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    logSimEvent(`User registered session login: ${userData.email}`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCurrentScreen('welcome');
    logSimEvent('User logged out. Session terminated.');
  };

  const triggerSOS = (type = 'SOS_BUTTON') => {
    setTriggerType(type);
    setAudioRecording(true);
    setCurrentScreen('sos');
    
    if (type === 'SHAKE') {
      logSimEvent('📳 SHAKE SENSOR ACTIVATED: Device shaken twice.');
      logSimEvent(`📞 Direct emergency call initiated to ${emergencyNumber}.`);
      logSimEvent('📍 Live Location Link dispatched to Police Command Center (Simulation).');
    } else {
      logSimEvent('🚨 SOS BUTTON PRESSED: Alert activated manually.');
    }
    logSimEvent('📨 Broadcasting Live Location SMS Alerts to trusted contacts.');
    logSimEvent('🎤 Ambient voice recorder enabled. Recording saved.');
    logSimEvent('🔦 High-intensity strobe alert beacon blinking.');
  };

  const deactivateSOS = () => {
    setAudioRecording(false);
    setFlashlightOn(false);
    setCurrentScreen('home');
    logSimEvent('🛡️ SOS DEACTIVATED: Secure standby mode reinstated.');
  };

  // Navigations routing dispatcher
  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={setCurrentScreen} />;
      case 'login':
        return <LoginScreen onNavigate={setCurrentScreen} onLogin={handleLogin} backendUrl={backendUrl} />;
      case 'register':
        return <RegistrationScreen onNavigate={setCurrentScreen} onRegister={handleLogin} backendUrl={backendUrl} />;
      case 'home':
        return (
          <HomeScreen
            user={user}
            onNavigate={setCurrentScreen}
            onTriggerSOS={() => triggerSOS('SOS_BUTTON')}
            shakeAlertEnabled={shakeAlertEnabled}
            setShakeAlertEnabled={setShakeAlertEnabled}
          />
        );
      case 'routes':
        return <RouteFinderScreen token={token} backendUrl={backendUrl} onNavigate={setCurrentScreen} googleMapsApiKey={googleMapsApiKey} />;
      case 'sos':
        return (
          <SOSScreen
            token={token}
            backendUrl={backendUrl}
            onDeactivate={deactivateSOS}
            triggerType={triggerType}
          />
        );
      case 'contacts':
        return <ContactsScreen token={token} backendUrl={backendUrl} />;
      case 'profile':
        return <ProfileScreen token={token} backendUrl={backendUrl} onLogout={handleLogout} />;
      case 'settings':
        return (
          <SettingsScreen
            backendUrl={backendUrl}
            setBackendUrl={setBackendUrl}
            shakeAlertEnabled={shakeAlertEnabled}
            setShakeAlertEnabled={setShakeAlertEnabled}
            emergencyNumber={emergencyNumber}
            setEmergencyNumber={setEmergencyNumber}
            googleMapsApiKey={googleMapsApiKey}
            setGoogleMapsApiKey={setGoogleMapsApiKey}
          />
        );
      default:
        return <WelcomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  // Double blink sync for Web frame indicator
  React.useEffect(() => {
    let timer;
    if (currentScreen === 'sos') {
      timer = setInterval(() => {
        setFlashlightOn(prev => !prev);
      }, 400);
    } else {
      setFlashlightOn(false);
    }
    return () => clearInterval(timer);
  }, [currentScreen]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <MobileFrame
        activeScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onTriggerShake={() => {
          if (shakeAlertEnabled && currentScreen !== 'sos') {
            triggerSOS('SHAKE');
          } else if (!shakeAlertEnabled) {
            logSimEvent('⚠️ Shake trigger simulation ignored. Shake Alert is disabled in settings.');
          }
        }}
        flashlightOn={flashlightOn}
        audioRecording={audioRecording}
        simulationLogs={simulationLogs}
      >
        {renderScreen()}
      </MobileFrame>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
