import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmObjectAssociationRepository } from '../../../repositories/postgres/object/crm-object-association.repository';
import { AssociationCardinality } from '../../../enums/object/association-cardinality.enum';
import { CreateCrmObjectAssociationDto } from './dto/requests/create-association.dto';
import { GetAssociationsQueryDto } from './dto/requests/get-associations-query.dto';
import {
  BulkCreateAssociationsDto,
  BulkDeleteAssociationsDto,
} from './dto/requests/bulk-associations.dto';
import { CrmObjectAssociationResponseDto } from './dto/responses/association-response.dto';
import { AssociationListResponseDto } from './dto/responses/association-list-response.dto';
import {
  ObjectAssociationsResponseDto,
  AssociationTypeGroupDto,
  LinkedObjectDto,
} from './dto/responses/object-associations-response.dto';
import {
  BulkCreateAssociationsResponseDto,
  BulkDeleteAssociationsResponseDto,
  BulkAssociationResultItemDto,
} from './dto/responses/bulk-association-response.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmObjectAssociation } from '../../../entities/object/crm-object-association.entity';

export enum AssociationErrorCode {
  TYPE_NOT_FOUND = 'ASSOCIATION_TYPE_NOT_FOUND',
  OBJECT_NOT_FOUND = 'OBJECT_NOT_FOUND',
  ASSOCIATION_NOT_FOUND = 'ASSOCIATION_NOT_FOUND',
  ALREADY_EXISTS = 'ASSOCIATION_ALREADY_EXISTS',
  CARDINALITY_VIOLATION = 'CARDINALITY_VIOLATION',
  SELF_ASSOCIATION = 'SELF_ASSOCIATION_NOT_ALLOWED',
  INVALID_OBJECT_TYPE = 'INVALID_OBJECT_TYPE_FOR_ASSOCIATION',
}

@Injectable()
export class CrmObjectAssociationService {
  constructor(
    private readonly crmObjectAssociationRepository: CrmObjectAssociationRepository,
  ) {}

  async createAssociation(
    dto: CreateCrmObjectAssociationDto,
  ): Promise<CrmObjectAssociationResponseDto> {
    const { typeId, sourceObjectId, targetObjectId, metadata } = dto;

    // Check for self-association
    if (sourceObjectId === targetObjectId) {
      throw new BadRequestException({
        code: AssociationErrorCode.SELF_ASSOCIATION,
        message: 'An object cannot be associated with itself',
      });
    }

    // Get association type and validate
    const assocType = await this.crmObjectAssociationRepository.findAssociationTypeOrThrow(typeId);

    // Get objects and validate types match the association type
    const sourceObject = await this.crmObjectAssociationRepository.findObjectOrThrow(sourceObjectId);
    const targetObject = await this.crmObjectAssociationRepository.findObjectOrThrow(targetObjectId);

    if (sourceObject.objectType.id !== assocType.sourceObjectType.id) {
      throw new BadRequestException({
        code: AssociationErrorCode.INVALID_OBJECT_TYPE,
        message: `Source object type "${sourceObject.objectType.apiName}" does not match association type's expected source "${assocType.sourceObjectType.apiName}"`,
      });
    }

    if (targetObject.objectType.id !== assocType.targetObjectType.id) {
      throw new BadRequestException({
        code: AssociationErrorCode.INVALID_OBJECT_TYPE,
        message: `Target object type "${targetObject.objectType.apiName}" does not match association type's expected target "${assocType.targetObjectType.apiName}"`,
      });
    }

    // Check if association already exists
    const exists = await this.crmObjectAssociationRepository.existsAssociation(
      typeId,
      sourceObjectId,
      targetObjectId,
    );

    if (exists) {
      throw new BadRequestException({
        code: AssociationErrorCode.ALREADY_EXISTS,
        message: 'This association already exists',
      });
    }

    // Check cardinality constraints
    await this.validateCardinality(assocType, sourceObjectId, targetObjectId);

    // Create the association
    const association = await this.crmObjectAssociationRepository.createAssociation(
      typeId,
      sourceObjectId,
      targetObjectId,
      metadata,
    );

    // If bidirectional, create reverse association
    if (assocType.isBidirectional) {
      const reverseAssoc = await this.crmObjectAssociationRepository.createAssociation(
        typeId,
        targetObjectId,
        sourceObjectId,
        metadata,
      );

      // Link them together
      association.reverseOf = reverseAssoc;
      reverseAssoc.reverseOf = association;
      await this.crmObjectAssociationRepository.save([association, reverseAssoc]);
    }

    return this.toResponseDto(association);
  }

  async getAssociation(id: string): Promise<CrmObjectAssociationResponseDto> {
    const assoc = await this.crmObjectAssociationRepository.getAssociationByIdOrThrow(id);
    return this.toResponseDto(assoc);
  }

  async getAssociations(dto: GetAssociationsQueryDto): Promise<AssociationListResponseDto> {
    return await this.crmObjectAssociationRepository.getAssociations(dto);
  }

  async getAssociationsForObject(
    objectId: string,
    typeId?: string,
  ): Promise<ObjectAssociationsResponseDto> {
    await this.crmObjectAssociationRepository.findObjectOrThrow(objectId);

    const associations = await this.crmObjectAssociationRepository.getAssociationsForObject(
      objectId,
      typeId,
    );

    // Group by association type and role
    const groupMap = new Map<string, AssociationTypeGroupDto>();

    for (const assoc of associations) {
      const isSource = assoc.sourceObject.id === objectId;
      const role: 'source' | 'target' = isSource ? 'source' : 'target';
      const key = `${assoc.type.id}-${role}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          typeId: assoc.type.id,
          typeName: role === 'source' ? assoc.type.name : (assoc.type.reverseName || assoc.type.name),
          typeApiName: assoc.type.apiName,
          role,
          label: role === 'source' ? assoc.type.name : (assoc.type.reverseName || assoc.type.name),
          linkedObjects: [],
          total: 0,
        });
      }

      const group = groupMap.get(key)!;
      group.total++;

      const linkedObject: LinkedObjectDto = {
        associationId: assoc.id,
        objectId: isSource ? assoc.targetObject.id : assoc.sourceObject.id,
        displayName: isSource ? assoc.targetObject.displayName : assoc.sourceObject.displayName,
        objectTypeApiName: isSource
          ? assoc.targetObject.objectType?.apiName || ''
          : assoc.sourceObject.objectType?.apiName || '',
        objectTypeName: isSource
          ? assoc.targetObject.objectType?.name || ''
          : assoc.sourceObject.objectType?.name || '',
        metadata: assoc.metadata,
        associatedAt: assoc.createdAt.toISOString(),
      };

      group.linkedObjects.push(linkedObject);
    }

    return {
      objectId,
      associationGroups: Array.from(groupMap.values()),
    };
  }

  async deleteAssociation(id: string): Promise<MessageResponseDto> {
    await this.crmObjectAssociationRepository.deleteAssociation(id);
    return { message: 'Association deleted successfully' };
  }

  async bulkCreateAssociations(
    dto: BulkCreateAssociationsDto,
  ): Promise<BulkCreateAssociationsResponseDto> {
    const results: BulkAssociationResultItemDto[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < dto.associations.length; i++) {
      const item = dto.associations[i];

      try {
        const assoc = await this.createAssociation({
          typeId: item.typeId,
          sourceObjectId: dto.sourceObjectId,
          targetObjectId: item.targetObjectId,
          metadata: item.metadata,
        });

        results.push({ index: i, success: true, id: assoc.id });
        successful++;
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      total: dto.associations.length,
      successful,
      failed,
      results,
    };
  }

  async bulkDeleteAssociations(
    dto: BulkDeleteAssociationsDto,
  ): Promise<BulkDeleteAssociationsResponseDto> {
    const results: BulkAssociationResultItemDto[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < dto.associationIds.length; i++) {
      const id = dto.associationIds[i];

      try {
        await this.crmObjectAssociationRepository.deleteAssociation(id);
        results.push({ index: i, success: true, id });
        successful++;
      } catch (error) {
        results.push({
          index: i,
          success: false,
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      total: dto.associationIds.length,
      successful,
      failed,
      results,
    };
  }

  private async validateCardinality(
    assocType: { sourceCardinality: AssociationCardinality; targetCardinality: AssociationCardinality; id: string },
    sourceObjectId: string,
    targetObjectId: string,
  ): Promise<void> {
    // sourceCardinality = ONE means the source can only link to ONE target
    // (i.e., how many targets can a source have)
    if (assocType.sourceCardinality === AssociationCardinality.ONE) {
      const existingFromSource = await this.crmObjectAssociationRepository.countAssociationsForRole(
        assocType.id,
        sourceObjectId,
        'source',
      );

      if (existingFromSource > 0) {
        throw new BadRequestException({
          code: AssociationErrorCode.CARDINALITY_VIOLATION,
          message: 'Source object already has a linked target (cardinality ONE)',
        });
      }
    }

    // targetCardinality = ONE means the target can only have ONE source
    // (i.e., how many sources can link to a target)
    if (assocType.targetCardinality === AssociationCardinality.ONE) {
      const existingToTarget = await this.crmObjectAssociationRepository.countAssociationsForRole(
        assocType.id,
        targetObjectId,
        'target',
      );

      if (existingToTarget > 0) {
        throw new BadRequestException({
          code: AssociationErrorCode.CARDINALITY_VIOLATION,
          message: 'Target object already has a linked source (cardinality ONE)',
        });
      }
    }
  }

  private toResponseDto(assoc: CrmObjectAssociation): CrmObjectAssociationResponseDto {
    return {
      id: assoc.id,
      typeId: assoc.type?.id || '',
      typeName: assoc.type?.name || '',
      typeApiName: assoc.type?.apiName || '',
      sourceObjectId: assoc.sourceObject?.id || '',
      sourceObjectDisplayName: assoc.sourceObject?.displayName || '',
      sourceObjectTypeApiName: assoc.sourceObject?.objectType?.apiName || '',
      targetObjectId: assoc.targetObject?.id || '',
      targetObjectDisplayName: assoc.targetObject?.displayName || '',
      targetObjectTypeApiName: assoc.targetObject?.objectType?.apiName || '',
      metadata: assoc.metadata,
      createdAt: assoc.createdAt?.toISOString() || '',
    };
  }
}
