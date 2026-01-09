import { Module } from '@nestjs/common';
import { PhoneNumberUtil } from './phone-number.util';
import { PhoneCodePipe } from './pipes/phone-code.pipe';

@Module({
  providers: [PhoneNumberUtil, PhoneCodePipe],
  exports:   [PhoneNumberUtil, PhoneCodePipe],
})
export class PhoneModule {}
