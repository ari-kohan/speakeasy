import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';

export default function DeepLinking() {
  useEffect(() => {
    // Handle deep links for Supabase auth
    const handleDeepLink = async (url: string) => {
      // Extract the access token and refresh token from the URL
      const parsedURL = new URL(url);
      const accessToken = parsedURL.searchParams.get('access_token');
      const refreshToken = parsedURL.searchParams.get('refresh_token');
      const type = parsedURL.searchParams.get('type');

      // If we have tokens and the type is recovery or signup, set the session
      if ((type === 'recovery' || type === 'signup') && accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <Slot />;
}
