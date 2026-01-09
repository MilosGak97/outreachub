import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmTemplateModuleRepository } from '../../../repositories/postgres/template/crm-template-module.repository';
import { CrmTemplateBlueprintObjectRepository } from '../../../repositories/postgres/template/crm-template-blueprint-object.repository';
import { CrmTemplateBlueprintFieldRepository } from '../../../repositories/postgres/template/crm-template-blueprint-field.repository';
import { CreateBlueprintObjectDto } from './dto/requests/create-blueprint-object.dto';
import { UpdateBlueprintObjectDto } from './dto/requests/update-blueprint-object.dto';
import { BlueprintObjectResponseDto } from './dto/responses/blueprint-object-response.dto';
import { GetBlueprintObjectsQueryDto } from './dto/requests/get-blueprint-objects-query.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmTemplateBlueprintObject } from '../../../entities/template/crm-template-blueprint-object.entity';

@Injectable()
export class BlueprintObjectsService {
  constructor(
    private readonly moduleRepository: CrmTemplateModuleRepository,
    private readonly blueprintObjectRepository: CrmTemplateBlueprintObjectRepository,
    private readonly blueprintFieldRepository: CrmTemplateBlueprintFieldRepository,
  ) {}

  async getAll(
    query: GetBlueprintObjectsQueryDto,
  ): Promise<BlueprintObjectResponseDto[]> {
    await this.ensureModuleFound(query.moduleId);
    const objects = await this.blueprintObjectRepository.findByModuleId(query.moduleId);
    return objects.map((object) =>
      this.toResponse(object, object.fields?.length ?? 0),
    );
  }

  async getById(id: string): Promise<BlueprintObjectResponseDto> {
    const object = await this.blueprintObjectRepository.findOne({ where: { id } });
    if (!object) {
      throw new NotFoundException(
        `CRM template blueprint object with ID '${id}' not found`,
      );
    }

    const fieldsCount = await this.blueprintFieldRepository.count({
      where: { blueprintObjectId: id },
    });

    return this.toResponse(object, fieldsCount);
  }

  async getWithFields(id: string): Promise<CrmTemplateBlueprintObject> {
    const object = await this.blueprintObjectRepository.findWithFields(id);
    if (!object) {
      throw new NotFoundException(
        `CRM template blueprint object with ID '${id}' not found`,
      );
    }

    return object;
  }

  async create(dto: CreateBlueprintObjectDto): Promise<{ id: string }> {
    await this.ensureModuleFound(dto.moduleId);
    const object = await this.blueprintObjectRepository.createObject(dto);
    return { id: object.id };
  }

  async update(
    id: string,
    dto: UpdateBlueprintObjectDto,
  ): Promise<MessageResponseDto> {
    await this.blueprintObjectRepository.updateObject(id, dto);
    return { message: 'Blueprint object updated successfully.' };
  }

  async delete(id: string): Promise<MessageResponseDto> {
    await this.blueprintObjectRepository.deleteObject(id);
    return { message: 'Blueprint object deleted successfully.' };
  }

  async reorder(
    moduleId: string,
    orderedIds: string[],
  ): Promise<MessageResponseDto> {
    await this.ensureModuleFound(moduleId);
    await this.blueprintObjectRepository.reorderObjects(moduleId, orderedIds);
    return { message: 'Blueprint objects reordered successfully.' };
  }

  private toResponse(
    object: CrmTemplateBlueprintObject,
    fieldsCount: number,
  ): BlueprintObjectResponseDto {
    return {
      id: object.id,
      moduleId: object.moduleId,
      name: object.name,
      apiName: object.apiName,
      description: object.description ?? null,
      protection: object.protection,
      displayOrder: object.displayOrder,
      fieldsCount,
      createdAt: object.createdAt,
    };
  }

  private async ensureModuleFound(moduleId: string): Promise<void> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      select: ['id'],
    });
    if (!module) {
      throw new NotFoundException(`CRM template module with ID '${moduleId}' not found`);
    }
  }
}
