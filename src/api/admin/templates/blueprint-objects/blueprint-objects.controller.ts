import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { BlueprintObjectsService } from './blueprint-objects.service';
import { GetBlueprintObjectsQueryDto } from './dto/requests/get-blueprint-objects-query.dto';
import { BlueprintObjectResponseDto } from './dto/responses/blueprint-object-response.dto';
import { CreateBlueprintObjectDto } from './dto/requests/create-blueprint-object.dto';
import { UpdateBlueprintObjectDto } from './dto/requests/update-blueprint-object.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmTemplateBlueprintObject } from '../../../entities/template/crm-template-blueprint-object.entity';

/**
 * # Templates - Blueprint Objects
 *
 * Blueprint objects define CRM object types that will be created when a module is installed.
 * Think of them as "templates for database tables" - they describe the structure,
 * and installation creates the actual tables.
 *
 * ## Examples:
 * - "Contact" → becomes a real Contact object type
 * - "Job" → becomes a real Job object type
 * - "_lead" → template-managed Lead (underscore prefix)
 *
 * ## API Name Convention:
 * - Start with `_` for template-managed objects (protected from user deletion)
 * - Without `_` for user-modifiable objects
 */
@ApiTags('templates/blueprint-objects')
@ApiBearerAuth()
@Controller('admin/templates/blueprint-objects')
@UseGuards(AdminAuthGuard)
export class BlueprintObjectsController {
  constructor(private readonly blueprintObjectsService: BlueprintObjectsService) {}

  @ApiOperation({
    summary: 'List blueprint objects',
    description: `Fetch blueprint objects for a module.

**Use this to:**
- Display object list in module builder UI
- See what objects a module will create when installed
- Browse all blueprint objects across modules

**Filter by:**
- \`moduleId\`: Required - get objects for a specific module
`,
  })
  @ApiOkResponse({ type: [BlueprintObjectResponseDto] })
  @Get()
  async getObjects(
    @Query() query: GetBlueprintObjectsQueryDto,
  ): Promise<BlueprintObjectResponseDto[]> {
    return this.blueprintObjectsService.getAll(query);
  }

  @ApiOperation({
    summary: 'Create a blueprint object',
    description: `Define a new CRM object type for a module.

**Use this to:**
- Add a new entity type to a module (e.g., "Invoice", "Task")
- Define what objects companies get when installing the module

**After creation:**
1. Add blueprint fields to define the object's properties
2. Add associations to link it to other objects

**API name rules:**
- Start with \`_\` for template-managed (e.g., \`_contact\`)
- Lowercase, underscores allowed, no spaces
- Must be unique within the template
`,
  })
  @ApiBody({ type: CreateBlueprintObjectDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
  })
  @Post()
  async createObject(
    @Body() dto: CreateBlueprintObjectDto,
  ): Promise<{ id: string }> {
    return this.blueprintObjectsService.create(dto);
  }

  @ApiOperation({
    summary: 'Get object with fields',
    description: `Fetch a blueprint object with all its fields included.

**Use this to:**
- Preview complete object structure
- Display object details with field list in UI
- Validate object configuration before installation
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint object UUID' })
  @ApiOkResponse({ type: CrmTemplateBlueprintObject })
  @ApiNotFoundResponse({ description: 'Blueprint object not found' })
  @Get(':id/with-fields')
  async getObjectWithFields(
    @Param('id') id: string,
  ): Promise<CrmTemplateBlueprintObject> {
    return this.blueprintObjectsService.getWithFields(id);
  }

  @ApiOperation({
    summary: 'Get blueprint object by ID',
    description: `Fetch a single blueprint object's details.

**Use this to:**
- Load object data for editing
- Verify object exists before adding fields
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint object UUID' })
  @ApiOkResponse({ type: BlueprintObjectResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint object not found' })
  @Get(':id')
  async getObject(@Param('id') id: string): Promise<BlueprintObjectResponseDto> {
    return this.blueprintObjectsService.getById(id);
  }

  @ApiOperation({
    summary: 'Update a blueprint object',
    description: `Modify blueprint object metadata.

**Use this to:**
- Rename the object (display name)
- Update description or icon
- Change protection level

**Cannot change:**
- \`apiName\` is immutable after creation
- \`moduleId\` cannot be changed (delete and recreate instead)
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint object UUID' })
  @ApiBody({ type: UpdateBlueprintObjectDto })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint object not found' })
  @Patch(':id')
  async updateObject(
    @Param('id') id: string,
    @Body() dto: UpdateBlueprintObjectDto,
  ): Promise<MessageResponseDto> {
    return this.blueprintObjectsService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete a blueprint object',
    description: `Remove a blueprint object from a module.

**Use this to:**
- Remove unused object definitions
- Clean up draft configurations

**Cascade deletes:**
- All blueprint fields in this object
- Association endpoints referencing this object

**Note:** Cannot delete if any company has installed the parent module.
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint object UUID' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint object not found' })
  @Delete(':id')
  async deleteObject(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.blueprintObjectsService.delete(id);
  }

  @ApiOperation({
    summary: 'Reorder objects in module',
    description: `Set the display order for objects within a module.

**Use this to:**
- Arrange objects in logical order
- Put primary objects (Contact, Company) first
- Group related objects together

**How it works:**
Pass an array of object IDs in the desired order.
Objects not in the array keep their current position.
`,
  })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderedIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['object-id-1', 'object-id-2', 'object-id-3'],
        },
      },
    },
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post(':moduleId/reorder')
  async reorderObjects(
    @Param('moduleId') moduleId: string,
    @Body() body: { orderedIds: string[] },
  ): Promise<MessageResponseDto> {
    return this.blueprintObjectsService.reorder(moduleId, body.orderedIds ?? []);
  }
}
