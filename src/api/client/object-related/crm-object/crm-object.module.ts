import { Module } from '@nestjs/common';
import { CrmObjectService } from './crm-object.service';
import { CrmObjectController } from './crm-object.controller';

@Module({
  providers: [CrmObjectService],
  controllers: [CrmObjectController]
})
export class CrmObjectModule {}
