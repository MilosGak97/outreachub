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
import { AuthGuard } from '../../client/auth/guards';
import { CurrentUser } from '../../client/auth/decorators';
import { CompanyContext } from '../../client/multi-tenant-setup/company.context';
import { User } from '../../entities/user.entity';
import { FilterPresetOwnerType } from '../../enums/filter-preset/filter-preset-owner-type.enum';
import { UserType } from '../../enums/user/user-type.enum';
import { FilterPresetService } from './filter-preset.service';
import {
  CreateFilterPresetDto,
  FilterStateDto,
  FilterPresetListResponseDto,
  FilterPresetQueryDto,
  FilterPresetResponseDto,
  UpdateFilterPresetDto,
} from './dto';
import { FilterPreset } from '../../entities/filter-preset.entity';

@ApiTags('filter-presets')
@Controller('filter-presets')
@UseGuards(AuthGuard)
export class FilterPresetController {
  constructor(
    private readonly filterPresetService: FilterPresetService,
    private readonly companyContext: CompanyContext,
  ) {}

  @ApiOperation({ summary: 'List filter presets for context' })
  @ApiOkResponse({ type: FilterPresetListResponseDto })
  @Get()
  async listPresets(
    @Query() query: FilterPresetQueryDto,
    @CurrentUser() user: User,
  ): Promise<FilterPresetListResponseDto> {
    const companyId = this.companyContext.currentCompanyId;
    const ownerType = this.resolveOwnerType(user);

    return this.filterPresetService.listPresets(
      query.conceptKey,
      query.tableId,
      ownerType,
      user.id,
      companyId,
    );
  }

  @ApiOperation({ summary: 'Create filter preset' })
  @ApiCreatedResponse({ type: FilterPresetResponseDto })
  @ApiConflictResponse({ description: 'Preset name already exists in this context' })
  @ApiUnprocessableEntityResponse({ description: 'Preset limit reached for this context' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @Post()
  async createPreset(
    @Body() dto: CreateFilterPresetDto,
    @CurrentUser() user: User,
  ): Promise<FilterPresetResponseDto> {
    const companyId = this.companyContext.currentCompanyId;
    const ownerType = this.resolveOwnerType(user);
    const preset = await this.filterPresetService.createPreset(
      dto,
      ownerType,
      user.id,
      companyId,
    );

    return this.toResponseDto(preset);
  }

  @ApiOperation({ summary: 'Get filter preset by ID' })
  @ApiOkResponse({ type: FilterPresetResponseDto })
  @ApiNotFoundResponse({ description: 'Preset not found' })
  @Get(':id')
  async getPresetById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<FilterPresetResponseDto> {
    const companyId = this.companyContext.currentCompanyId;
    const ownerType = this.resolveOwnerType(user);
    const preset = await this.filterPresetService.getPresetById(
      id,
      ownerType,
      user.id,
      companyId,
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
    @CurrentUser() user: User,
  ): Promise<FilterPresetResponseDto> {
    const companyId = this.companyContext.currentCompanyId;
    const ownerType = this.resolveOwnerType(user);
    const preset = await this.filterPresetService.updatePreset(
      id,
      dto,
      ownerType,
      user.id,
      companyId,
    );

    return this.toResponseDto(preset);
  }

  @ApiOperation({ summary: 'Set preset as default for its context' })
  @ApiOkResponse({ type: FilterPresetResponseDto })
  @ApiNotFoundResponse({ description: 'Preset not found' })
  @Put(':id/default')
  async setDefault(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<FilterPresetResponseDto> {
    const companyId = this.companyContext.currentCompanyId;
    const ownerType = this.resolveOwnerType(user);
    const preset = await this.filterPresetService.setDefault(
      id,
      ownerType,
      user.id,
      companyId,
    );

    return this.toResponseDto(preset);
  }

  @ApiOperation({ summary: 'Clear default preset for context' })
  @ApiOkResponse({ schema: { example: { cleared: true } } })
  @Delete('default')
  async clearDefault(
    @Query() query: FilterPresetQueryDto,
    @CurrentUser() user: User,
  ): Promise<{ cleared: boolean }> {
    const companyId = this.companyContext.currentCompanyId;
    const ownerType = this.resolveOwnerType(user);
    return this.filterPresetService.clearDefault(
      query.conceptKey,
      query.tableId,
      ownerType,
      user.id,
      companyId,
    );
  }

  @ApiOperation({ summary: 'Delete filter preset' })
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiNotFoundResponse({ description: 'Preset not found' })
  @Delete(':id')
  async deletePreset(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: true }> {
    const companyId = this.companyContext.currentCompanyId;
    const ownerType = this.resolveOwnerType(user);
    return this.filterPresetService.deletePreset(id, ownerType, user.id, companyId);
  }

  private resolveOwnerType(user: User): FilterPresetOwnerType {
    return user.userType === UserType.EMPLOYEE
      ? FilterPresetOwnerType.ADMIN
      : FilterPresetOwnerType.USER;
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
