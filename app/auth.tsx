import { Redirect } from 'expo-router';

export default function AuthRedirect() {
  // This file creates a route at /auth that redirects to the auth screen
  return <Redirect href="/(auth)" />;
}
