import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private key: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const keyBase64 = this.configService.get<string>('PROTECTED_VALUES_ENCRYPTION_KEY');
    if (!keyBase64) {
      throw new Error('PROTECTED_VALUES_ENCRYPTION_KEY environment variable is required');
    }

    this.key = Buffer.from(keyBase64, 'base64');
    if (this.key.length !== 32) {
      throw new Error('PROTECTED_VALUES_ENCRYPTION_KEY must be 32 bytes (256 bits) base64 encoded');
    }
  }

  /**
   * Encrypt plaintext to Buffer
   * Format: [IV (16 bytes)][AuthTag (16 bytes)][CipherText]
   */
  encrypt(plaintext: string): Buffer {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt Buffer to plaintext
   * Expects format: [IV (16 bytes)][AuthTag (16 bytes)][CipherText]
   */
  decrypt(encryptedData: Buffer): string {
    const iv = encryptedData.subarray(0, this.ivLength);
    const authTag = encryptedData.subarray(this.ivLength, this.ivLength + this.authTagLength);
    const ciphertext = encryptedData.subarray(this.ivLength + this.authTagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
