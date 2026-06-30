import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({
  backendUrl,
  setBackendUrl,
  shakeAlertEnabled,
  setShakeAlertEnabled,
  emergencyNumber,
  setEmergencyNumber,
  googleMapsApiKey,
  setGoogleMapsApiKey
}) {
  const [tempUrl, setTempUrl] = useState(backendUrl);
  const [sensitivity, setSensitivity] = useState('Medium'); // Low, Medium, High

  const handleSaveUrl = () => {
    if (tempUrl.trim() === '') return;
    setBackendUrl(tempUrl.trim());
    alert('API Endpoint updated successfully!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize emergency parameters and API endpoints</Text>
      </View>

      <ScrollView style={styles.scrollList}>
        {/* Hardware & Gesture Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Emergency Gestures</Text>
          
          <View style={styles.row}>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>Shake-to-Alert Sensor</Text>
              <Text style={styles.rowDesc}>Trigger SOS mode by shaking the device twice.</Text>
            </View>
            <Switch
              value={shakeAlertEnabled}
              onValueChange={setShakeAlertEnabled}
              trackColor={{ false: '#374151', true: '#7C3AED' }}
              thumbColor={shakeAlertEnabled ? '#FFF' : '#9CA3AF'}
            />
          </View>

          {shakeAlertEnabled && (
            <View style={styles.subSection}>
              <Text style={styles.subLabel}>Shake Sensitivity Level</Text>
              <View style={styles.sensitivityRow}>
                {['Low', 'Medium', 'High'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.levelBtn, sensitivity === level && styles.levelBtnActive]}
                    onPress={() => setSensitivity(level)}
                  >
                    <Text style={[styles.levelText, sensitivity === level && styles.levelTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Emergency Services Dial configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Emergency Dial Services</Text>
          
          <View style={styles.row}>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>Emergency Speeddial Number</Text>
              <Text style={styles.rowDesc}>Direct line dialed automatically during Shake-SOS.</Text>
            </View>
          </View>
          
          <View style={styles.dialNumbersRow}>
            {['100', '112', '911'].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.dialNumBtn, emergencyNumber === num && styles.dialNumBtnActive]}
                onPress={() => setEmergencyNumber(num)}
              >
                <Ionicons name="call" size={12} color={emergencyNumber === num ? '#FFF' : '#9CA3AF'} />
                <Text style={[styles.dialNumText, emergencyNumber === num && styles.dialNumTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Google Maps Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Google Maps Integration</Text>
          <View style={styles.apiBox}>
            <Text style={styles.apiLabel}>Google Maps API Key (Optional):</Text>
            <View style={styles.apiInputRow}>
              <TextInput
                style={styles.apiInput}
                value={googleMapsApiKey}
                onChangeText={setGoogleMapsApiKey}
                placeholder="AIzaSy... (leave blank for development watermark)"
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.apiHint}>
              Note: Entering an active Google Maps API Key will load official maps. If blank, standard Google Maps renders in watermarked sandbox mode.
            </Text>
          </View>
        </View>

        {/* Developer API Connection configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Developer Backend Configuration</Text>
          <View style={styles.apiBox}>
            <Text style={styles.apiLabel}>Backend Base URL (HTTP):</Text>
            <View style={styles.apiInputRow}>
              <TextInput
                style={styles.apiInput}
                value={tempUrl}
                onChangeText={setTempUrl}
                placeholder="http://localhost:5000"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.apiSaveBtn} onPress={handleSaveUrl}>
                <Text style={styles.apiSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.apiHint}>
              Note: For local development on physical Android/iOS devices, replace "localhost" with your computer's local IP address.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  scrollList: {
    flex: 1,
  },
  section: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowMeta: {
    flex: 0.85,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  rowDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 14,
  },
  subSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  sensitivityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelBtn: {
    backgroundColor: '#111827',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  levelBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  levelText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  levelTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  dialNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dialNumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    flex: 1,
    marginHorizontal: 3,
  },
  dialNumBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dialNumText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
    fontWeight: '600',
  },
  dialNumTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  apiBox: {
    marginTop: 4,
  },
  apiLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  apiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiInput: {
    flex: 1,
    backgroundColor: '#111827',
    color: '#FFF',
    fontSize: 13,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    marginRight: 8,
  },
  apiSaveBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiSaveText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  apiHint: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 8,
    lineHeight: 12,
    fontStyle: 'italic',
  },
});
