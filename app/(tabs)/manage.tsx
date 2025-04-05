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
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Tables } from '../../types/supabase';

type Event = Tables<'events'>;
type EventInput = Omit<Tables<'events'>, 'id' | 'created_at' | 'updated_at'>;

export default function ManageEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventInput>({
    title: '',
    description: '',
    location: '',
    image: '',
    organizer: '',
    attendees: 0,
    passcode: null,
  });
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      fetchUserEvents();
    }
  }, [session]);

  const fetchUserEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer', session?.user.email || '')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching user events:', error);
      Alert.alert('Error', 'Failed to load your events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      image: '',
      organizer: session?.user.email || '',
      attendees: 0,
      passcode: null,
    });
    setModalVisible(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      image: event.image || '',
      organizer: event.organizer || '',
      attendees: event.attendees || 0,
      passcode: event.passcode,
    });
    setModalVisible(true);
  };

  const handleCreateEvent = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Event title is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...formData }])
        .select();

      if (error) {
        throw error;
      }

      if (data) {
        setEvents([...data, ...events]);
        setModalVisible(false);
        Alert.alert('Success', 'Event created successfully!');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again later.');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !formData.title) {
      Alert.alert('Error', 'Event title is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', editingEvent.id)
        .select();

      if (error) {
        throw error;
      }

      if (data) {
        setEvents(events.map(e => e.id === editingEvent.id ? data[0] : e));
        setModalVisible(false);
        Alert.alert('Success', 'Event updated successfully!');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event. Please try again later.');
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', event.id);

              if (error) {
                throw error;
              }

              setEvents(events.filter(e => e.id !== event.id));
              Alert.alert('Success', 'Event deleted successfully!');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event. Please try again later.');
            }
          }
        }
      ]
    );
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <View style={styles.card}>
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
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <FontAwesome5 name="edit" size={14} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteEvent(item)}
          >
            <FontAwesome5 name="trash-alt" size={14} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.formLabel}>Event Title *</Text>
      <TextInput
        style={styles.input}
        value={formData.title || ''}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
        placeholder="Enter event title"
      />
      
      <Text style={styles.formLabel}>Location</Text>
      <TextInput
        style={styles.input}
        value={formData.location || ''}
        onChangeText={(text) => setFormData({ ...formData, location: text })}
        placeholder="Enter event location"
      />
      
      <Text style={styles.formLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.description || ''}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        placeholder="Enter event description"
        multiline
        numberOfLines={4}
      />
      
      <Text style={styles.formLabel}>Image URL</Text>
      <TextInput
        style={styles.input}
        value={formData.image || ''}
        onChangeText={(text) => setFormData({ ...formData, image: text })}
        placeholder="Enter image URL (optional)"
      />
      
      <View style={styles.formActions}>
        <TouchableOpacity 
          style={[styles.formButton, styles.cancelFormButton]}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.cancelFormButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.formButton}
          onPress={editingEvent ? handleUpdateEvent : handleCreateEvent}
        >
          <Text style={styles.formButtonText}>
            {editingEvent ? 'Update Event' : 'Create Event'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A6642" />
        <Text style={styles.loadingText}>Loading your events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={openCreateModal}
      >
        <FontAwesome5 name="plus" size={16} color="#FFFFFF" style={styles.createButtonIcon} />
        <Text style={styles.createButtonText}>Create New Event</Text>
      </TouchableOpacity>
      
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="calendar-plus" size={50} color="#CCCCCC" />
            <Text style={styles.emptyText}>You haven't created any events yet</Text>
            <Text style={styles.emptySubtext}>Tap the button above to create your first event</Text>
          </View>
        }
      />
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </Text>
            {renderForm()}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
    padding: 15,
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
  createButton: {
    backgroundColor: '#8A6642',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 15,
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Amarante',
  },
  eventsList: {
    flexGrow: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    fontFamily: 'Amarante',
  },
  editButton: {
    backgroundColor: '#7D9E4C',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
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
    textAlign: 'center',
    fontFamily: 'FacultyGlyphic',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'Amarante',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A3728',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'FacultyGlyphic',
  },
  formContainer: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    color: '#4A3728',
    marginBottom: 5,
    fontFamily: 'Amarante',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(138, 102, 66, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    fontFamily: 'Amarante',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formButton: {
    flex: 1,
    backgroundColor: '#8A6642',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  formButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Amarante',
  },
  cancelFormButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8A6642',
  },
  cancelFormButtonText: {
    color: '#8A6642',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Amarante',
  },
});
