import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilterPresetRepository } from '../../repositories/postgres/filter-preset.repository';
import {
  CreateFilterPresetDto,
  FilterPresetListResponseDto,
  FilterStateDto,
  UpdateFilterPresetDto,
} from './dto';
import { FilterPreset } from '../../entities/filter-preset.entity';
import { FilterPresetOwnerType } from '../../enums/filter-preset/filter-preset-owner-type.enum';

@Injectable()
export class FilterPresetService {
  private static readonly MAX_PRESETS_PER_CONTEXT = 50;

  constructor(private readonly filterPresetRepository: FilterPresetRepository) {}

  async createPreset(
    dto: CreateFilterPresetDto,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    companyId: string,
  ): Promise<FilterPreset> {
    const { conceptKey, tableId, name, filterState } = dto;
    const isDefault = dto.isDefault ?? false;

    const nameExists = await this.filterPresetRepository.existsByNameInContext(
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
      name,
    );

    if (nameExists) {
      throw new ConflictException('Preset name already exists in this context');
    }

    const count = await this.filterPresetRepository.countByContext(
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
    );

    if (count >= FilterPresetService.MAX_PRESETS_PER_CONTEXT) {
      throw new UnprocessableEntityException('Preset limit reached for this context');
    }

    if (isDefault) {
      await this.filterPresetRepository.clearDefaultInContext(
        companyId,
        ownerType,
        ownerId,
        conceptKey,
        tableId,
      );
    }

    const preset = this.filterPresetRepository.create({
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
      name,
      isDefault,
      filterState,
    });

    return this.filterPresetRepository.save(preset);
  }

  async listPresets(
    conceptKey: string,
    tableId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    companyId: string,
  ): Promise<FilterPresetListResponseDto> {
    const presets = await this.filterPresetRepository.findByContext(
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
    );

    const items = presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      isDefault: preset.isDefault,
      filterState: preset.filterState as FilterStateDto,
      conceptKey: preset.conceptKey,
      tableId: preset.tableId,
      createdAt: this.toIsoString(preset.createdAt),
      updatedAt: this.toIsoString(preset.updatedAt),
    }));

    return {
      context: { conceptKey, tableId },
      items,
      limit: FilterPresetService.MAX_PRESETS_PER_CONTEXT,
    };
  }

  async getPresetById(
    id: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    companyId: string,
  ): Promise<FilterPreset> {
    const preset = await this.filterPresetRepository.findByIdAndOwner(
      id,
      companyId,
      ownerType,
      ownerId,
    );

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    return preset;
  }

  async updatePreset(
    id: string,
    dto: UpdateFilterPresetDto,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    companyId: string,
  ): Promise<FilterPreset> {
    const preset = await this.filterPresetRepository.findByIdAndOwner(
      id,
      companyId,
      ownerType,
      ownerId,
    );

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    if (dto.name !== undefined && dto.name !== preset.name) {
      const nameExists = await this.filterPresetRepository.existsByNameInContext(
        companyId,
        ownerType,
        ownerId,
        preset.conceptKey,
        preset.tableId,
        dto.name,
      );

      if (nameExists) {
        throw new ConflictException('Preset name already exists in this context');
      }
    }

    if (dto.isDefault === true && preset.isDefault !== true) {
      await this.filterPresetRepository.clearDefaultInContext(
        companyId,
        ownerType,
        ownerId,
        preset.conceptKey,
        preset.tableId,
      );
    }

    if (dto.name !== undefined) {
      preset.name = dto.name;
    }

    if (dto.filterState !== undefined) {
      preset.filterState = dto.filterState;
    }

    if (dto.isDefault !== undefined) {
      preset.isDefault = dto.isDefault;
    }

    return this.filterPresetRepository.save(preset);
  }

  async setDefault(
    id: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    companyId: string,
  ): Promise<FilterPreset> {
    const preset = await this.filterPresetRepository.findByIdAndOwner(
      id,
      companyId,
      ownerType,
      ownerId,
    );

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    if (!preset.isDefault) {
      await this.filterPresetRepository.clearDefaultInContext(
        companyId,
        ownerType,
        ownerId,
        preset.conceptKey,
        preset.tableId,
      );
      preset.isDefault = true;
      return this.filterPresetRepository.save(preset);
    }

    return preset;
  }

  async clearDefault(
    conceptKey: string,
    tableId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    companyId: string,
  ): Promise<{ cleared: boolean }> {
    const currentDefault = await this.filterPresetRepository.findDefaultByContext(
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
    );

    if (!currentDefault) {
      return { cleared: true };
    }

    currentDefault.isDefault = false;
    await this.filterPresetRepository.save(currentDefault);
    return { cleared: true };
  }

  async deletePreset(
    id: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    companyId: string,
  ): Promise<{ deleted: true }> {
    const preset = await this.filterPresetRepository.findByIdAndOwner(
      id,
      companyId,
      ownerType,
      ownerId,
    );

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    await this.filterPresetRepository.remove(preset);
    return { deleted: true };
  }

  private toIsoString(value: Date | string): string {
    return typeof value === 'string' ? value : value.toISOString();
  }
}
