import { Module } from '@nestjs/common';
import { FilterPresetModule } from '../../common/filter-preset/filter-preset.module';
import { AdminFilterPresetController } from './admin-filter-preset.controller';

@Module({
  imports: [FilterPresetModule],
  controllers: [AdminFilterPresetController],
})
export class AdminFilterPresetModule {}
