import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SOSScreen({ token, backendUrl, onDeactivate, triggerType }) {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [smsBroadcasts, setSmsBroadcasts] = useState([]);
  const [policeAlerted, setPoliceAlerted] = useState(false);
  const [gpsCoords, setGpsCoords] = useState('28.6139, 77.2090'); // New Delhi coordinates default

  // 1. Simulate Flashlight blinking on screen
  useEffect(() => {
    const flashInterval = setInterval(() => {
      setFlashlightOn(prev => !prev);
    }, 400);
    return () => clearInterval(flashInterval);
  }, []);

  // 2. Alert dispatcher
  useEffect(() => {
    const triggerEmergency = async () => {
      try {
        // Fetch real GPS location mock coordinates
        const lat = (28.6139 + (Math.random() - 0.5) * 0.01).toFixed(6);
        const lng = (77.2090 + (Math.random() - 0.5) * 0.01).toFixed(6);
        const coords = `${lat}, ${lng}`;
        setGpsCoords(coords);

        const response = await fetch(`${backendUrl}/api/alerts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            gps_coordinates: coords,
            alert_status: 'Active',
            trigger_type: triggerType || 'SOS_BUTTON'
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setSmsBroadcasts(data.sms_broadcasts);
          setPoliceAlerted(data.police_alerted);

          // Upload a mock audio recording file link
          await uploadMockAudio();
        }
      } catch (err) {
        console.error('Trigger emergency error:', err);
      } finally {
        setLoading(false);
      }
    };

    const uploadMockAudio = async () => {
      try {
        // In web / React Native prototype, we hit the backend mock recordings upload
        const formData = new FormData();
        // Since we are mocking, we append a tiny blob or mock file
        const mockFile = {
          uri: 'mock_audio.m4a',
          name: 'audio.m4a',
          type: 'audio/m4a'
        };
        formData.append('audio', mockFile);

        await fetch(`${backendUrl}/api/recordings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } catch (err) {
        console.warn('Mock audio upload failed (expected in browser context without file input):', err.message);
      }
    };

    triggerEmergency();
  }, []);

  // 3. Increment elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <View style={[styles.container, flashlightOn ? styles.flashBg : styles.darkBg]}>
      {/* Alert Header */}
      <View style={styles.header}>
        <Ionicons name="warning" size={48} color="#EF4444" style={styles.warningIcon} />
        <Text style={styles.alertTitle}>EMERGENCY MODE ACTIVE</Text>
        <Text style={styles.alertSubtitle}>
          Triggered via {triggerType === 'SHAKE' ? 'Shake Sensor' : 'One-Tap SOS Button'}
        </Text>
      </View>

      {/* Timer & GPS Display */}
      <View style={styles.statBox}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Elapsed Time</Text>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>GPS Location</Text>
          <Text style={styles.statValue}>{gpsCoords}</Text>
        </View>
      </View>

      {/* Dispatch Status */}
      <View style={styles.logsCard}>
        <Text style={styles.logsHeader}>Emergency Dispatch Status</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.loadingText}>Initializing emergency broadcast...</Text>
          </View>
        ) : (
          <View style={styles.logsList}>
            {/* Contacts Sent Indicator */}
            <View style={styles.logItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.logText}>
                Trusted Contacts broadcast SMS successfully sent to {smsBroadcasts.length} recipients.
              </Text>
            </View>

            {/* Audio Recording Status */}
            <View style={styles.logItem}>
              <Ionicons name="mic" size={16} color="#EF4444" />
              <Text style={styles.logText}>
                Continuous ambient audio recording started. Uploading transcripts to cloud.
              </Text>
            </View>

            {/* Flashlight Indicator */}
            <View style={styles.logItem}>
              <Ionicons name="flashlight" size={16} color="#EAB308" />
              <Text style={styles.logText}>Flashlight blinking alert active (Beacon mode).</Text>
            </View>

            {/* Police Alert Indicator */}
            <View style={styles.logItem}>
              <Ionicons 
                name={policeAlerted ? 'shield-checkmark' : 'call'} 
                size={16} 
                color={policeAlerted ? '#38BDF8' : '#6B7280'} 
              />
              <Text style={styles.logText}>
                {policeAlerted 
                  ? 'Police Command Center notified. Patrol unit dispatch simulated.' 
                  : 'Dialing Emergency Number 100/112 automatically.'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Dial Call Simulation */}
      <View style={styles.dialerRow}>
        <Ionicons name="call" size={20} color="#22C55E" />
        <Text style={styles.dialerText}>Simulated Emergency Call active (100 / 112)</Text>
      </View>

      {/* Double Tap to Cancel (prevents accidental tap deactivate) */}
      <TouchableOpacity style={styles.cancelBtn} onLongPress={onDeactivate} delayLongPress={1500}>
        <Ionicons name="close-circle" size={24} color="#FFF" style={styles.cancelIcon} />
        <Text style={styles.cancelBtnText}>Press & Hold (1.5s) to Deactivate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  darkBg: {
    backgroundColor: '#111827',
  },
  flashBg: {
    // Blinks between dark red and black to simulate flash alert
    backgroundColor: '#3F0505',
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
  },
  warningIcon: {
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444',
    letterSpacing: 1,
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#374151',
  },
  logsCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#374151',
    flex: 0.8,
  },
  logsHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 10,
  },
  logsList: {
    flex: 1,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logText: {
    color: '#D1D5DB',
    fontSize: 11,
    marginLeft: 8,
    lineHeight: 15,
    flex: 1,
  },
  dialerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  dialerText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderWidth: 1.5,
    borderColor: '#4B5563',
    borderRadius: 12,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelIcon: {
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
