import { Global, Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { PhoneModule } from './phone/phone.module';
import { AwsModule } from './aws/aws.module';
import { AwsController } from './aws/aws.controller';

@Global()
@Module({
  controllers: [CommonController, AwsController],
  providers: [CommonService],
  imports: [PhoneModule, AwsModule],
  exports: [PhoneModule, CommonService, AwsModule]
})
export class CommonModule {}
