import { Module } from '@nestjs/common';
import { CrmObjectService } from './crm-object.service';
import { CrmObjectController } from './crm-object.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObject } from '../../../entities/object-related/crm-object.entity';
import { CrmObjectRepository } from '../../../repositories/postgres/object-related/crm-object.repository';

@Module({
  providers: [CrmObjectService, CrmObjectRepository],
  controllers: [CrmObjectController],
  imports: [TypeOrmModule.forFeature([CrmObject])],
})
export class CrmObjectModule {}
