import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmTemplateBlueprintFieldRepository } from '../../../repositories/postgres/template/crm-template-blueprint-field.repository';
import { CrmTemplateBlueprintObjectRepository } from '../../../repositories/postgres/template/crm-template-blueprint-object.repository';
import { CreateBlueprintFieldDto } from './dto/requests/create-blueprint-field.dto';
import { UpdateBlueprintFieldDto } from './dto/requests/update-blueprint-field.dto';
import { BulkCreateBlueprintFieldsDto } from './dto/requests/bulk-create-blueprint-fields.dto';
import { NormalizeFormulaDto } from './dto/requests/normalize-formula.dto';
import { BlueprintFieldResponseDto } from './dto/responses/blueprint-field-response.dto';
import { NormalizeFormulaResponseDto } from './dto/responses/normalize-formula-response.dto';
import { GetFormulaContextResponseDto } from './dto/responses/get-formula-context-response.dto';
import { GetBlueprintFieldsQueryDto } from './dto/requests/get-blueprint-fields-query.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmTemplateBlueprintField } from '../../../entities/template/crm-template-blueprint-field.entity';

@Injectable()
export class BlueprintFieldsService {
  constructor(
    private readonly blueprintFieldRepository: CrmTemplateBlueprintFieldRepository,
    private readonly blueprintObjectRepository: CrmTemplateBlueprintObjectRepository,
  ) {}

  async getAll(
    query: GetBlueprintFieldsQueryDto,
  ): Promise<BlueprintFieldResponseDto[]> {
    await this.ensureBlueprintObjectExists(query.blueprintObjectId);
    const fields = await this.blueprintFieldRepository.findByObjectId(
      query.blueprintObjectId,
    );
    return fields.map((field) => this.toResponse(field));
  }

  async getById(id: string): Promise<BlueprintFieldResponseDto> {
    const field = await this.blueprintFieldRepository.findOne({ where: { id } });
    if (!field) {
      throw new NotFoundException(
        `CRM template blueprint field with ID '${id}' not found`,
      );
    }

    return this.toResponse(field);
  }

  async create(dto: CreateBlueprintFieldDto): Promise<{ id: string }> {
    await this.ensureBlueprintObjectExists(dto.blueprintObjectId);
    const field = await this.blueprintFieldRepository.createField(dto);
    return { id: field.id };
  }

  async bulkCreate(dto: BulkCreateBlueprintFieldsDto): Promise<{ ids: string[] }> {
    await this.ensureBlueprintObjectExists(dto.blueprintObjectId);
    const fields = await this.blueprintFieldRepository.bulkCreateFields(
      dto.blueprintObjectId,
      dto.fields ?? [],
    );
    return { ids: fields.map((field) => field.id) };
  }

  async update(
    id: string,
    dto: UpdateBlueprintFieldDto,
  ): Promise<MessageResponseDto> {
    await this.blueprintFieldRepository.updateField(id, dto);
    return { message: 'Blueprint field updated successfully.' };
  }

  async delete(id: string): Promise<MessageResponseDto> {
    await this.blueprintFieldRepository.deleteField(id);
    return { message: 'Blueprint field deleted successfully.' };
  }

  async reorder(
    objectId: string,
    orderedIds: string[],
  ): Promise<MessageResponseDto> {
    await this.ensureBlueprintObjectExists(objectId);
    await this.blueprintFieldRepository.reorderFields(objectId, orderedIds);
    return { message: 'Blueprint fields reordered successfully.' };
  }

  /**
   * Normalize and validate a formula expression tree.
   * Uses sibling blueprint fields as the formula context.
   */
  async normalizeFormula(dto: NormalizeFormulaDto): Promise<NormalizeFormulaResponseDto> {
    await this.ensureBlueprintObjectExists(dto.blueprintObjectId);
    return this.blueprintFieldRepository.normalizeFormula(dto);
  }

  /**
   * Get formula context for a blueprint object.
   * Returns fields that can be referenced in formula expressions.
   */
  async getFormulaContext(objectId: string): Promise<GetFormulaContextResponseDto> {
    await this.ensureBlueprintObjectExists(objectId);
    return this.blueprintFieldRepository.getFormulaContext(objectId);
  }

  private toResponse(field: CrmTemplateBlueprintField): BlueprintFieldResponseDto {
    return {
      id: field.id,
      blueprintObjectId: field.blueprintObjectId,
      name: field.name,
      apiName: field.apiName,
      fieldType: field.fieldType,
      description: field.description ?? null,
      isRequired: field.isRequired ?? false,
      shape: field.shape,
      configShape: field.configShape,
      protection: field.protection,
      displayOrder: field.displayOrder,
      createdAt: field.createdAt,
    };
  }

  private async ensureBlueprintObjectExists(objectId: string): Promise<void> {
    const blueprintObject = await this.blueprintObjectRepository.findOne({
      where: { id: objectId },
      select: ['id'],
    });
    if (!blueprintObject) {
      throw new NotFoundException(
        `CRM template blueprint object with ID '${objectId}' not found`,
      );
    }
  }
}
