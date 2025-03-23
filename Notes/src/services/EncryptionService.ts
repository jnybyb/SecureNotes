import Aes from 'react-native-aes-crypto';
import * as Keychain from 'react-native-keychain';

export default class EncryptionService {
    private static readonly DB_KEY_ID = 'secure_notes_db_key';
    private static readonly NOTE_KEY_ID = 'secure_notes_content_key';

    public static async getDatabaseKey(): Promise<string> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.DB_KEY_ID
            });
            
            if (credentials) {
                return credentials.password;
            }
            
            // Generate new key if none exists
            const newKey = await Aes.randomKey(32);
            await Keychain.setGenericPassword(
                'dbkey', 
                newKey,
                {
                    service: this.DB_KEY_ID
                }
            );
            return newKey;
        } catch (error) {
            console.error('Error accessing keychain:', error);
            throw new Error('Failed to access secure storage');
        }
    }

    private static async getEncryptionKey(): Promise<string> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: this.NOTE_KEY_ID
            });
            
            if (credentials) {
                return credentials.password;
            }
            
            const newKey = await Aes.randomKey(32);
            await Keychain.setGenericPassword(
                'notekey',
                newKey,
                {
                    service: this.NOTE_KEY_ID
                }
            );
            return newKey;
        } catch (error) {
            console.error('Error accessing keychain:', error);
            throw new Error('Failed to access secure storage');
        }
    }

    public static async encryptData(data: string): Promise<{ cipher: string; iv: string; salt: string }> {
        try {
            const salt = await Aes.randomKey(16);
            const key = await this.getEncryptionKey();
            const iv = await Aes.randomKey(16);
            
            const cipher = await Aes.encrypt(data, key, iv, 'aes-256-cbc');
            return { cipher, iv, salt };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    public static async decryptData(cipher: string, iv: string, salt: string): Promise<string> {
        try {
            const key = await this.getEncryptionKey();
            return await Aes.decrypt(cipher, key, iv, 'aes-256-cbc');
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }
}
