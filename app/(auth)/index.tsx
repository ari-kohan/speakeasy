import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { makeRedirectUri } from 'expo-auth-session';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const { signIn, loading } = useAuth();

  const handleSignIn = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    const { error } = await signIn(email);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setIsSent(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Speakeasy</Text>
        <Text style={styles.subtitle}>
          {isSent
            ? 'Check your email'
            : 'Sign in with magic link'}
        </Text>

        {!isSent ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Magic Link</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.sentContainer}>
            <Text style={styles.sentText}>
              We've sent a magic link to:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.instructionText}>
              Check your email and click the link to sign in.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.resendButton]}
              onPress={() => setIsSent(false)}
            >
              <Text style={styles.buttonText}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  sentText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  resendButton: {
    backgroundColor: '#6c757d',
    marginTop: 10,
  },
});
