import { Injectable } from '@nestjs/common';
import { CrmAssociationTypeRepository } from '../../../repositories/postgres/object/crm-association-type.repository';
import { CreateCrmAssociationTypeDto } from './dto/create-crm-association-type.dto';
import { GetAllAssociationTypesResponseDto } from './dto/get-all-association-types-response.dto';
import { GetAllAssociationTypesQueryDto } from './dto/get-all-association-types-query.dto';
import { GetSingleAssociationTypeDto } from './dto/get-single-association-type.dto';
import { UpdateCrmAssociationTypeDto } from './dto/update-crm-association-type.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';

@Injectable()
export class CrmAssociationTypeService {
  constructor(
    private readonly crmAssociationTypeRepository: CrmAssociationTypeRepository,
  ) {}

  async getAllAssociationTypes(
    dto: GetAllAssociationTypesQueryDto,
    companyId: string,
  ): Promise<GetAllAssociationTypesResponseDto> {
    return this.crmAssociationTypeRepository.getAllAssociationTypes(dto, companyId);
  }

  async createAssociationType(dto: CreateCrmAssociationTypeDto): Promise<string> {
    return this.crmAssociationTypeRepository.createAssociationType(dto);
  }

  async getSingleAssociationType(id: string): Promise<GetSingleAssociationTypeDto> {
    return this.crmAssociationTypeRepository.getSingleAssociationType(id);
  }

  async checkApiName(apiName: string): Promise<boolean> {
    return this.crmAssociationTypeRepository.checkApiName(apiName);
  }

  async updateAssociationType(
    id: string,
    dto: UpdateCrmAssociationTypeDto,
  ): Promise<MessageResponseDto> {
    await this.crmAssociationTypeRepository.updateAssociationTypeById(id, dto);
    return { message: 'Changes saved successfully.' };
  }

  async deleteAssociationType(id: string): Promise<MessageResponseDto> {
    await this.crmAssociationTypeRepository.deleteAssociationTypeById(id);
    return { message: 'Deleted successfully.' };
  }
}
