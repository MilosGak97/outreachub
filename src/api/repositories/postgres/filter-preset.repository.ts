import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { FilterPreset } from '../../entities/filter-preset.entity';
import { FilterPresetOwnerType } from '../../enums/filter-preset/filter-preset-owner-type.enum';

@Injectable()
export class FilterPresetRepository extends Repository<FilterPreset> {
  constructor(private readonly dataSource: DataSource) {
    super(FilterPreset, dataSource.createEntityManager());
  }

  async findByContext(
    companyId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    conceptKey: string,
    tableId: string,
  ): Promise<FilterPreset[]> {
    return this.applyContextFilters(
      this.createQueryBuilder('preset'),
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
    )
      .orderBy('preset.isDefault', 'DESC')
      .addOrderBy('preset.name', 'ASC')
      .getMany();
  }

  async findDefaultByContext(
    companyId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    conceptKey: string,
    tableId: string,
  ): Promise<FilterPreset | null> {
    return this.applyContextFilters(
      this.createQueryBuilder('preset'),
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
    )
      .andWhere('preset.isDefault = :isDefault', { isDefault: true })
      .getOne();
  }

  async findByIdAndOwner(
    id: string,
    companyId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
  ): Promise<FilterPreset | null> {
    return this.createQueryBuilder('preset')
      .where('preset.id = :id', { id })
      .andWhere('preset.companyId = :companyId', { companyId })
      .andWhere('preset.ownerType = :ownerType', { ownerType })
      .andWhere('preset.ownerId = :ownerId', { ownerId })
      .getOne();
  }

  async countByContext(
    companyId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    conceptKey: string,
    tableId: string,
  ): Promise<number> {
    return this.applyContextFilters(
      this.createQueryBuilder('preset'),
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
    ).getCount();
  }

  async clearDefaultInContext(
    companyId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    conceptKey: string,
    tableId: string,
  ): Promise<void> {
    await this.createQueryBuilder()
      .update(FilterPreset)
      .set({ isDefault: false })
      .where('companyId = :companyId', { companyId })
      .andWhere('ownerType = :ownerType', { ownerType })
      .andWhere('ownerId = :ownerId', { ownerId })
      .andWhere('conceptKey = :conceptKey', { conceptKey })
      .andWhere('tableId = :tableId', { tableId })
      .andWhere('isDefault = :isDefault', { isDefault: true })
      .execute();
  }

  async existsByNameInContext(
    companyId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    conceptKey: string,
    tableId: string,
    name: string,
  ): Promise<boolean> {
    const match = await this.applyContextFilters(
      this.createQueryBuilder('preset'),
      companyId,
      ownerType,
      ownerId,
      conceptKey,
      tableId,
    )
      .andWhere('LOWER(preset.name) = LOWER(:name)', { name })
      .select('preset.id', 'id')
      .limit(1)
      .getRawOne();

    return Boolean(match);
  }

  private applyContextFilters(
    query: SelectQueryBuilder<FilterPreset>,
    companyId: string,
    ownerType: FilterPresetOwnerType,
    ownerId: string,
    conceptKey: string,
    tableId: string,
  ): SelectQueryBuilder<FilterPreset> {
    return query
      .where('preset.companyId = :companyId', { companyId })
      .andWhere('preset.ownerType = :ownerType', { ownerType })
      .andWhere('preset.ownerId = :ownerId', { ownerId })
      .andWhere('preset.conceptKey = :conceptKey', { conceptKey })
      .andWhere('preset.tableId = :tableId', { tableId });
  }
}
