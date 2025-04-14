import { Module } from '@nestjs/common';
import { CrmObjectFieldService } from './crm-object-field.service';
import { CrmObjectFieldController } from './crm-object-field.controller';

@Module({
  providers: [CrmObjectFieldService],
  controllers: [CrmObjectFieldController]
})
export class CrmObjectFieldModule {}
