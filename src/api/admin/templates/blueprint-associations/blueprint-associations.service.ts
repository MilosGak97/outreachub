import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmTemplateBlueprintAssociationRepository } from '../../../repositories/postgres/template/crm-template-blueprint-association.repository';
import { CrmTemplateModuleRepository } from '../../../repositories/postgres/template/crm-template-module.repository';
import { CreateBlueprintAssociationDto } from './dto/requests/create-blueprint-association.dto';
import { UpdateBlueprintAssociationDto } from './dto/requests/update-blueprint-association.dto';
import { BlueprintAssociationResponseDto } from './dto/responses/blueprint-association-response.dto';
import { GetBlueprintAssociationsQueryDto } from './dto/requests/get-blueprint-associations-query.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmTemplateBlueprintAssociation } from '../../../entities/template/crm-template-blueprint-association.entity';

@Injectable()
export class BlueprintAssociationsService {
  constructor(
    private readonly moduleRepository: CrmTemplateModuleRepository,
    private readonly blueprintAssociationRepository: CrmTemplateBlueprintAssociationRepository,
  ) {}

  async getAll(
    query: GetBlueprintAssociationsQueryDto,
  ): Promise<BlueprintAssociationResponseDto[]> {
    await this.ensureModuleFound(query.moduleId);
    const associations = await this.blueprintAssociationRepository.findByModuleId(
      query.moduleId,
    );
    return associations.map((association) => this.toResponse(association));
  }

  async getById(id: string): Promise<BlueprintAssociationResponseDto> {
    const association = await this.blueprintAssociationRepository.findOne({
      where: { id },
    });
    if (!association) {
      throw new NotFoundException(
        `CRM template blueprint association with ID '${id}' not found`,
      );
    }

    return this.toResponse(association);
  }

  async create(dto: CreateBlueprintAssociationDto): Promise<{ id: string }> {
    const association = await this.blueprintAssociationRepository.createAssociation(dto);
    return { id: association.id };
  }

  async update(
    id: string,
    dto: UpdateBlueprintAssociationDto,
  ): Promise<MessageResponseDto> {
    await this.blueprintAssociationRepository.updateAssociation(id, dto);
    return { message: 'Blueprint association updated successfully.' };
  }

  async delete(id: string): Promise<MessageResponseDto> {
    await this.blueprintAssociationRepository.deleteAssociation(id);
    return { message: 'Blueprint association deleted successfully.' };
  }

  private toResponse(
    association: CrmTemplateBlueprintAssociation,
  ): BlueprintAssociationResponseDto {
    return {
      id: association.id,
      moduleId: association.moduleId,
      name: association.name,
      apiName: association.apiName,
      sourceObjectApiName: association.sourceObjectApiName,
      targetObjectApiName: association.targetObjectApiName,
      sourceCardinality: association.sourceCardinality,
      targetCardinality: association.targetCardinality,
      isBidirectional: association.isBidirectional,
      reverseName: association.reverseName ?? null,
      description: association.description ?? null,
      protection: association.protection,
      displayOrder: association.displayOrder,
      createdAt: association.createdAt,
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
