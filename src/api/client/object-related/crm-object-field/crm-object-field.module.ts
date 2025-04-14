import { Module } from '@nestjs/common';
import { CrmObjectFieldService } from './crm-object-field.service';
import { CrmObjectFieldController } from './crm-object-field.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObject } from '../../../entities/object-related/crm-object.entity';
import { CrmObjectFieldRepository } from '../../../repositories/postgres/object-related/crm-object-field.repository';

@Module({
  providers: [CrmObjectFieldService, CrmObjectFieldRepository],
  controllers: [CrmObjectFieldController],
  imports: [TypeOrmModule.forFeature([CrmObject])]
})
export class CrmObjectFieldModule {}
