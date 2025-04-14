import { Module } from '@nestjs/common';
import { CrmObjectTypeService } from './crm-object-type.service';
import { CrmObjectTypeController } from './crm-object-type.controller';

@Module({
  providers: [CrmObjectTypeService],
  controllers: [CrmObjectTypeController]
})
export class ObjectTypeModule {}
