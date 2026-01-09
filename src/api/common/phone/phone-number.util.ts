// phone-number.util.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { countries as allCountries } from 'country-codes-flags-phone-codes';
import { PhoneNumberTypeDto } from './dto/phone-number-type.dto';

@Injectable()
export class PhoneNumberUtil {
  private readonly byCode = new Map<string, typeof allCountries[0]>();

  constructor() {
    for (const country of allCountries) {
      this.byCode.set(country.code.toUpperCase(), country);
    }
  }

  getByCode(code: string): PhoneNumberTypeDto {
    const c = this.byCode.get(code.toUpperCase());
    if (!c) throw new NotFoundException(`No country for code "${code}"`);
    return {
      name:   c.name,
      code:   c.code,
      flag:   `https://flagsapi.com/${c.code}/flat/16.png`,
      prefix: c.dialCode,
    };
  }
}
