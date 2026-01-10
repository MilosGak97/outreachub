import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../../../src/api/common/encryption/encryption.service';
import * as crypto from 'crypto';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  const validKey = crypto.randomBytes(32).toString('base64');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(validKey),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);

    // Trigger onModuleInit to initialize the key
    service.onModuleInit();
  });

  describe('encrypt and decrypt roundtrip', () => {
    it('should encrypt and decrypt correctly for simple text', () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt correctly for phone numbers', () => {
      const plaintext = '+1 240 483 9876';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt correctly for email addresses', () => {
      const plaintext = 'john.doe@example.com';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt correctly for addresses', () => {
      const plaintext = '123 Main Street, Austin, TX 78701';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt correctly for unicode text', () => {
      const plaintext = 'Hello, World! Cafe Creme';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt correctly for empty string', () => {
      const plaintext = '';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encryption randomness (IV)', () => {
    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'Same text';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      // Buffers should be different due to random IV
      expect(encrypted1.equals(encrypted2)).toBe(false);

      // But both should decrypt to the same value
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe('key validation', () => {
    it('should throw on missing encryption key', () => {
      const moduleRef = Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      });

      return moduleRef.compile().then(module => {
        const svc = module.get<EncryptionService>(EncryptionService);
        expect(() => svc.onModuleInit()).toThrow(
          'PROTECTED_VALUES_ENCRYPTION_KEY environment variable is required'
        );
      });
    });

    it('should throw on invalid key length (too short)', () => {
      const shortKey = crypto.randomBytes(16).toString('base64'); // 16 bytes instead of 32

      const moduleRef = Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(shortKey),
            },
          },
        ],
      });

      return moduleRef.compile().then(module => {
        const svc = module.get<EncryptionService>(EncryptionService);
        expect(() => svc.onModuleInit()).toThrow(
          'PROTECTED_VALUES_ENCRYPTION_KEY must be 32 bytes (256 bits) base64 encoded'
        );
      });
    });
  });

  describe('tamper detection', () => {
    it('should fail decryption with tampered ciphertext', () => {
      const plaintext = 'Sensitive data';
      const encrypted = service.encrypt(plaintext);

      // Tamper with the ciphertext (after IV and auth tag)
      const tamperedIndex = 32 + Math.floor(Math.random() * (encrypted.length - 32));
      encrypted[tamperedIndex] = encrypted[tamperedIndex] ^ 0xFF;

      expect(() => service.decrypt(encrypted)).toThrow();
    });

    it('should fail decryption with tampered auth tag', () => {
      const plaintext = 'Sensitive data';
      const encrypted = service.encrypt(plaintext);

      // Tamper with the auth tag (bytes 16-31)
      encrypted[20] = encrypted[20] ^ 0xFF;

      expect(() => service.decrypt(encrypted)).toThrow();
    });

    it('should fail decryption with tampered IV', () => {
      const plaintext = 'Sensitive data';
      const encrypted = service.encrypt(plaintext);

      // Tamper with the IV (first 16 bytes)
      encrypted[5] = encrypted[5] ^ 0xFF;

      expect(() => service.decrypt(encrypted)).toThrow();
    });
  });

  describe('buffer format', () => {
    it('should produce buffer of correct minimum length', () => {
      const plaintext = 'Test';
      const encrypted = service.encrypt(plaintext);

      // Minimum: 16 (IV) + 16 (AuthTag) + plaintext length = 32 + 4 = 36
      expect(encrypted.length).toBeGreaterThanOrEqual(32);
    });

    it('should return a Buffer instance', () => {
      const plaintext = 'Test';
      const encrypted = service.encrypt(plaintext);

      expect(Buffer.isBuffer(encrypted)).toBe(true);
    });
  });
});
