import * as Keychain from 'react-native-keychain';

export class AuthenticationService {
    private static readonly PIN_SERVICE = 'secure_notes_pin';

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
