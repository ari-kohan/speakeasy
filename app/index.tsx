import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { signOut, session } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SpeakEasy</Text>
      <Text style={styles.subtitle}>You are logged in!</Text>
      
      {session && (
        <View style={styles.userInfo}>
          <Text style={styles.emailLabel}>Your email:</Text>
          <Text style={styles.email}>{session.user.email}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: "#666",
  },
  userInfo: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 30,
  },
  emailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  email: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#dc3545",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
