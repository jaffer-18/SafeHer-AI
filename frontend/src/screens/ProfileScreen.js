import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ token, backendUrl, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndHistory = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch(`${backendUrl}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (profileRes.ok) {
          setProfile(profileData);
        }

        // Fetch route history
        const historyRes = await fetch(`${backendUrl}/api/routes/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        if (historyRes.ok) {
          setHistory(historyData);
        }
      } catch (err) {
        console.error('Fetch profile details failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndHistory();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 85) return '#22C55E';
    if (score >= 70) return '#EAB308';
    return '#EF4444';
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {profile ? profile.full_name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{profile ? profile.full_name : 'User'}</Text>
        <Text style={styles.userEmail}>{profile ? profile.email : 'email@address.com'}</Text>
        <Text style={styles.userPhone}>📞 {profile ? profile.phone : 'Phone Number'}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{history.length}</Text>
          <Text style={styles.statLabel}>Routes Traveled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#22C55E' }]}>100%</Text>
          <Text style={styles.statLabel}>Safety Score Avg</Text>
        </View>
      </View>

      {/* Route History List */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyHeader}>Recent Routes History</Text>
        
        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="map-outline" size={32} color="#4B5563" />
            <Text style={styles.emptyHistoryText}>No safe route history found.</Text>
          </View>
        ) : (
          <ScrollView style={styles.historyScroll}>
            {history.map((route) => (
              <View key={route.route_id} style={styles.historyItem}>
                <View style={styles.historyDetails}>
                  <Text style={styles.routeSource} numberOfLines={1}>🟢 {route.source}</Text>
                  <Text style={styles.routeDest} numberOfLines={1}>🔴 {route.destination}</Text>
                  <Text style={styles.routeDate}>
                    {new Date(route.created_at).toLocaleDateString()} • {route.distance}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(route.safety_score) }]}>
                  <Text style={styles.scoreText}>{route.safety_score}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FFF" style={styles.logoutIcon} />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
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
  loaderContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  avatarLargeText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userEmail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
  },
  statNum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  historyContainer: {
    flex: 1,
    marginBottom: 16,
  },
  historyHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  historyScroll: {
    flex: 1,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyHistoryText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  historyDetails: {
    flex: 1,
    marginRight: 10,
  },
  routeSource: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  routeDest: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  routeDate: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 4,
  },
  scoreBadge: {
    width: 28,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
