import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CrmObjectFieldService } from './crm-object-field.service';
import { AuthGuard } from '../../auth/guards';
import { CreateCrmObjectFieldDto } from './dto/create-crm-object-field.dto';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FieldRegistry } from './field-types';
import { FieldType } from './field-types/field-type.enum';
import { UpdateCrmObjectFieldDto } from './dto/update-crm-object-field.dto';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { FieldTypeDefinitionDto } from '../crm-object-type/dto/field-type-definition.dto';
import { FIELD_TYPE_LABELS, FIELD_TYPE_DESCRIPTIONS } from './metadata/field-type-metadata';
import { GetAllQueryDto } from '../crm-object-type/dto/get-all-query.dto';
import { GetAllFieldsResponseDto } from './dto/get-all-fields-response.dto';
import { GetFieldTypeDefinitionDto } from './dto/get-field-type-definition.dto';
import { NormalizeFormulaDto } from './dto/normalize-formula.dto';
import { UpdateFormulaConfigDto } from './dto/update-formula-config.dto';
import { NormalizeFormulaResponseDto } from './dto/normalize-formula-response.dto';
import { GetFormulaCategoryToFunctionsQueryDto } from './dto/get-formula-category-to-functions-query.dto';
import { FormulaCategoryToFunctionsDto } from './dto/formula-category-to-functions.dto';
import { GetFormulaFunctionsQueryDto } from './dto/get-formula-functions-query.dto';
import { FormulaFunctionDefinitionDto } from './dto/formula-function-definition.dto';
import { GetFormulaContextResponseDto } from './dto/get-formula-context-response.dto';
import { FormulaMetadataService } from './formula/formula-metadata.service';
import { FormulaCategory } from './formula/formula-category.enum';
import { FormulaCategoryResponseDto } from './dto/formula-category-response.dto';


@ApiTags('Crm Object Field')
@ApiExtraModels(FieldTypeDefinitionDto)
@Controller('crm-object-field')
export class CrmObjectFieldController {
  constructor(
    private readonly service: CrmObjectFieldService,
    private readonly formulaMetadataService: FormulaMetadataService,
  ) {}



  @ApiOperation({ summary: 'Create crm object field' })
  @ApiOkResponse({ description: 'Returns just created object field', type: CrmObjectField })
  @UseGuards(AuthGuard)
  @Post()
  async createField(@Body() dto: CreateCrmObjectFieldDto): Promise<CrmObjectField> {
    return this.service.createField(dto);
  }

  @ApiOperation({ summary: 'Normalize a formula expressionTree into canonical form' })
  @ApiOkResponse({
    description: 'Returns normalized formula tree/config with validation status',
    type: NormalizeFormulaResponseDto,
  })
  @UseGuards(AuthGuard)
  @Post('formula/normalize')
  async normalizeFormula(@Body() dto: NormalizeFormulaDto): Promise<NormalizeFormulaResponseDto> {
    return this.service.normalizeFormula(dto);
  }


  @ApiOperation({ summary: 'Get formula categories' })
  @ApiOkResponse({ type: FormulaCategoryResponseDto })
  @Get('formula/categories')
  async getFormulaCategories(): Promise<FormulaCategoryResponseDto> {
    return this.formulaMetadataService.getFormulaCategories();
  }

  @ApiOperation({ summary: 'Get formula category-to-functions mapping' })
  @ApiOkResponse({
    description: 'Returns a mapping of formula categories to the function names available in each category',
    type: FormulaCategoryToFunctionsDto,
  })
  @Get('formula/category-to-functions')
  async getFormulaCategoryToFunctions(
    @Query() query: GetFormulaCategoryToFunctionsQueryDto,
  ): Promise<FormulaCategoryToFunctionsDto> {
    return this.formulaMetadataService.getFormulaCategoryToFunctions(query.categories);
  }

  @ApiOperation({ summary: 'Get formula functions metadata' })
  @ApiOkResponse({
    description: 'Returns supported formula functions and their argument signatures',
    type: [FormulaFunctionDefinitionDto],
  })
  @Get('formula/functions')
  async getFormulaFunctions(
    @Query() query: GetFormulaFunctionsQueryDto,
  ): Promise<FormulaFunctionDefinitionDto[]> {
    return this.formulaMetadataService.getFormulaFunctions(query.category, query.name);
  }

  @ApiOperation({ summary: 'Get formula context for an object type' })
  @ApiOkResponse({
    description: 'Returns formula-usable fields and primitive type hints (apiName -> type)',
    type: GetFormulaContextResponseDto,
  })
  @UseGuards(AuthGuard)
  @Get('formula/context/:objectTypeId')
  getFormulaContext(
    @Param('objectTypeId', new ParseUUIDPipe({ version: '4' }))
    objectTypeId: string,
  ):Promise<GetFormulaContextResponseDto> {
    return this.service.getFormulaContext(objectTypeId);
  }

  @ApiOperation({summary: 'Check api_name availability'})
  @ApiOkResponse({ description: 'Returns true if api name is available', type: Boolean })
  @UseGuards(AuthGuard)
  @Get('api-name/:value')
  async checkApiNameAvailability(@Param('value') value: string): Promise<boolean> {
    return this.service.checkApiName(value);
  }


  @ApiOperation({ summary: 'Update CRM object field (name, description, or isRequired)' })
  @ApiOkResponse({ description: 'Returns successful message about updating object field', type: MessageResponseDto })
  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateField(
    @Param('id') id: string,
    @Body() dto: UpdateCrmObjectFieldDto,
  ): Promise<MessageResponseDto> {
    return this.service.updateField(id, dto);
  }

  @ApiOperation({ summary: 'Update formula config for a formula field' })
  @ApiOkResponse({ description: 'Returns updated field', type: CrmObjectField })
  @UseGuards(AuthGuard)
  @Patch(':id/formula')
  async updateFormulaConfig(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateFormulaConfigDto,
  ): Promise<CrmObjectField> {
    return this.service.updateFormulaConfig(id, dto);
  }

  @ApiOperation({ summary: 'Delete CRM object field by ID' })
  @ApiOkResponse({ description: 'Returns successful message about deleting object field', type: MessageResponseDto })
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteField(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.service.deleteField(id);
  }


  @ApiOperation({ summary: 'Get Field Types Definition(s)' })
  @ApiOkResponse({
    description: 'Returns a map of field type definitions keyed by field type.',
    schema: {
      type: 'object',
      additionalProperties: { $ref: getSchemaPath(FieldTypeDefinitionDto) },
    },
  })
  @Get('definition')
  async getFieldTypeDefinitions(
    @Query() dto?: GetFieldTypeDefinitionDto,
  ): Promise<Record<string, FieldTypeDefinitionDto>> {
    if (!dto?.type) {
      return this.buildFieldTypeDefinitionMap();
    }

    return {
      [dto.type]: this.buildFieldTypeDefinition(dto.type),
    };
  }

  private buildFieldTypeDefinitionMap(): Record<string, FieldTypeDefinitionDto> {
    return Object.values(FieldType).reduce<Record<string, FieldTypeDefinitionDto>>(
      (acc, fieldType) => {
        acc[fieldType] = this.buildFieldTypeDefinition(fieldType);
        return acc;
      },
      {},
    );
  }

  private buildFieldTypeDefinition(type: FieldType): FieldTypeDefinitionDto {
    const meta = FieldRegistry[type];
    return {
      type,
      label: FIELD_TYPE_LABELS[type],
      description: FIELD_TYPE_DESCRIPTIONS[type],
      ...(meta?.shape ? { shape: meta.shape } : {}),
      ...(meta?.configShape ? { configShape: meta.configShape } : {}),
      ...(meta?.isFormulaCapable !== undefined ? { isFormulaCapable: meta.isFormulaCapable } : {}),
      ...(meta?.isUsableInFormula !== undefined ? { isUsableInFormula: meta.isUsableInFormula } : {}),
    };
  }


  @ApiOperation({ summary: 'Get all fields for a CRM object type' })
  @ApiOkResponse({ description: 'Returns all fields belonging to the specified CRM object type', type: GetAllFieldsResponseDto })
  @UseGuards(AuthGuard)
  @Get(':id/fields')
  async getFieldsByObjectType(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() dto: GetAllQueryDto,
  ):Promise<GetAllFieldsResponseDto> {
    return this.service.getFieldsByObjectType(id, dto);
  }
}
