import { Module } from '@nestjs/common';
import { CrmObjectTypeService } from './crm-object-type.service';
import { CrmObjectTypeController } from './crm-object-type.controller';
import { CrmObjectType } from '../../../entities/object-related/crm-object-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObjectTypeRepository } from '../../../repositories/postgres/object-related/crm-object-type.repository';

@Module({
  providers: [CrmObjectTypeService, CrmObjectTypeRepository],
  controllers: [CrmObjectTypeController],
  imports: [TypeOrmModule.forFeature([CrmObjectType])],
})
export class ObjectTypeModule {}
