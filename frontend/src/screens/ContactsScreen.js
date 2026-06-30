import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactsScreen({ token, backendUrl }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setContacts(data);
      }
    } catch (err) {
      console.error('Fetch contacts failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async () => {
    if (!name || !phone) {
      setError('Please fill in name and phone number');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contact_name: name,
          phone_number: phone,
          relationship
        })
      });

      const data = await response.json();
      if (response.ok) {
        setContacts(prev => [...prev, data.contact]);
        setName('');
        setPhone('');
        setRelationship('Friend');
      } else {
        setError(data.error || 'Failed to add contact');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      const response = await fetch(`${backendUrl}/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setContacts(prev => prev.filter(c => c.contact_id !== contactId));
      }
    } catch (err) {
      console.error('Delete contact failed:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trusted Contacts</Text>
        <Text style={styles.subtitle}>These contacts will be alerted during emergencies</Text>
      </View>

      {/* Add Contact Card */}
      <View style={styles.addCard}>
        <Text style={styles.cardHeader}>Add New Contact</Text>
        {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#6B7280"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Relationship Picker Simulation */}
        <View style={styles.relationRow}>
          {['Friend', 'Parent', 'Partner', 'Sibling'].map((rel) => (
            <TouchableOpacity
              key={rel}
              style={[styles.relationBtn, relationship === rel && styles.relationBtnActive]}
              onPress={() => setRelationship(rel)}
            >
              <Text style={[styles.relationText, relationship === rel && styles.relationTextActive]}>
                {rel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleAddContact} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Add to Trusted Circle</Text>}
        </TouchableOpacity>
      </View>

      {/* Contacts List */}
      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Your Safety Circle</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={40} color="#4B5563" />
            <Text style={styles.emptyText}>No contacts added yet. Add trusted contacts above.</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollList}>
            {contacts.map((contact) => (
              <View key={contact.contact_id} style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{contact.contact_name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.contactMeta}>
                    <Text style={styles.contactName}>{contact.contact_name}</Text>
                    <Text style={styles.contactPhone}>
                      {contact.phone_number} • <Text style={styles.relationshipText}>{contact.relationship}</Text>
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteContact(contact.contact_id)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
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
  addCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  relationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  relationBtn: {
    backgroundColor: '#111827',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  relationBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  relationText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  relationTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  scrollList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 40,
  },
  contactItem: {
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
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  contactMeta: {
    flex: 1,
  },
  contactName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contactPhone: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  relationshipText: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
  },
});
