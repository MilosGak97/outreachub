import { ProtectedValueType } from '../../enums/protected/protected-value-type.enum';

export type MaskingStyle = 'last4' | 'middle' | 'domain' | 'partial' | 'street_number';

export function maskPhone(phone: string, style: MaskingStyle = 'last4'): string {
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 4) {
    return '*'.repeat(phone.length);
  }

  if (style === 'last4') {
    const last4 = digits.slice(-4);
    const prefix = hasPlus ? '+' : '';
    const countryCode = digits.length > 10 ? digits.slice(0, digits.length - 10) : '';
    const maskedMiddle = '*'.repeat(Math.max(0, digits.length - 4 - countryCode.length));

    if (countryCode) {
      return `${prefix}${countryCode} ${maskedMiddle} ${last4}`;
    }
    return `${prefix}${maskedMiddle} ${last4}`;
  }

  const first2 = digits.slice(0, 2);
  const last2 = digits.slice(-2);
  const prefix = hasPlus ? '+' : '';
  return `${prefix}${first2}${'*'.repeat(digits.length - 4)}${last2}`;
}

export function maskEmail(email: string, style: MaskingStyle = 'domain'): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return '*'.repeat(email.length);
  }

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);
  const dotIndex = domainPart.lastIndexOf('.');

  if (style === 'domain') {
    const maskedLocal = localPart.length > 0
      ? localPart[0] + '*'.repeat(Math.max(0, localPart.length - 1))
      : '*';

    if (dotIndex > 0) {
      const domainName = domainPart.slice(0, dotIndex);
      const tld = domainPart.slice(dotIndex);
      const maskedDomain = domainName.length > 0
        ? domainName[0] + '*'.repeat(Math.max(0, domainName.length - 1))
        : '*';
      return `${maskedLocal}@${maskedDomain}${tld}`;
    }

    return `${maskedLocal}@${'*'.repeat(domainPart.length)}`;
  }

  const maskedLocal = localPart.length > 2
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    : '*'.repeat(localPart.length);

  return `${maskedLocal}@${domainPart}`;
}

export function maskAddress(address: string, style: MaskingStyle = 'street_number'): string {
  if (style === 'street_number') {
    let masked = address.replace(/^\d+/, (match) => '*'.repeat(match.length));
    masked = masked.replace(/(\d{3})(\d{2})$/, '$1**');
    return masked;
  }

  const words = address.split(' ');
  if (words.length > 0) {
    words[0] = '*'.repeat(words[0].length);
  }
  return words.join(' ');
}

export function getMasker(
  valueType: ProtectedValueType,
): (value: string, style?: MaskingStyle) => string {
  switch (valueType) {
    case ProtectedValueType.PHONE:
      return maskPhone;
    case ProtectedValueType.EMAIL:
      return maskEmail;
    case ProtectedValueType.ADDRESS:
      return maskAddress;
    default:
      return (value: string) => '*'.repeat(value.length);
  }
}

export function maskValue(
  value: string,
  valueType: ProtectedValueType,
  style?: MaskingStyle,
): string {
  const masker = getMasker(valueType);
  return masker(value, style);
}
