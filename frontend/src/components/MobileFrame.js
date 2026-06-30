import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MobileFrame({ children, activeScreen, onNavigate, onTriggerShake, flashlightOn, audioRecording, simulationLogs }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (Platform.OS !== 'web') {
    return <View style={styles.mobileContainer}>{children}</View>;
  }

  return (
    <View style={styles.webContainer}>
      {/* Simulation Control Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>🛡️ SafeHer AI</Text>
          <Text style={styles.sidebarSubtitle}>Hackathon Prototype Simulator</Text>
        </View>

        <View style={styles.sidebarSection}>
          <Text style={styles.sectionHeader}>Hardware Control Simulators</Text>
          
          <TouchableOpacity style={styles.simButton} onPress={onTriggerShake}>
            <Text style={styles.simButtonText}>📳 Shake Device Twice</Text>
          </TouchableOpacity>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Flashlight Alert:</Text>
            <View style={[styles.statusIndicator, flashlightOn ? styles.indicatorOn : styles.indicatorOff]} />
            <Text style={styles.statusVal}>{flashlightOn ? 'BLINKING' : 'Off'}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Audio Recorder:</Text>
            <View style={[styles.statusIndicator, audioRecording ? styles.indicatorActive : styles.indicatorOff]} />
            <Text style={styles.statusVal}>{audioRecording ? 'RECORDING' : 'Idle'}</Text>
          </View>
        </View>

        <View style={[styles.sidebarSection, { flex: 1 }]}>
          <Text style={styles.sectionHeader}>Emergency Simulation Logs</Text>
          <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 8 }}>
            {simulationLogs.length === 0 ? (
              <Text style={styles.emptyLogText}>No events logged. Trigger SOS or Shake to test.</Text>
            ) : (
              simulationLogs.map((log, index) => (
                <View key={index} style={styles.logEntry}>
                  <Text style={styles.logTime}>{log.time}</Text>
                  <Text style={styles.logText}>{log.text}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
        
        <View style={styles.sidebarFooter}>
          <Text style={styles.footerText}>Powered by Gemini 1.5 Flash</Text>
        </View>
      </View>

      {/* Main Smartphone Frame */}
      <View style={styles.phoneWrapper}>
        <View style={styles.phoneOuterBorder}>
          <View style={styles.phoneSpeaker} />
          <View style={styles.phoneCamera} />
          
          <View style={styles.phoneScreen}>
            {/* Status Bar */}
            <View style={styles.statusBar}>
              <Text style={styles.statusBarTime}>{currentTime}</Text>
              <View style={styles.statusBarIcons}>
                <Ionicons name="wifi" size={14} color="#FFF" style={styles.statusIcon} />
                <Ionicons name="cellular" size={14} color="#FFF" style={styles.statusIcon} />
                <Text style={styles.statusBarBattery}>98%</Text>
                <Ionicons name="battery-full" size={16} color="#FFF" style={styles.statusIcon} />
              </View>
            </View>

            {/* App Content */}
            <View style={styles.screenContent}>
              {children}
            </View>

            {/* Bottom Navigation (Only if authenticated/on main screens) */}
            {activeScreen !== 'welcome' && activeScreen !== 'login' && activeScreen !== 'register' && activeScreen !== 'sos' && (
              <View style={styles.navBar}>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('home')}>
                  <Ionicons name={activeScreen === 'home' ? 'home' : 'home-outline'} size={20} color={activeScreen === 'home' ? '#2563EB' : '#9CA3AF'} />
                  <Text style={[styles.navText, activeScreen === 'home' && styles.navTextActive]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('routes')}>
                  <Ionicons name={activeScreen === 'routes' ? 'map' : 'map-outline'} size={20} color={activeScreen === 'routes' ? '#2563EB' : '#9CA3AF'} />
                  <Text style={[styles.navText, activeScreen === 'routes' && styles.navTextActive]}>Routes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('contacts')}>
                  <Ionicons name={activeScreen === 'contacts' ? 'people' : 'people-outline'} size={20} color={activeScreen === 'contacts' ? '#2563EB' : '#9CA3AF'} />
                  <Text style={[styles.navText, activeScreen === 'contacts' && styles.navTextActive]}>Contacts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('settings')}>
                  <Ionicons name={activeScreen === 'settings' ? 'settings' : 'settings-outline'} size={20} color={activeScreen === 'settings' ? '#2563EB' : '#9CA3AF'} />
                  <Text style={[styles.navText, activeScreen === 'settings' && styles.navTextActive]}>Settings</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.phoneHomeButton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  webContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebar: {
    width: 320,
    height: '90%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginRight: 40,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  sidebarSection: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  simButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  simButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: '#94A3B8',
    width: 100,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  indicatorOff: {
    backgroundColor: '#64748B',
  },
  indicatorOn: {
    backgroundColor: '#EAB308',
    shadowColor: '#EAB308',
    shadowRadius: 5,
    elevation: 3,
  },
  indicatorActive: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowRadius: 5,
    elevation: 3,
  },
  statusVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  logBox: {
    height: 160,
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyLogText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logEntry: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingVertical: 6,
  },
  logTime: {
    fontSize: 9,
    color: '#38BDF8',
  },
  logText: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 2,
  },
  sidebarFooter: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 10,
    color: '#64748B',
  },
  phoneWrapper: {
    width: 375,
    height: 750,
    position: 'relative',
  },
  phoneOuterBorder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 45,
    padding: 12,
    borderWidth: 4,
    borderColor: '#334155',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  phoneSpeaker: {
    width: 60,
    height: 5,
    backgroundColor: '#334155',
    borderRadius: 3,
    position: 'absolute',
    top: 22,
    left: '50%',
    marginLeft: -30,
    zIndex: 100,
  },
  phoneCamera: {
    width: 10,
    height: 10,
    backgroundColor: '#1E293B',
    borderRadius: 5,
    position: 'absolute',
    top: 20,
    left: '50%',
    marginLeft: 40,
    zIndex: 100,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 36,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  statusBar: {
    height: 44,
    backgroundColor: '#121212',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 50,
  },
  statusBarTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 6,
  },
  statusBarBattery: {
    fontSize: 10,
    color: '#FFF',
    marginLeft: 4,
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#121212',
  },
  navBar: {
    height: 60,
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  navTextActive: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  phoneHomeButton: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -20,
  }
});
