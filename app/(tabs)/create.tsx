import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateEvent() {
  const router = useRouter();
  const { session } = useAuth();

  // Redirect to auth screen
  const handleSignIn = () => {
    router.push('/auth' as any);
  };

  return (
    <ScrollView style={styles.container}>
      {!session ? (
        <View style={styles.contentContainer}>
          <FontAwesome5 name="lock" size={50} color="#8A6642" style={styles.icon} />
          <Text style={styles.title}>Create Your Own Event</Text>
          <Text style={styles.description}>
            To create and manage community events, you'll need to sign in first.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleSignIn}
          >
            <Text style={styles.buttonText}>Sign In to Continue</Text>
          </TouchableOpacity>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>What You Can Do After Signing In:</Text>
            <View style={styles.infoItem}>
              <FontAwesome5 name="plus-circle" size={16} color="#7D9E4C" style={styles.infoIcon} />
              <Text style={styles.infoText}>Create new community events</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="edit" size={16} color="#7D9E4C" style={styles.infoIcon} />
              <Text style={styles.infoText}>Manage your created events</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="chart-line" size={16} color="#7D9E4C" style={styles.infoIcon} />
              <Text style={styles.infoText}>Track attendance and engagement</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <FontAwesome5 name="info-circle" size={50} color="#8A6642" style={styles.icon} />
          <Text style={styles.title}>You're Already Signed In</Text>
          <Text style={styles.description}>
            As a signed-in user, you can manage your events but cannot create new ones.
            Please use the Manage Events tab to view and edit your existing events.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/manage' as any)}
          >
            <Text style={styles.buttonText}>Go to Manage Events</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'FacultyGlyphic',
    color: '#4A3728',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Amarante',
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#8A6642',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Amarante',
    fontWeight: '600',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'FacultyGlyphic',
    color: '#4A3728',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Amarante',
    color: '#666',
  },
});
