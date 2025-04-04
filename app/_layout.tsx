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

    if (!session && !isAuthGroup) {
      // If no session and not on auth screen, redirect to auth
      router.replace("/auth");
    } else if (session && isAuthGroup) {
      // If has session and on auth screen, redirect to home
      router.replace("/");
    }
  }, [session, loading, segments]);

  return <Stack />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
