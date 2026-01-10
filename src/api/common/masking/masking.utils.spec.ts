import {
  maskPhone,
  maskEmail,
  maskAddress,
  getMasker,
  maskValue,
  MaskingStyle,
} from '../../../../src/api/common/masking/masking.utils';
import { ProtectedValueType } from '../../../../src/api/enums/protected/protected-value-type.enum';

describe('Masking Utils', () => {
  describe('maskPhone', () => {
    describe('last4 style (default)', () => {
      it('should mask phone with last4 style', () => {
        const result = maskPhone('+1 240 483 9876');
        expect(result).toContain('9876');
        expect(result).toContain('*');
        expect(result).not.toContain('2404839');
      });

      it('should handle US format with country code', () => {
        const result = maskPhone('+12404839876', 'last4');
        expect(result).toContain('9876');
        expect(result).toContain('+1');
      });

      it('should handle 10-digit US number', () => {
        const result = maskPhone('2404839876', 'last4');
        expect(result).toContain('9876');
      });

      it('should handle formatted phone numbers', () => {
        const result = maskPhone('(240) 483-9876', 'last4');
        expect(result).toContain('9876');
      });
    });

    describe('middle style', () => {
      it('should mask middle portion keeping first and last 2 digits', () => {
        const result = maskPhone('+12404839876', 'middle');
        expect(result).toMatch(/^\+12/);
        expect(result).toMatch(/76$/);
        expect(result).toContain('*');
      });
    });

    describe('edge cases', () => {
      it('should handle short numbers (less than 4 digits)', () => {
        const result = maskPhone('123');
        expect(result).toBe('***');
      });

      it('should handle exactly 4 digits', () => {
        const result = maskPhone('1234', 'last4');
        expect(result).toContain('1234');
      });

      it('should preserve leading plus sign', () => {
        const result = maskPhone('+44 20 7946 0958', 'last4');
        expect(result.startsWith('+')).toBe(true);
      });

      it('should handle international format', () => {
        const result = maskPhone('+44 20 7946 0958', 'last4');
        expect(result).toContain('0958');
      });
    });
  });

  describe('maskEmail', () => {
    describe('domain style (default)', () => {
      it('should mask email with domain style', () => {
        const result = maskEmail('john.doe@example.com');
        expect(result).toMatch(/^j\*+@e\*+\.com$/);
      });

      it('should keep first letter of local part', () => {
        const result = maskEmail('john@example.com', 'domain');
        expect(result.startsWith('j')).toBe(true);
      });

      it('should keep first letter of domain', () => {
        const result = maskEmail('john@example.com', 'domain');
        expect(result).toContain('@e');
      });

      it('should preserve TLD', () => {
        const result = maskEmail('john@example.com', 'domain');
        expect(result.endsWith('.com')).toBe(true);
      });

      it('should handle different TLDs', () => {
        const result = maskEmail('john@example.co.uk', 'domain');
        expect(result.endsWith('.uk')).toBe(true);
      });
    });

    describe('partial style', () => {
      it('should show first and last character of local part', () => {
        const result = maskEmail('john@example.com', 'partial');
        expect(result).toMatch(/^j\*+n@example\.com$/);
      });

      it('should keep full domain in partial style', () => {
        const result = maskEmail('test@domain.org', 'partial');
        expect(result).toContain('@domain.org');
      });
    });

    describe('edge cases', () => {
      it('should handle short local parts', () => {
        const result = maskEmail('a@example.com', 'domain');
        expect(result).toMatch(/^a@e\*+\.com$/);
      });

      it('should handle emails without TLD', () => {
        const result = maskEmail('john@localhost', 'domain');
        expect(result).toContain('j');
        expect(result).toContain('@');
      });

      it('should handle invalid email (no @)', () => {
        const result = maskEmail('notanemail');
        expect(result).toBe('**********');
      });

      it('should handle single character local part in partial style', () => {
        const result = maskEmail('a@example.com', 'partial');
        expect(result).toContain('@example.com');
      });

      it('should handle two character local part in partial style', () => {
        const result = maskEmail('ab@example.com', 'partial');
        expect(result).toMatch(/^\*\*@example\.com$/);
      });
    });
  });

  describe('maskAddress', () => {
    describe('street_number style (default)', () => {
      it('should mask street number', () => {
        const result = maskAddress('123 Main Street, Austin, TX 78701');
        expect(result).not.toMatch(/^123/);
        expect(result).toMatch(/^\*\*\*/);
        expect(result).toContain('Main Street');
      });

      it('should mask zip code last digits', () => {
        const result = maskAddress('123 Main Street, Austin, TX 78701');
        expect(result).toContain('787**');
        expect(result).not.toContain('78701');
      });

      it('should handle addresses without zip code', () => {
        const result = maskAddress('456 Oak Avenue');
        expect(result).toMatch(/^\*\*\*/);
        expect(result).toContain('Oak Avenue');
      });
    });

    describe('default style (first word)', () => {
      it('should mask first word when not street_number', () => {
        const result = maskAddress('Apartment 5B, Building A', 'middle' as MaskingStyle);
        expect(result).toMatch(/^\*+/);
      });
    });

    describe('edge cases', () => {
      it('should handle addresses starting with letters', () => {
        const result = maskAddress('Suite 100, 123 Main St', 'street_number');
        // No leading number, so first word not replaced by number mask
        expect(result).toBe('Suite 100, 123 Main St');
      });

      it('should handle PO Box addresses', () => {
        const result = maskAddress('PO Box 1234, Austin, TX 78701');
        expect(result).toContain('787**');
      });
    });
  });

  describe('getMasker', () => {
    it('should return maskPhone for PHONE type', () => {
      const masker = getMasker(ProtectedValueType.PHONE);
      expect(masker('+1234567890')).toBe(maskPhone('+1234567890'));
    });

    it('should return maskEmail for EMAIL type', () => {
      const masker = getMasker(ProtectedValueType.EMAIL);
      expect(masker('test@example.com')).toBe(maskEmail('test@example.com'));
    });

    it('should return maskAddress for ADDRESS type', () => {
      const masker = getMasker(ProtectedValueType.ADDRESS);
      expect(masker('123 Main St')).toBe(maskAddress('123 Main St'));
    });

    it('should return default masker for unknown type', () => {
      const masker = getMasker('unknown' as ProtectedValueType);
      expect(masker('test')).toBe('****');
    });
  });

  describe('maskValue', () => {
    it('should mask phone values', () => {
      const result = maskValue('+12404839876', ProtectedValueType.PHONE);
      expect(result).toContain('9876');
    });

    it('should mask email values', () => {
      const result = maskValue('john@example.com', ProtectedValueType.EMAIL);
      expect(result).toContain('@');
      expect(result).toContain('*');
    });

    it('should mask address values', () => {
      const result = maskValue('123 Main St, Austin, TX 78701', ProtectedValueType.ADDRESS);
      expect(result).toContain('Main St');
    });

    it('should accept optional style parameter', () => {
      const result = maskValue('+12404839876', ProtectedValueType.PHONE, 'middle');
      expect(result).toContain('+12');
    });
  });
});
