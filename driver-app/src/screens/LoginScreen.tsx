import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff } from 'lucide-react-native';

import api from '../services/api';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://marylandvendngbcknd-production.up.railway.app/api/v1';

const ENDPOINTS = Array.from(new Set([
  ENV_API_URL,
  'http://192.168.1.50:3000/api/v1',
  'https://marylandvendngbcknd-production.up.railway.app/api/v1'
]));

export default function LoginScreen() {
  const [email, setEmail] = useState('driver@vendroute.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }
    if (hasError) return;
    
    setLoading(true);
    let response: any = null;
    let lastError: any = null;

    for (const url of ENDPOINTS) {
      try {
        const res = await axios.post(`${url}/auth/login`, {
          email: email.trim(),
          password: password.trim(),
        }, { timeout: 8000 });

        if (res.data?.success) {
          response = res;
          api.defaults.baseURL = url;
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (response?.data?.success) {
      if (response.data.user.role.toLowerCase() !== 'driver') {
        Alert.alert('Access Denied', 'This app is only for drivers.');
      } else {
        setAuth(response.data.user, response.data.token);
      }
    } else {
      console.log('Login Error:', lastError);
      const errMsg = lastError?.response?.data?.message || lastError?.message || '';
      if (errMsg.toLowerCase().includes('email')) {
        setEmailError('Invalid email address');
      } else if (errMsg.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password');
      } else {
        Alert.alert(
          'Login Failed', 
          errMsg || 'Invalid email or password'
        );
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formBox}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.subtitle}>Sign in to start your route</Text>

          <TextInput
            style={[styles.input, { marginBottom: emailError ? 8 : 16 }, emailError ? styles.inputError : null]}
            placeholder="Email Address"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={(text) => { setEmail(text); setEmailError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          <View style={[styles.passwordContainer, { marginBottom: passwordError ? 8 : 24 }, passwordError ? styles.inputError : null]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={24} color="#64748b" /> : <Eye size={24} color="#64748b" />}
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Light gray background to make the box pop
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logo: {
    width: 200,
    height: 100,
    alignSelf: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  eyeIcon: {
    padding: 16,
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 16,
    paddingLeft: 4,
  },
});
