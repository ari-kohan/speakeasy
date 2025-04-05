import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome5 } from '@expo/vector-icons';
import { Tables } from '../../types/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Event = Tables<'events'>;

export default function AttendingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (!session) {
      loadRSVPdEvents();
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadRSVPdEvents = async () => {
    setLoading(true);
    try {
      // Get all keys from SecureStore
      const allKeys = await SecureStore.getItemAsync('allEventKeys');
      const eventKeys = allKeys ? JSON.parse(allKeys) : [];
      
      // If we don't have any stored keys yet, try to scan for event IDs
      if (!eventKeys || eventKeys.length === 0) {
        await scanForEventKeys();
        return;
      }
      
      const savedEvents: Event[] = [];
      
      // Get each event from SecureStore
      for (const key of eventKeys) {
        const eventJson = await SecureStore.getItemAsync(key);
        if (eventJson) {
          try {
            const event = JSON.parse(eventJson);
            savedEvents.push(event);
          } catch (e) {
            console.error('Error parsing event JSON:', e);
          }
        }
      }
      
      setEvents(savedEvents);
    } catch (error) {
      console.error('Error loading RSVPd events:', error);
      Alert.alert('Error', 'Failed to load your RSVPd events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // This is a fallback method to scan for event keys if we don't have a stored list
  const scanForEventKeys = async () => {
    try {
      // We don't have a direct way to list all keys in SecureStore,
      // so we'll fetch all events from Supabase and check if we have them in SecureStore
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/events?select=id`, {
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch event IDs');
      }
      
      const eventIds = await response.json();
      const savedEvents: Event[] = [];
      const foundKeys: string[] = [];
      
      for (const { id } of eventIds) {
        const eventJson = await SecureStore.getItemAsync(id);
        if (eventJson) {
          try {
            const event = JSON.parse(eventJson);
            savedEvents.push(event);
            foundKeys.push(id);
          } catch (e) {
            console.error('Error parsing event JSON:', e);
          }
        }
      }
      
      // Save the found keys for future use
      await SecureStore.setItemAsync('allEventKeys', JSON.stringify(foundKeys));
      setEvents(savedEvents);
    } catch (error) {
      console.error('Error scanning for event keys:', error);
      Alert.alert('Error', 'Failed to load your RSVPd events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const cancelRSVP = async (event: Event) => {
    try {
      // Remove from SecureStore
      await SecureStore.deleteItemAsync(event.id);
      
      // Update allEventKeys
      const allKeys = await SecureStore.getItemAsync('allEventKeys');
      const eventKeys = allKeys ? JSON.parse(allKeys) : [];
      const updatedKeys = eventKeys.filter((key: string) => key !== event.id);
      await SecureStore.setItemAsync('allEventKeys', JSON.stringify(updatedKeys));
      
      // Update UI
      setEvents(events.filter(e => e.id !== event.id));
      
      Alert.alert('Success', `You've canceled your RSVP to ${event.title}`);
    } catch (error) {
      console.error('Error canceling RSVP:', error);
      Alert.alert('Error', 'Failed to cancel RSVP. Please try again later.');
    }
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/event/${item.id}` as any)}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.eventImage} />
      ) : (
        <View style={[styles.eventImage, styles.placeholderImage]}>
          <FontAwesome5 name="calendar-alt" size={40} color="#8A6642" />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventLocation}>{item.location}</Text>
        <Text style={styles.eventAttendees}>
          <FontAwesome5 name="user-friends" size={14} color="#7D9E4C" /> {item.attendees || 0} attending
        </Text>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => cancelRSVP(item)}
        >
          <Text style={styles.cancelButtonText}>Cancel RSVP</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {session ? (
        <View style={styles.authMessageContainer}>
          <FontAwesome5 name="info-circle" size={50} color="#8A6642" style={{marginBottom: 20}} />
          <Text style={styles.emptyText}>
            You are currently signed in
          </Text>
          <Text style={styles.authMessageText}>
            Please sign out to view your RSVPs. Signed-in users cannot RSVP to events.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A6642" />
          <Text style={styles.loadingText}>Loading your RSVPs...</Text>
        </View>
      ) : events.length > 0 ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          style={styles.eventsList}
          contentContainerStyle={styles.eventsListContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="calendar-alt" size={50} color="#8A6642" style={{marginBottom: 20}} />
          <Text style={styles.emptyText}>
            You haven't RSVP'd to any events yet
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.browseButtonText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A3728',
    fontFamily: 'Amarante',
  },
  eventsList: {
    padding: 15,
  },
  eventsListContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138, 102, 66, 0.3)',
  },
  eventImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F5F5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F5EB',
  },
  cardContent: {
    padding: 15,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3728',
    marginBottom: 8,
    fontFamily: 'FacultyGlyphic',
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Amarante',
  },
  eventAttendees: {
    fontSize: 14,
    color: '#7D9E4C',
    marginBottom: 12,
    fontFamily: 'Amarante',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Amarante',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'FacultyGlyphic',
  },
  browseButton: {
    backgroundColor: '#8A6642',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Amarante',
  },
  authMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authMessageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Amarante',
    marginBottom: 20,
  },
});
