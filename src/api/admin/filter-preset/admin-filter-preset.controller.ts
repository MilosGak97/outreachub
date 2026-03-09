import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetAdmin } from '../auth/get-admin.decorator';
import { Admin } from '../../entities/admin.entity';
import { AdminRole } from '../../enums/admin/admin-role.enum';
import { FilterPresetOwnerType } from '../../enums/filter-preset/filter-preset-owner-type.enum';
import { FilterPresetService } from '../../common/filter-preset/filter-preset.service';
import {
  CreateFilterPresetDto,
  FilterStateDto,
  FilterPresetListResponseDto,
  FilterPresetQueryDto,
  FilterPresetResponseDto,
  UpdateFilterPresetDto,
} from '../../common/filter-preset/dto';
import { FilterPreset } from '../../entities/filter-preset.entity';

/**
 * Global company ID used for admin-surface filter presets.
 * Admin pages (Companies, Admins, etc.) are not company-scoped,
 * so we use this constant UUID to scope admin presets.
 */
export const ADMIN_GLOBAL_COMPANY_ID = '00000000-0000-0000-0000-000000000000';

@ApiTags('admin-filter-presets')
@Controller('admin/filter-presets')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.HEAD, AdminRole.SUPPORT)
export class AdminFilterPresetController {
  constructor(private readonly filterPresetService: FilterPresetService) {}

  @ApiOperation({ summary: 'List filter presets for admin context' })
  @ApiOkResponse({ type: FilterPresetListResponseDto })
  @Get()
  async listPresets(
    @Query() query: FilterPresetQueryDto,
    @GetAdmin() admin: Admin,
  ): Promise<FilterPresetListResponseDto> {
    return this.filterPresetService.listPresets(
      query.conceptKey,
      query.tableId,
      FilterPresetOwnerType.ADMIN,
      admin.id,
      ADMIN_GLOBAL_COMPANY_ID,
    );
  }

  @ApiOperation({ summary: 'Create filter preset for admin' })
  @ApiCreatedResponse({ type: FilterPresetResponseDto })
  @ApiConflictResponse({ description: 'Preset name already exists in this context' })
  @ApiUnprocessableEntityResponse({ description: 'Preset limit reached for this context' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @Post()
  async createPreset(
    @Body() dto: CreateFilterPresetDto,
    @GetAdmin() admin: Admin,
  ): Promise<FilterPresetResponseDto> {
    const preset = await this.filterPresetService.createPreset(
      dto,
      FilterPresetOwnerType.ADMIN,
      admin.id,
      ADMIN_GLOBAL_COMPANY_ID,
    );

    return this.toResponseDto(preset);
  }

  @ApiOperation({ summary: 'Get filter preset by ID' })
  @ApiOkResponse({ type: FilterPresetResponseDto })
  @ApiNotFoundResponse({ description: 'Preset not found' })
  @Get(':id')
  async getPresetById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetAdmin() admin: Admin,
  ): Promise<FilterPresetResponseDto> {
    const preset = await this.filterPresetService.getPresetById(
      id,
      FilterPresetOwnerType.ADMIN,
      admin.id,
      ADMIN_GLOBAL_COMPANY_ID,
    );

    return this.toResponseDto(preset);
  }

  @ApiOperation({ summary: 'Update filter preset' })
  @ApiOkResponse({ type: FilterPresetResponseDto })
  @ApiNotFoundResponse({ description: 'Preset not found' })
  @ApiConflictResponse({ description: 'Preset name already exists in this context' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @Patch(':id')
  async updatePreset(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateFilterPresetDto,
    @GetAdmin() admin: Admin,
  ): Promise<FilterPresetResponseDto> {
    const preset = await this.filterPresetService.updatePreset(
      id,
      dto,
      FilterPresetOwnerType.ADMIN,
      admin.id,
      ADMIN_GLOBAL_COMPANY_ID,
    );

    return this.toResponseDto(preset);
  }

  @ApiOperation({ summary: 'Set preset as default for its context' })
  @ApiOkResponse({ type: FilterPresetResponseDto })
  @ApiNotFoundResponse({ description: 'Preset not found' })
  @Put(':id/default')
  async setDefault(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetAdmin() admin: Admin,
  ): Promise<FilterPresetResponseDto> {
    const preset = await this.filterPresetService.setDefault(
      id,
      FilterPresetOwnerType.ADMIN,
      admin.id,
      ADMIN_GLOBAL_COMPANY_ID,
    );

    return this.toResponseDto(preset);
  }

  @ApiOperation({ summary: 'Clear default preset for admin context' })
  @ApiOkResponse({ schema: { example: { cleared: true } } })
  @Delete('default')
  async clearDefault(
    @Query() query: FilterPresetQueryDto,
    @GetAdmin() admin: Admin,
  ): Promise<{ cleared: boolean }> {
    return this.filterPresetService.clearDefault(
      query.conceptKey,
      query.tableId,
      FilterPresetOwnerType.ADMIN,
      admin.id,
      ADMIN_GLOBAL_COMPANY_ID,
    );
  }

  @ApiOperation({ summary: 'Delete filter preset' })
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiNotFoundResponse({ description: 'Preset not found' })
  @Delete(':id')
  async deletePreset(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetAdmin() admin: Admin,
  ): Promise<{ deleted: true }> {
    return this.filterPresetService.deletePreset(
      id,
      FilterPresetOwnerType.ADMIN,
      admin.id,
      ADMIN_GLOBAL_COMPANY_ID,
    );
  }

  private toResponseDto(preset: FilterPreset): FilterPresetResponseDto {
    return {
      id: preset.id,
      name: preset.name,
      isDefault: preset.isDefault,
      filterState: preset.filterState as FilterStateDto,
      conceptKey: preset.conceptKey,
      tableId: preset.tableId,
      createdAt: preset.createdAt.toISOString(),
      updatedAt: preset.updatedAt.toISOString(),
    };
  }
}
