import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Tables } from '../../types/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Event = Tables<'events'>;

export default function EventDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRSVPd, setHasRSVPd] = useState(false);
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (!id) return;
    
    fetchEvent();
    checkRSVPStatus();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to load event details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkRSVPStatus = async () => {
    try {
      const storedEvent = await SecureStore.getItemAsync(id as string);
      setHasRSVPd(!!storedEvent);
    } catch (error) {
      console.error('Error checking RSVP status:', error);
    }
  };

  const handleRSVP = async () => {
    if (!event) return;
    
    try {
      // Increment attendees count
      const { data, error } = await supabase
        .from('events')
        .update({ attendees: (event.attendees || 0) + 1 })
        .eq('id', event.id)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Update the local state
        setEvent(data[0]);
        setHasRSVPd(true);
        
        // Save to secure storage
        await SecureStore.setItemAsync(event.id, JSON.stringify(data[0]));
        
        Alert.alert('Success', `You've RSVP'd to ${event.title}`);
      }
    } catch (error) {
      console.error('Error RSVPing to event:', error);
      Alert.alert('Error', 'Failed to RSVP. Please try again later.');
    }
  };

  const cancelRSVP = async () => {
    if (!event) return;
    
    try {
      // Decrement attendees count
      const { data, error } = await supabase
        .from('events')
        .update({ attendees: Math.max((event.attendees || 0) - 1, 0) })
        .eq('id', event.id)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Update the local state
        setEvent(data[0]);
        setHasRSVPd(false);
        
        // Remove from secure storage
        await SecureStore.deleteItemAsync(event.id);
        
        Alert.alert('Success', `You've canceled your RSVP to ${event.title}`);
      }
    } catch (error) {
      console.error('Error canceling RSVP:', error);
      Alert.alert('Error', 'Failed to cancel RSVP. Please try again later.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A6642" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-circle" size={50} color="#dc3545" />
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {event.image ? (
        <Image source={{ uri: event.image }} style={styles.eventImage} />
      ) : (
        <View style={[styles.eventImage, styles.placeholderImage]}>
          <FontAwesome5 name="calendar-alt" size={50} color="#8A6642" />
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        
        <View style={styles.infoRow}>
          <FontAwesome5 name="map-marker-alt" size={16} color="#7D9E4C" style={styles.infoIcon} />
          <Text style={styles.infoText}>{event.location || 'Location not specified'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <FontAwesome5 name="user-friends" size={16} color="#7D9E4C" style={styles.infoIcon} />
          <Text style={styles.infoText}>{event.attendees || 0} people attending</Text>
        </View>
        
        <View style={styles.infoRow}>
          <FontAwesome5 name="user" size={16} color="#7D9E4C" style={styles.infoIcon} />
          <Text style={styles.infoText}>Organized by {event.organizer || 'Anonymous'}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>About This Event</Text>
        <Text style={styles.description}>{event.description || 'No description provided.'}</Text>
        
        <View style={styles.divider} />
        
        {session ? (
          <View style={styles.authMessageContainer}>
            <FontAwesome5 name="info-circle" size={24} color="#8A6642" style={{marginRight: 10}} />
            <Text style={styles.authMessageText}>
              You are currently signed in. Please sign out to RSVP to events.
            </Text>
          </View>
        ) : (
          hasRSVPd ? (
            <TouchableOpacity 
              style={[styles.rsvpButton, styles.cancelButton]}
              onPress={cancelRSVP}
            >
              <FontAwesome5 name="calendar-times" size={16} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.rsvpButtonText}>Cancel RSVP</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.rsvpButton}
              onPress={handleRSVP}
            >
              <FontAwesome5 name="calendar-check" size={16} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.rsvpButtonText}>RSVP to This Event</Text>
            </TouchableOpacity>
          )
        )}
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Events</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF8E1',
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginTop: 10,
    marginBottom: 20,
    fontFamily: 'FacultyGlyphic',
  },
  eventImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F5F5F5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F5EB',
  },
  contentContainer: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A3728',
    marginBottom: 20,
    fontFamily: 'FacultyGlyphic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
    width: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#4A3728',
    flex: 1,
    fontFamily: 'Amarante',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(138, 102, 66, 0.2)',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3728',
    marginBottom: 10,
    fontFamily: 'FacultyGlyphic',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A3728',
    fontFamily: 'Amarante',
  },
  rsvpButton: {
    backgroundColor: '#8A6642',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 15,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  buttonIcon: {
    marginRight: 8,
  },
  rsvpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Amarante',
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#8A6642',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  backButtonText: {
    color: '#8A6642',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Amarante',
  },
  authMessageContainer: {
    backgroundColor: 'rgba(138, 102, 66, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authMessageText: {
    fontSize: 16,
    color: '#4A3728',
    marginLeft: 10,
    flex: 1,
    fontFamily: 'Amarante',
  },
});
