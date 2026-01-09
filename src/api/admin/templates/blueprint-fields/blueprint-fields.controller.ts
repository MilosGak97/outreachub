import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { BlueprintFieldsService } from './blueprint-fields.service';
import { GetBlueprintFieldsQueryDto } from './dto/requests/get-blueprint-fields-query.dto';
import { BlueprintFieldResponseDto } from './dto/responses/blueprint-field-response.dto';
import { CreateBlueprintFieldDto } from './dto/requests/create-blueprint-field.dto';
import { BulkCreateBlueprintFieldsDto } from './dto/requests/bulk-create-blueprint-fields.dto';
import { UpdateBlueprintFieldDto } from './dto/requests/update-blueprint-field.dto';
import { NormalizeFormulaDto } from './dto/requests/normalize-formula.dto';
import { NormalizeFormulaResponseDto } from './dto/responses/normalize-formula-response.dto';
import { GetFormulaContextResponseDto } from './dto/responses/get-formula-context-response.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { FormulaMetadataService } from '../../../client/object-related/crm-object-field/formula/formula-metadata.service';
import { FormulaCategoryResponseDto } from '../../../client/object-related/crm-object-field/dto/formula-category-response.dto';
import { FormulaCategoryToFunctionsDto } from '../../../client/object-related/crm-object-field/dto/formula-category-to-functions.dto';
import { FormulaFunctionDefinitionDto } from '../../../client/object-related/crm-object-field/dto/formula-function-definition.dto';
import { GetFormulaCategoryToFunctionsQueryDto } from '../../../client/object-related/crm-object-field/dto/get-formula-category-to-functions-query.dto';
import { GetFormulaFunctionsQueryDto } from '../../../client/object-related/crm-object-field/dto/get-formula-functions-query.dto';

/**
 * # Templates - Blueprint Fields
 *
 * Blueprint fields define the properties/columns that will be created
 * on CRM objects when a module is installed.
 *
 * ## Field Types:
 * - **text**: Single line text
 * - **textarea**: Multi-line text
 * - **number**: Numeric values
 * - **currency**: Money values with currency
 * - **date/datetime**: Date and time values
 * - **email/phone/url**: Validated formats
 * - **select/multiselect**: Dropdown options
 * - **boolean**: True/false toggle
 * - **formula**: Calculated fields
 *
 * ## API Name Convention:
 * - Start with `_` for template-managed fields (protected)
 * - Without `_` for user-modifiable fields
 */
@ApiTags('templates/blueprint-fields')
@ApiBearerAuth()
@Controller('admin/templates/blueprint-fields')
@UseGuards(AdminAuthGuard)
export class BlueprintFieldsController {
  constructor(
    private readonly blueprintFieldsService: BlueprintFieldsService,
    private readonly formulaMetadataService: FormulaMetadataService,
  ) {}

  @ApiOperation({
    summary: 'List blueprint fields',
    description: `Fetch blueprint fields for an object.

**Use this to:**
- Display field list in object builder UI
- See what fields an object will have when installed
- Validate field configuration

**Filter by:**
- \`objectId\`: Required - get fields for a specific object
`,
  })
  @ApiOkResponse({ type: [BlueprintFieldResponseDto] })
  @Get()
  async getFields(
    @Query() query: GetBlueprintFieldsQueryDto,
  ): Promise<BlueprintFieldResponseDto[]> {
    return this.blueprintFieldsService.getAll(query);
  }

  @ApiOperation({
    summary: 'Create a blueprint field',
    description: `Add a new field definition to a blueprint object.

**Use this to:**
- Define properties for a CRM object (e.g., "email", "status")
- Configure field type, validation, and options

**Field configuration:**
- \`fieldType\`: The data type (text, number, select, etc.)
- \`config\`: Type-specific settings (options for select, format for date, etc.)
- \`isRequired\`: Whether the field must have a value
- \`protection\`: Level of protection from user modification

**API name rules:**
- Start with \`_\` for template-managed (e.g., \`_status\`)
- Lowercase, underscores allowed, no spaces
- Must be unique within the object
`,
  })
  @ApiBody({ type: CreateBlueprintFieldDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
  })
  @Post()
  async createField(
    @Body() dto: CreateBlueprintFieldDto,
  ): Promise<{ id: string }> {
    return this.blueprintFieldsService.create(dto);
  }

  @ApiOperation({
    summary: 'Bulk create blueprint fields',
    description: `Create multiple fields at once for a blueprint object.

**Use this to:**
- Quickly add multiple fields when building an object
- Import field definitions from a template
- Speed up template creation workflow

**All fields must:**
- Belong to the same object (\`objectId\`)
- Have unique \`apiName\` values within the object
`,
  })
  @ApiBody({ type: BulkCreateBlueprintFieldsDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          example: ['field-id-1', 'field-id-2', 'field-id-3'],
        },
      },
    },
  })
  @Post('bulk')
  async bulkCreateFields(
    @Body() dto: BulkCreateBlueprintFieldsDto,
  ): Promise<{ ids: string[] }> {
    return this.blueprintFieldsService.bulkCreate(dto);
  }

  @ApiOperation({
    summary: 'Normalize a formula expression tree',
    description: `Validate and normalize a formula expression tree for blueprint context.

**Use this to:**
- Validate formula syntax before saving
- Get normalized formula configuration
- Check field references are valid

**How it works:**
1. Pass the blueprint object ID and expression tree
2. System validates against sibling fields in that object
3. Returns normalized config or validation errors

**Example expression tree:**
\`\`\`json
{
  "type": "function",
  "name": "ADD",
  "args": [
    { "type": "field", "ref": "_price" },
    { "type": "field", "ref": "_tax" }
  ]
}
\`\`\`
`,
  })
  @ApiBody({ type: NormalizeFormulaDto })
  @ApiOkResponse({
    description: 'Returns normalized formula config with validation status',
    type: NormalizeFormulaResponseDto,
  })
  @Post('formula/normalize')
  async normalizeFormula(@Body() dto: NormalizeFormulaDto): Promise<NormalizeFormulaResponseDto> {
    return this.blueprintFieldsService.normalizeFormula(dto);
  }

  @ApiOperation({
    summary: 'Get formula context for blueprint object',
    description: `Get fields that can be used in formula expressions.

**Use this to:**
- Populate field picker in formula builder UI
- Get type information for formula validation
- Show available fields when creating formula fields

**Returns:**
- List of fields usable in formulas (excludes formula fields themselves)
- Field type mapping for formula validation
`,
  })
  @ApiParam({ name: 'objectId', description: 'Blueprint object UUID' })
  @ApiOkResponse({
    description: 'Returns formula context with usable fields',
    type: GetFormulaContextResponseDto,
  })
  @Get('formula/context/:objectId')
  async getFormulaContext(
    @Param('objectId', new ParseUUIDPipe({ version: '4' })) objectId: string,
  ): Promise<GetFormulaContextResponseDto> {
    return this.blueprintFieldsService.getFormulaContext(objectId);
  }

  @ApiOperation({
    summary: 'Get formula categories',
    description: `Get available formula categories (MATH, TEXT, DATE, etc.).

**Use this to:**
- Populate category dropdown in formula builder UI
- Show users what types of formulas they can create
`,
  })
  @ApiOkResponse({
    description: 'Returns list of available formula categories',
    type: FormulaCategoryResponseDto,
  })
  @Get('formula/categories')
  async getFormulaCategories(): Promise<FormulaCategoryResponseDto> {
    return this.formulaMetadataService.getFormulaCategories();
  }

  @ApiOperation({
    summary: 'Get formula category-to-functions mapping',
    description: `Get mapping of formula categories to their available functions.

**Use this to:**
- Show available functions grouped by category
- Build function picker in formula UI
- Filter functions by category

**Example response:**
\`\`\`json
{
  "MATH": ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE"],
  "TEXT": ["CONCAT", "UPPER", "LOWER", "TRIM"]
}
\`\`\`
`,
  })
  @ApiOkResponse({
    description: 'Returns mapping of categories to function names',
    type: FormulaCategoryToFunctionsDto,
  })
  @Get('formula/category-to-functions')
  async getFormulaCategoryToFunctions(
    @Query() query: GetFormulaCategoryToFunctionsQueryDto,
  ): Promise<FormulaCategoryToFunctionsDto> {
    return this.formulaMetadataService.getFormulaCategoryToFunctions(query.categories);
  }

  @ApiOperation({
    summary: 'Get formula functions metadata',
    description: `Get detailed metadata for formula functions.

**Use this to:**
- Display function signatures in formula UI
- Show argument types and descriptions
- Provide inline help when building formulas

**Can filter by:**
- \`category\`: Get functions for a specific category
- \`name\`: Get details for a specific function

**Response includes:**
- Function name
- Category
- Description
- Argument specifications (types, optional/required)
- Return type
`,
  })
  @ApiOkResponse({
    description: 'Returns formula function definitions',
    type: [FormulaFunctionDefinitionDto],
  })
  @Get('formula/functions')
  async getFormulaFunctions(
    @Query() query: GetFormulaFunctionsQueryDto,
  ): Promise<FormulaFunctionDefinitionDto[]> {
    return this.formulaMetadataService.getFormulaFunctions(query.category, query.name);
  }

  @ApiOperation({
    summary: 'Get blueprint field by ID',
    description: `Fetch a single blueprint field's details.

**Use this to:**
- Load field data for editing
- View field configuration (type, options, validation)
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint field UUID' })
  @ApiOkResponse({ type: BlueprintFieldResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint field not found' })
  @Get(':id')
  async getField(@Param('id') id: string): Promise<BlueprintFieldResponseDto> {
    return this.blueprintFieldsService.getById(id);
  }

  @ApiOperation({
    summary: 'Update a blueprint field',
    description: `Modify blueprint field configuration.

**Use this to:**
- Change field label or description
- Update field type configuration (e.g., add select options)
- Modify validation rules
- Change protection level

**Cannot change:**
- \`apiName\` is immutable after creation
- \`fieldType\` cannot be changed (create new field instead)
- \`objectId\` cannot be changed
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint field UUID' })
  @ApiBody({ type: UpdateBlueprintFieldDto })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint field not found' })
  @Patch(':id')
  async updateField(
    @Param('id') id: string,
    @Body() dto: UpdateBlueprintFieldDto,
  ): Promise<MessageResponseDto> {
    return this.blueprintFieldsService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete a blueprint field',
    description: `Remove a blueprint field from an object.

**Use this to:**
- Remove unused field definitions
- Clean up draft configurations

**Note:** Cannot delete if any company has installed the parent module.
Installed fields would need to be migrated before deletion.
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint field UUID' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint field not found' })
  @Delete(':id')
  async deleteField(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.blueprintFieldsService.delete(id);
  }

  @ApiOperation({
    summary: 'Reorder fields in object',
    description: `Set the display order for fields within an object.

**Use this to:**
- Arrange fields in logical form order
- Put important fields (name, email) first
- Group related fields together

**How it works:**
Pass an array of field IDs in the desired order.
Fields not in the array keep their current position.

**UI impact:**
This order is used when displaying forms and detail views.
`,
  })
  @ApiParam({ name: 'objectId', description: 'Blueprint object UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderedIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['field-id-1', 'field-id-2', 'field-id-3'],
        },
      },
    },
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post(':objectId/reorder')
  async reorderFields(
    @Param('objectId') objectId: string,
    @Body() body: { orderedIds: string[] },
  ): Promise<MessageResponseDto> {
    return this.blueprintFieldsService.reorder(objectId, body.orderedIds ?? []);
  }
}
