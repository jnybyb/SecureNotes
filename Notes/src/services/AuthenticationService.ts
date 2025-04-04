import * as Keychain from 'react-native-keychain';

// Service for handling PIN-based authentication
export class AuthenticationService {
    // Keychain service identifier for PIN storage
    private static readonly PIN_SERVICE = 'secure_notes_pin';

    // Checks if a PIN has been set up
    static async authenticate(): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.PIN_SERVICE
            });
            return credentials !== false;
        } catch (error) {
            console.error('Authentication error:', error);
            return false;
        }
    }

    // Validates the provided PIN against stored PIN
    static async verifyPin(pin: string): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.PIN_SERVICE
            });
            
            if (!credentials) {
                return false;
            }
            
            return credentials.password === pin;
        } catch (error) {
            console.error('PIN verification error:', error);
            return false;
        }
    }
}
