import {
  Injectable,
} from '@nestjs/common';
import { CrmObjectFieldRepository } from '../../../repositories/postgres/object/crm-object-field.repository';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { CreateCrmObjectFieldDto } from './dto/create-crm-object-field.dto';
import { UpdateCrmObjectFieldDto } from './dto/update-crm-object-field.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { GetAllQueryDto } from '../crm-object-type/dto/get-all-query.dto';
import { GetAllFieldsResponseDto } from './dto/get-all-fields-response.dto';
import { NormalizeFormulaDto } from './dto/normalize-formula.dto';
import { UpdateFormulaConfigDto } from './dto/update-formula-config.dto';
import { GetFormulaContextResponseDto } from './dto/get-formula-context-response.dto';
import { NormalizeFormulaResponseDto } from './dto/normalize-formula-response.dto';

@Injectable()
export class CrmObjectFieldService {
  constructor(
    private readonly repo: CrmObjectFieldRepository,
  ) {}

  async getFormulaContext(
    objectTypeId: string,
  ): Promise<GetFormulaContextResponseDto> {
    return await this.repo.getFormulaContext(objectTypeId);
  }

  async createField(dto: CreateCrmObjectFieldDto): Promise<CrmObjectField> {
    return await this.repo.createField(dto);
  }

  async checkApiName(apiName: string): Promise<boolean> {
    return await this.repo.checkApiName(apiName);
  }

  async updateField(id: string, dto: UpdateCrmObjectFieldDto): Promise<MessageResponseDto> {
    await this.repo.updateFieldById(id, dto);
    return { message: `Changes saved successfully.` };
  }

  async updateFormulaConfig(id: string, dto: UpdateFormulaConfigDto): Promise<CrmObjectField> {
    return await this.repo.updateFormulaConfig(id, dto);
  }

  async deleteField(id: string): Promise<MessageResponseDto> {
    await this.repo.deleteFieldById(id);
    return { message: `Deleted successfully.` };
  }


  async getFieldsByObjectType(
    objectTypeId: string,
    dto: GetAllQueryDto,
  ):Promise<GetAllFieldsResponseDto> {
    return await this.repo.getFieldsByObjectType(objectTypeId, dto);
  }

  async normalizeFormula(dto: NormalizeFormulaDto): Promise<NormalizeFormulaResponseDto> {
    return await this.repo.normalizeFormula(dto);
  }
}
