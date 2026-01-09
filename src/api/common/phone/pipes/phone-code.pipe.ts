// pipes/phone-code.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { PhoneNumberTypeDto } from '../dto/phone-number-type.dto';
import { PhoneNumberUtil } from '../phone-number.util';

@Injectable()
export class PhoneCodePipe implements PipeTransform<string, PhoneNumberTypeDto> {
  constructor(private readonly util: PhoneNumberUtil) {}

  transform(code: string): PhoneNumberTypeDto {
    try {
      return this.util.getByCode(code);
    } catch {
      throw new BadRequestException(`Invalid country code "${code}"`);
    }
  }
}