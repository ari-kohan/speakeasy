import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome5 } from '@expo/vector-icons';
import { Tables } from '../../types/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Event = Tables<'events'>;

export default function DiscoverEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (!session) {
      getLocationAndFetchEvents();
    } else {
      setLoading(false);
    }
  }, [session]);

  const getLocationAndFetchEvents = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        // Still fetch events even without location
        await fetchEvents();
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      await fetchEvents(location);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Could not get your location');
      // Still fetch events even without location
      await fetchEvents();
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (userLocation?: Location.LocationObject) => {
    try {
      // For now, we're just fetching all events since we don't have location data in the events table
      // In a real app, we would filter by proximity to user's location
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Sort events by proximity to user's location if available
        // This is a placeholder - in a real app, you would store location coordinates in the database
        // and use a geospatial query to find nearby events
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again later.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await getLocationAndFetchEvents();
    setRefreshing(false);
  };

  const handleRSVP = async (event: Event) => {
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
        setEvents(events.map(e => e.id === event.id ? data[0] : e));
        
        // Save to secure storage
        await SecureStore.setItemAsync(event.id, JSON.stringify(data[0]));
        
        Alert.alert('Success', `You've RSVP'd to ${event.title}`);
      }
    } catch (error) {
      console.error('Error RSVPing to event:', error);
      Alert.alert('Error', 'Failed to RSVP. Please try again later.');
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
          style={styles.rsvpButton}
          onPress={() => handleRSVP(item)}
        >
          <Text style={styles.rsvpButtonText}>RSVP</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {session ? (
        <View style={styles.authMessageContainer}>
          <FontAwesome5 name="info-circle" size={50} color="#8A6642" style={{marginBottom: 20}} />
          <Text style={styles.headerText}>
            You are currently signed in
          </Text>
          <Text style={styles.authMessageText}>
            Please sign out to view and RSVP to community events. Signed-in users can only create and manage their own events.
          </Text>
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={() => router.push('/manage' as any)}
          >
            <Text style={styles.manageButtonText}>Manage My Events</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A6642" />
          <Text style={styles.loadingText}>Discovering events near you...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerText}>Discover Events</Text>
            <Text style={styles.subHeaderText}>
              Find community events happening around you
            </Text>
          </View>
          
          {locationError ? (
            <View style={styles.locationErrorContainer}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#dc3545" />
              <Text style={styles.locationErrorText}>{locationError}</Text>
            </View>
          ) : null}
          
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={renderEventCard}
            style={styles.eventsList}
            contentContainerStyle={styles.eventsListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#8A6642']}
                tintColor="#8A6642"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome5 name="calendar-times" size={50} color="#CCCCCC" />
                <Text style={styles.emptyText}>No events found</Text>
              </View>
            }
          />
        </>
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(125, 158, 76, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 102, 66, 0.2)',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A3728',
    fontFamily: 'Amarante',
  },
  locationErrorContainer: {
    padding: 15,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 53, 69, 0.2)',
  },
  locationErrorText: {
    fontSize: 14,
    color: '#dc3545',
    fontFamily: 'Amarante',
  },
  locationErrorSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Amarante',
  },
  eventsList: {
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
    fontFamily: 'FacultyGlyphicBold',
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
  rsvpButton: {
    backgroundColor: '#8A6642',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rsvpButtonText: {
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
    fontFamily: 'FacultyGlyphicBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
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
    marginBottom: 30,
  },
  manageButton: {
    backgroundColor: '#8A6642',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Amarante',
  },
  eventsListContent: {
    padding: 15,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 102, 66, 0.2)',
  },
  headerText: {
    fontSize: 24,
    color: '#4A3728',
    fontFamily: 'FacultyGlyphicBold',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Amarante',
  },
});
