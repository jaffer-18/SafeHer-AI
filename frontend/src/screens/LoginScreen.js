import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ onNavigate, onLogin, backendUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLogin(data.user, data.token);
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to stay connected and safe</Text>
      </View>

      <View style={styles.form}>
        {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

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

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => onNavigate('register')}>
            <Text style={styles.registerLink}>Register</Text>
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
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
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
    marginBottom: 16,
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
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  registerLink: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
