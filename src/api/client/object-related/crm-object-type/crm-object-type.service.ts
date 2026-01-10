import { Injectable } from '@nestjs/common';
import { CrmObjectTypeRepository } from '../../../repositories/postgres/object/crm-object-type.repository';
import { CrmObjectRepository } from '../../../repositories/postgres/object/crm-object.repository';
import { CrmObjectAssociationRepository } from '../../../repositories/postgres/object/crm-object-association.repository';
import { CrmAssociationTypeRepository } from '../../../repositories/postgres/object/crm-association-type.repository';
import { CreateCrmObjectTypeDto } from './dto/create-crm-object-type.dto';
import { UpdateCrmObjectTypeDto } from './dto/update-crm-object-type.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { GetAllObjectsResponseDto } from './dto/get-all-objects-response.dto';
import { GetAllQueryDto } from './dto/get-all-query.dto';
import { GetSingleObjectTypeDto } from './dto/get-single-object.dto';

@Injectable()
export class CrmObjectTypeService {
  constructor(
    private readonly repo: CrmObjectTypeRepository,
    private readonly crmObjectRepository: CrmObjectRepository,
    private readonly crmObjectAssociationRepository: CrmObjectAssociationRepository,
    private readonly crmAssociationTypeRepository: CrmAssociationTypeRepository,
  ) {}

  async getAllObjectTypes(
    dto: GetAllQueryDto,
    companyId,
  ): Promise<GetAllObjectsResponseDto> {
    return await this.repo.getAllObjectTypes(dto, companyId);
  }

  async createObject(dto: CreateCrmObjectTypeDto): Promise<string> {
    return await this.repo.createObject(dto);
  }

  async getSingleObject(id: string): Promise<GetSingleObjectTypeDto> {
    return await this.repo.getSingleObject(id);
  }

  async checkApiName(apiName: string): Promise<boolean> {
    return await this.repo.checkApiName(apiName);
  }



  async updateObject(
    id: string,
    dto: UpdateCrmObjectTypeDto,
  ): Promise<MessageResponseDto> {
    await this.repo.updateObjectById(id, dto);
    return { message: `Changes saved successfully.` };
  }

  async deleteObject(id: string): Promise<{ message: string }> {
    await this.crmObjectAssociationRepository.deleteAssociationsForObjectType(id);
    const associationTypeIds =
      await this.crmAssociationTypeRepository.getAssociationTypeIdsByObjectType(id);

    for (const typeId of associationTypeIds) {
      await this.crmAssociationTypeRepository.deleteAssociationTypeById(typeId);
    }

    await this.crmObjectRepository.deleteObjectsByType(id);

    await this.repo.deleteObjectById(id);
    return { message: `Deleted successfully.` };
  }

  async findById(id: string) {
    return await this.repo.findOne({
      where: { id },
    });
  }

}
