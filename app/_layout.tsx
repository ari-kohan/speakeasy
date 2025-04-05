import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

// This component handles the authentication flow
function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if the user is on an auth screen
    const isAuthGroup = segments[0] === "(auth)";
    
    // Get the current path as a string for easier checking
    const currentPath = segments.join('/');
    
    // Check if the user is trying to access the manage tab (protected)
    const isManagePath = currentPath.includes('manage');
    
    // Redirect unauthenticated users trying to access protected tabs to index
    if (!session && isManagePath) {
      router.replace("/" as any);
      return;
    }
    
    // Redirect authenticated users away from auth screens
    if (session && isAuthGroup) {
      router.replace("/");
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
