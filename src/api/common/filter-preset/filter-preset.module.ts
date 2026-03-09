import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterPreset } from '../../entities/filter-preset.entity';
import { FilterPresetRepository } from '../../repositories/postgres/filter-preset.repository';
import { SharedModule } from '../../client/multi-tenant-setup/shared-module';
import { FilterPresetController } from './filter-preset.controller';
import { FilterPresetService } from './filter-preset.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([FilterPreset])],
  controllers: [FilterPresetController],
  providers: [FilterPresetService, FilterPresetRepository],
  exports: [FilterPresetService, FilterPresetRepository],
})
export class FilterPresetModule {}
