import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#14B8A6" />
        </View>
        <Text style={styles.title}>SafeHer AI</Text>
        <Text style={styles.subtitle}>AI-Powered Safety Navigation</Text>
      </View>

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <Ionicons name="git-compare" size={24} color="#7C3AED" style={styles.featureIcon} />
          <View>
            <Text style={styles.featureTitle}>Safe Route Finder</Text>
            <Text style={styles.featureText}>Intelligently recommends the safest route based on lighting, police stations, and activity.</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <Ionicons name="warning" size={24} color="#EF4444" style={styles.featureIcon} />
          <View>
            <Text style={styles.featureTitle}>Smart SOS Trigger</Text>
            <Text style={styles.featureText}>Tap the SOS button to instantly notify your trusted contacts with your live location.</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <Ionicons name="radio" size={24} color="#10B981" style={styles.featureIcon} />
          <View>
            <Text style={styles.featureTitle}>Shake-to-Alert</Text>
            <Text style={styles.featureText}>Shake your phone twice to automatically start emergency recording and alert contacts.</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => onNavigate('register')}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => onNavigate('login')}>
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  features: {
    marginVertical: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  featureIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  featureText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 18,
    paddingRight: 32,
  },
  buttons: {
    marginBottom: 20,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4B5563',
  },
  secondaryButtonText: {
    color: '#E5E7EB',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
