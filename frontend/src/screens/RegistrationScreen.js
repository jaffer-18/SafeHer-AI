import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RegistrationScreen({ onNavigate, onRegister, backendUrl }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      onRegister(data.user, data.token);
      onNavigate('home');
    } catch (err) {
      setError(err.message || 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('welcome')}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to access AI routing and SOS alerts</Text>
      </View>

      <View style={styles.form}>
        {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#6B7280"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#6B7280"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>Register</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => onNavigate('login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
  },
  registerButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  loginLink: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
