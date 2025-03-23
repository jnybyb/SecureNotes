import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

interface SecurityScreenProps {
  onAuthenticated: () => void;
}

const SecurityScreen: React.FC<SecurityScreenProps> = ({ onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupMode, setSetupMode] = useState<'initial' | 'confirm' | 'normal'>('normal');
  const [biometricPrompted, setBiometricPrompted] = useState(false);

  useEffect(() => {
    checkFirstTimeSetup();
  }, []);

  const checkFirstTimeSetup = async () => {
    try {
      const credentials = await Keychain.getGenericPassword({ service: 'secure_notes_pin' });
      const biometricPreference = await AsyncStorage.getItem('biometricEnabled'); // Check stored preference

      if (!credentials) {
        setSetupMode('initial');
      } else {
        setSetupMode('normal');
        if (!biometricPrompted && biometricPreference === 'true') {
          promptBiometricAuth();
        }
      }
    } catch (error) {
      console.error('Error checking keychain:', error);
      setSetupMode('initial');
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
            await AsyncStorage.setItem('biometricEnabled', 'false'); // Store preference
            resetToEnterPin();
          },
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            const success = await promptBiometricAuth();
            if (success) {
              await AsyncStorage.setItem('biometricEnabled', 'true'); // Store preference
              resetToEnterPin(); // Redirect to normal Security Screen
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
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Authenticate with Biometrics',
          cancelButtonText: 'Cancel',
        });

        if (success) {
          setBiometricPrompted(true);
          onAuthenticated(); // Authenticate the user
          return true; // Return success
        } else {
            return false; // Return failure
        }
      } else {
        Alert.alert('Biometric Authentication Not Available', 'Biometric authentication is not supported on this device.');
        return false; // Return failure
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'An error occurred while trying to authenticate.');
      return false; // Return failure
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

  return (
    <View style={styles.container}>
      <Image source={require('../assets/icons/NoteLogo.png')} style={styles.logo} />
      <Text style={styles.title}>Notes</Text>

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
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 55, height: 55, marginTop: 100, alignSelf: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 10, marginBottom: 10, alignSelf: 'center' },
  prompt: { fontSize: 17, marginBottom: 25 },
  pinContainer: { flexDirection: 'row', marginBottom: 40 },
  pinCircle: { width: 10, height: 10, borderRadius: 7.5, borderWidth: 1, borderColor: '#333', marginHorizontal: 5 },
  filledPinCircle: { backgroundColor: '#000' },
  numpad: { width: '100%', paddingBottom: 10, backgroundColor: '#fff' },
  numpadRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 2 },
  numButton: { width: 75, height: 75, justifyContent: 'center', alignItems: 'center', borderRadius: 37.5 },
  numText: { fontSize: 24, color: '#000' },
  deleteIcon: { width: 38, height: 38 },
});

export default SecurityScreen;