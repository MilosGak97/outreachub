import {
  BadRequestException,
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
import { TemplateModulesService } from './template-modules.service';
import { GetModulesQueryDto } from './dto/requests/get-modules-query.dto';
import { ModuleListResponseDto } from './dto/responses/module-list-response.dto';
import { CreateTemplateModuleDto } from './dto/requests/create-template-module.dto';
import { ModuleResponseDto } from './dto/responses/module-response.dto';
import { UpdateTemplateModuleDto } from './dto/requests/update-template-module.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmTemplateModule } from '../../../entities/template/crm-template-module.entity';
import { ReorderTemplateModulesDto } from './dto/requests/reorder-template-modules.dto';

/**
 * # Template Modules
 *
 * Modules are logical groupings of CRM functionality within a template.
 * They allow companies to selectively install features they need.
 *
 * ## Module Types:
 * - **Core modules** (`isCore: true`): Required base functionality, auto-installed
 * - **Optional modules**: Additional features companies can add/remove
 *
 * ## Examples:
 * - "Core" - Base CRM: Contacts, Companies, Notes
 * - "Inventory" - Item tracking, stock levels
 * - "Scheduling" - Appointments, jobs, calendar
 * - "Reporting" - Advanced analytics, dashboards
 */
const templateModuleIdParamPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () =>
    new BadRequestException('Invalid template module id format. Expected UUID.'),
});

const templateIdParamPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () =>
    new BadRequestException('Invalid template id format. Expected UUID.'),
});

@ApiTags('templates/modules')
@ApiBearerAuth()
@Controller('admin/templates/modules')
@UseGuards(AdminAuthGuard)
export class TemplateModulesController {
  constructor(private readonly templateModulesService: TemplateModulesService) {}

  @ApiOperation({
    summary: 'List template modules',
    description: `Fetch modules for a template with pagination.

**Use this to:**
- Display module list in template builder UI
- Show available modules for company installation
- Browse modules across all templates

**Filter by:**
- \`templateId\`: Get modules for a specific template
- \`isCore\`: Filter core vs optional modules
`,
  })
  @ApiOkResponse({ type: ModuleListResponseDto })
  @Get()
  async getModules(
    @Query() query: GetModulesQueryDto,
  ): Promise<ModuleListResponseDto> {
    return this.templateModulesService.getAll(query);
  }

  @ApiOperation({
    summary: 'Create a module',
    description: `Add a new module to a template.

**Use this to:**
- Add a new feature grouping to a template
- Create core or optional modules

**After creation:**
1. Add blueprint objects to the module
2. Add blueprint fields to each object
3. Add associations between objects
4. Set \`displayOrder\` for UI ordering

**Core modules:**
Set \`isCore: true\` for modules that should always be installed.
Core modules cannot be uninstalled by companies.
`,
  })
  @ApiBody({ type: CreateTemplateModuleDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
  })
  @Post()
  async createModule(
    @Body() dto: CreateTemplateModuleDto,
  ): Promise<{ id: string }> {
    return this.templateModulesService.create(dto);
  }

  @ApiOperation({
    summary: 'Get module by ID',
    description: `Fetch a single module's details.

**Use this to:**
- Load module data for editing
- Display module details in builder UI
`,
  })
  @ApiParam({ name: 'id', description: 'Module UUID' })
  @ApiOkResponse({ type: ModuleResponseDto })
  @ApiNotFoundResponse({ description: 'Module not found' })
  @Get(':id')
  async getModule(
    @Param('id', templateModuleIdParamPipe) id: string,
  ): Promise<ModuleResponseDto> {
    return this.templateModulesService.getById(id);
  }

  @ApiOperation({
    summary: 'Get module with full blueprint tree',
    description: `Fetch a module with all its blueprint objects, fields, and associations.

**Use this to:**
- Preview complete module structure before installation
- Export module configuration
- Clone module to another template

**Returns nested structure:**
- Module metadata
- Blueprint objects with their fields
- Blueprint associations
`,
  })
  @ApiParam({ name: 'id', description: 'Module UUID' })
  @ApiOkResponse({ type: CrmTemplateModule })
  @ApiNotFoundResponse({ description: 'Module not found' })
  @Get(':id/full')
  async getModuleFull(
    @Param('id', templateModuleIdParamPipe) id: string,
  ): Promise<CrmTemplateModule> {
    return this.templateModulesService.getFullById(id);
  }

  @ApiOperation({
    summary: 'Update a module',
    description: `Modify module metadata.

**Use this to:**
- Rename a module
- Update description
- Toggle core status
- Change display order

**Note:** Changing \`isCore\` affects future installations only.
Companies that already installed the module are not affected.
`,
  })
  @ApiParam({ name: 'id', description: 'Module UUID' })
  @ApiBody({ type: UpdateTemplateModuleDto })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Module not found' })
  @Patch(':id')
  async updateModule(
    @Param('id', templateModuleIdParamPipe) id: string,
    @Body() dto: UpdateTemplateModuleDto,
  ): Promise<MessageResponseDto> {
    return this.templateModulesService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete a module',
    description: `Remove a module and all its blueprints from a template.

**Use this to:**
- Remove unused modules from a template
- Clean up draft modules

**Cascade deletes:**
- All blueprint objects in the module
- All blueprint fields in those objects
- All blueprint associations in the module

**Note:** Cannot delete if any company has this module installed.
`,
  })
  @ApiParam({ name: 'id', description: 'Module UUID' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Module not found' })
  @Delete(':id')
  async deleteModule(
    @Param('id', templateModuleIdParamPipe) id: string,
  ): Promise<MessageResponseDto> {
    return this.templateModulesService.delete(id);
  }

  @ApiOperation({
    summary: 'Reorder modules',
    description: `Set the display order for modules in a template.

**Use this to:**
- Arrange modules in logical order for installation UI
- Move important modules to the top
- Group related modules together

**How it works:**
Pass an array of module IDs in the desired order.
Modules not in the array keep their current position.
`,
  })
  @ApiParam({ name: 'templateId', description: 'Template UUID' })
  @ApiBody({ type: ReorderTemplateModulesDto })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post(':templateId/reorder')
  async reorderModules(
    @Param('templateId', templateIdParamPipe) templateId: string,
    @Body() body: ReorderTemplateModulesDto,
  ): Promise<MessageResponseDto> {
    return this.templateModulesService.reorder(templateId, body.orderedIds ?? []);
  }
}
