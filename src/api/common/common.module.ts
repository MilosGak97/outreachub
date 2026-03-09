import { Global, Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { PhoneModule } from './phone/phone.module';
import { AwsModule } from './aws/aws.module';
import { AwsController } from './aws/aws.controller';
import { EncryptionModule } from './encryption/encryption.module';
import { FilterPresetModule } from './filter-preset/filter-preset.module';

@Global()
@Module({
  controllers: [CommonController, AwsController],
  providers: [CommonService],
  imports: [PhoneModule, AwsModule, EncryptionModule, FilterPresetModule],
  exports: [PhoneModule, CommonService, AwsModule, FilterPresetModule]
})
export class CommonModule {}
