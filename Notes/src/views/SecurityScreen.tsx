import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

interface SecurityScreenProps {
  onAuthenticated: () => void;
  mode?: 'delete' | 'normal';  // Add new prop for different modes
}

const SecurityScreen: React.FC<SecurityScreenProps> = ({ onAuthenticated, mode = 'normal' }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupMode, setSetupMode] = useState<'initial' | 'confirm' | 'normal'>('normal');
  const [biometricPrompted, setBiometricPrompted] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>('');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);

  useEffect(() => {
    initializeSecurityCheck();
  }, [mode]);

  const initializeSecurityCheck = async () => {
    try {
      const credentials = await Keychain.getGenericPassword({ service: 'secure_notes_pin' });
      const biometricPreference = await AsyncStorage.getItem('biometricEnabled');

      if (!credentials) {
        // First time launch
        setSetupMode('initial');
        setShowBiometricButton(false);
      } else {
        // Subsequent launches
        setSetupMode('normal');
        setIsBiometricEnabled(biometricPreference === 'true');
        
        if (biometricPreference === 'true') {
          // User chose biometric
          setShowBiometricButton(false);
          startBiometricListener();
        } else {
          // User chose PIN
          setShowBiometricButton(true);
        }
      }
    } catch (error) {
      console.error('Error checking security settings:', error);
      setSetupMode('initial');
    }
  };

  const startBiometricListener = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      if (available && biometryType) {
        setAuthStatus('Authenticating...');
        
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Authenticate with fingerprint',
          cancelButtonText: 'Use PIN instead',
          fallbackPromptMessage: 'Use PIN instead',
        });

        if (success) {
          setAuthStatus('Authentication successful');
          setTimeout(() => {
            onAuthenticated();
          }, 500);
        } else {
          // User wants to use PIN temporarily
          setAuthStatus('');
          // Show "Use Biometric" since biometric is already enabled
          setShowBiometricButton(true);
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setAuthStatus('');
      setShowBiometricButton(true);
    }
  };

  const handlePinSetup = async (enteredConfirmPin: string) => {
    if (enteredConfirmPin === pin) {
      try {
        await Keychain.setGenericPassword('pin', pin, { service: 'secure_notes_pin' });
        resetToEnterPin();
        askForBiometricSetup();
      } catch (error) {
        console.error('Failed to save PIN:', error);
        Alert.alert('Error', 'Failed to save PIN. Please try again.');
      }
    } else {
      Alert.alert('PIN Mismatch', 'The PINs do not match. Please try again.');
      resetToInitialSetup();
    }
  };

  const resetToEnterPin = () => {
    setPin('');
    setConfirmPin('');
    setSetupMode('normal');
  };

  const resetToInitialSetup = () => {
    setPin('');
    setConfirmPin('');
    setSetupMode('initial');
  };

  const askForBiometricSetup = () => {
    Alert.alert(
      'Enable Biometric Authentication?',
      'Would you like to use your fingerprint for faster access?',
      [
        {
          text: 'No',
          onPress: async () => {
            await AsyncStorage.setItem('biometricEnabled', 'false');
            setShowBiometricButton(true);
            setIsBiometricEnabled(false);
            resetToEnterPin();
          },
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            const success = await promptBiometricAuth();
            if (success) {
              await AsyncStorage.setItem('biometricEnabled', 'true');
              setShowBiometricButton(false);
              setIsBiometricEnabled(true);
              resetToEnterPin();
            }
          },
        },
      ]
    );
  };

  const promptBiometricAuth = async (): Promise<boolean> => {
    const rnBiometrics = new ReactNativeBiometrics();

    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();

      if (available && biometryType) {
        setAuthStatus('Authenticating...');
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Authenticate with Biometrics',
          cancelButtonText: 'Cancel',
        });

        if (success) {
          setBiometricPrompted(true);
          setAuthStatus('App Starting...');
          setTimeout(() => {
            onAuthenticated();
          }, 1000); // Give time to show "App Starting" message
          return true;
        } else {
          setAuthStatus('');
          return false;
        }
      } else {
        Alert.alert('Biometric Authentication Not Available', 'Biometric authentication is not supported on this device.');
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'An error occurred while trying to authenticate.');
      setAuthStatus('');
      return false;
    }
  };

  const handleNumberPress = (num: string) => {
    if (setupMode === 'confirm') {
      if (confirmPin.length < 6) {
        const newPin = confirmPin + num;
        setConfirmPin(newPin);

        if (newPin.length === 6) {
          setTimeout(() => {
            handlePinSetup(newPin);
          }, 150);
        }
      }
    } else if (setupMode === 'initial' || setupMode === 'normal') {
      if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);

        if (newPin.length === 6) {
          setTimeout(() => {
            if (setupMode === 'initial') {
              setSetupMode('confirm');
            } else if (setupMode === 'normal') {
              verifyPin(newPin);
            }
          }, 150);
        }
      }
    }
  };

  const handleDelete = () => {
    if (setupMode === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const verifyPin = async (enteredPin: string) => {
    try {
      const credentials = await Keychain.getGenericPassword({ service: 'secure_notes_pin' });
      if (credentials && credentials.password === enteredPin) {
        onAuthenticated();
      } else {
        Alert.alert('Incorrect PIN', 'Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('Error retrieving PIN:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleBiometricButtonPress = () => {
    if (isBiometricEnabled) {
      // If biometric is already enabled, directly start the biometric listener
      startBiometricListener();
    } else {
      // If biometric is not enabled, show the setup modal
      askForBiometricSetup();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image source={require('../assets/icons/NoteLogo.png')} style={styles.logo} />
        <Text style={styles.title}>Notes</Text>
        <Image source={require('../assets/icons/fingerprint.png')} style={styles.fingerprintIcon} />
        {authStatus ? (
          <Text style={styles.authStatus}>{authStatus}</Text>
        ) : (
          showBiometricButton && mode === 'normal' && (
            <TouchableOpacity onPress={handleBiometricButtonPress}>
              <Text style={styles.biometricsText}>
                {isBiometricEnabled ? 'Use Biometric' : 'Enable Biometric'}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.prompt}>
          {setupMode === 'initial' ? 'Create a PIN' : setupMode === 'confirm' ? 'Confirm PIN' : 'Enter PIN'}
        </Text>

        <View style={styles.pinContainer}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinCircle,
                ((setupMode === 'confirm' && confirmPin.length > index) ||
                  (setupMode !== 'confirm' && pin.length > index)) &&
                  styles.filledPinCircle,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.numpad}>
        {[
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
          ['', 0, 'delete'],
        ].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numpadRow}>
            {row.map((num, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                onPress={() => {
                  if (num === 'delete') handleDelete();
                  else if (num !== '') handleNumberPress(num.toString());
                }}
                style={styles.numButton}
              >
                {num === 'delete' ? (
                  <Image source={require('../assets/icons/delete.png')} style={styles.deleteIcon} />
                ) : num !== '' ? (
                  <Text style={styles.numText}>{num}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  contentContainer: { 
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  logo: { 
    width: 55, 
    height: 55,
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 10,
  },
  fingerprintIcon: { 
    width: 40, 
    height: 40, 
    marginTop: 40,
  },
  prompt: { 
    fontSize: 17, 
    marginBottom: 20
  },
  pinContainer: { 
    flexDirection: 'row', 
    marginBottom: 30
  },
  pinCircle: { width: 10, height: 10, borderRadius: 7.5, borderWidth: 1, borderColor: '#333', marginHorizontal: 5 },
  filledPinCircle: { backgroundColor: '#000' },
  numpad: { 
    width: '100%', 
    paddingBottom: 20,
    backgroundColor: '#fff' 
  },
  numpadRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginBottom: 2 },
  numButton: { width: 75, height: 75, justifyContent: 'center', alignItems: 'center', borderRadius: 37.5 },
  numText: { fontSize: 24, color: '#000' },
  deleteIcon: { width: 38, height: 38 },
  biometricsText: {
    fontSize: 15,
    color: '#007AFF',
    marginTop: 10,
  },
  authStatus: {
    fontSize: 15,
    color: '#007AFF',
    marginTop: 10,
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default SecurityScreen;