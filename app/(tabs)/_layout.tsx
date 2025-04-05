import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();

  // Load custom fonts for Art Nouveau styling
  const [fontsLoaded] = useFonts({
    'Amarante': require('../../assets/fonts/Amarante-Regular.ttf'),
    'FacultyGlyphic': require('../../assets/fonts/FacultyGlyphic-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Art Nouveau color palette
  const colors = {
    primary: '#8A6642', // Rich brown
    secondary: '#B8860B', // Dark goldenrod
    background: '#FFF8E1', // Light cream
    text: '#4A3728', // Dark brown
    accent: '#7D9E4C', // Sage green
    tabActive: colorScheme === 'dark' ? '#D4AF37' : '#8A6642',
    tabInactive: colorScheme === 'dark' ? '#666666' : '#BBBBBB',
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1C' : colors.background,
          borderTopColor: colorScheme === 'dark' ? '#333333' : '#E0E0E0',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1C' : colors.background,
        },
        headerTitleStyle: {
          fontFamily: 'FacultyGlyphic',
          color: colorScheme === 'dark' ? '#FFFFFF' : colors.text,
        },
        headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : colors.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover Events',
          tabBarIcon: ({ color }) => <FontAwesome5 name="compass" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="attending"
        options={{
          title: 'My RSVPs',
          tabBarIcon: ({ color }) => <FontAwesome5 name="calendar-check" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create Event',
          tabBarIcon: ({ color }) => <FontAwesome5 name="plus-circle" size={24} color={color} />,
        }}
      />
      {session && (
        <Tabs.Screen
          name="manage"
          options={{
            title: 'Manage Events',
            tabBarIcon: ({ color }) => <FontAwesome5 name="edit" size={24} color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}
