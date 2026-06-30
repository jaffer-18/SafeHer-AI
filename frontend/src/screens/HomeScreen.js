import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ user, onNavigate, onTriggerSOS, shakeAlertEnabled, setShakeAlertEnabled }) {
  // Pulse animation for the SOS button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web' // Only use native driver where supported
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web'
        })
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const firstName = user ? user.full_name.split(' ')[0] : 'User';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {firstName} 👋</Text>
          <Text style={styles.subtitleText}>Stay safe on your journey today</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => onNavigate('profile')}>
          <Ionicons name="person-circle" size={36} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Safety Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>System Security</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.statusMetrics}>
          <View style={styles.metricItem}>
            <Ionicons name="location" size={20} color="#14B8A6" />
            <Text style={styles.metricLabel}>GPS Status</Text>
            <Text style={styles.metricVal}>HIGH ACCURACY</Text>
          </View>

          <View style={[styles.metricDivider, { height: '100%' }]} />

          <View style={styles.metricItem}>
            <Ionicons name="shield" size={20} color="#7C3AED" />
            <Text style={styles.metricLabel}>Shake Alert</Text>
            <TouchableOpacity onPress={() => setShakeAlertEnabled(!shakeAlertEnabled)}>
              <Text style={[styles.metricVal, shakeAlertEnabled ? styles.valActive : styles.valInactive]}>
                {shakeAlertEnabled ? 'ENABLED' : 'DISABLED'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* SOS Button Container */}
      <View style={styles.sosContainer}>
        <Animated.View style={[styles.sosOuterRing, { transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={[styles.sosInnerRing, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity style={styles.sosButton} onPress={onTriggerSOS}>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>One-Tap Alert</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        <Text style={styles.sosHint}>Tap to trigger emergency mode instantly</Text>
      </View>

      {/* Quick Navigation Panels */}
      <View style={styles.navigationGrid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('routes')}>
          <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
            <Ionicons name="map" size={24} color="#2563EB" />
          </View>
          <Text style={styles.gridTitle}>AI Route Finder</Text>
          <Text style={styles.gridDesc}>Find the safest route</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate('contacts')}>
          <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
            <Ionicons name="people" size={24} color="#7C3AED" />
          </View>
          <Text style={styles.gridTitle}>Trusted Contacts</Text>
          <Text style={styles.gridDesc}>Manage alert recipients</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitleText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  profileBtn: {
    padding: 4,
  },
  statusCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E5E7EB',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  statusMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#374151',
    height: 30,
  },
  valActive: {
    color: '#10B981',
  },
  valInactive: {
    color: '#EF4444',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  sosOuterRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInnerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  sosText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sosSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  sosHint: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 16,
    fontStyle: 'italic',
  },
  navigationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridItem: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#374151',
  },
  gridIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  gridDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
