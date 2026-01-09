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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { GetTemplatesQueryDto } from './dto/requests/get-templates-query.dto';
import { TemplateListResponseDto } from './dto/responses/template-list-response.dto';
import { CreateTemplateDto } from './dto/requests/create-template.dto';
import { TemplateResponseDto } from './dto/responses/template-response.dto';
import { UpdateTemplateDto } from './dto/requests/update-template.dto';
import { MessageResponseDto } from '../../responses/message-response.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { TemplateInstallationService } from './installation/template-installation.service';
import { InstallTemplateDto } from './dto/requests/install-template.dto';
import { InstallModuleDto } from './dto/requests/install-module.dto';
import { UninstallModuleDto } from './dto/requests/uninstall-module.dto';
import { InstallationResultDto } from './dto/responses/installation-result.dto';
import { UninstallModuleResponseDto } from './dto/responses/uninstall-module-response.dto';
import { CompanyTemplateInstallationResponseDto } from './dto/responses/company-template-installation-response.dto';

const templateIdParamPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () =>
    new BadRequestException('Invalid template id format. Expected UUID.'),
});

/**
 * # CRM Templates
 *
 * Templates are pre-built CRM configurations for specific industries.
 * When a company installs a template, it gets a fully configured CRM
 * with objects, fields, and associations ready to use.
 *
 * ## Template Hierarchy:
 * ```
 * Template (e.g., "Movers CRM")
 *   └── Modules (e.g., "Core", "Inventory", "Scheduling")
 *         └── Blueprint Objects (e.g., "Contact", "Job", "Invoice")
 *               └── Blueprint Fields (e.g., "email", "phone", "status")
 *         └── Blueprint Associations (e.g., "Contact → Jobs")
 * ```
 *
 * ## Installation Flow:
 * 1. Admin creates template with modules, objects, fields, associations
 * 2. Company selects template and desired modules
 * 3. System "stamps" blueprints into real CRM entities for that company
 * 4. Company gets a working CRM tailored to their industry
 */
@ApiTags('templates')
@ApiBearerAuth()
@Controller('admin/templates')
@UseGuards(AdminAuthGuard)
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly templateInstallationService: TemplateInstallationService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE CRUD
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({
    summary: 'List all templates',
    description: `Fetch available CRM templates with pagination and filtering.

**Use this to:**
- Display template catalog for admins to manage
- Show template selection UI for new companies
- Search templates by name or description

**Includes counts for:**
- \`modulesCount\`: Number of modules in each template
- \`companiesCount\`: Companies currently using the template
`,
  })
  @ApiOkResponse({ type: TemplateListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid admin JWT token' })
  @Get()
  async getTemplates(
    @Query() query: GetTemplatesQueryDto,
  ): Promise<TemplateListResponseDto> {
    return this.templatesService.getAll(query);
  }

  @ApiOperation({
    summary: 'Create a new template',
    description: `Create a new industry CRM template.

**Use this to:**
- Start building a new CRM configuration for an industry
- Clone and customize an existing template concept

**After creation:**
1. Add modules using \`POST /admin/templates/modules\`
2. Add blueprint objects to each module
3. Add blueprint fields to each object
4. Add associations between objects
5. Set \`isActive: true\` when ready for companies to install
`,
  })
  @ApiBody({ type: CreateTemplateDto })
  @ApiCreatedResponse({
    description: 'Template created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
          description: 'The ID of the newly created template',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - invalid slug format or missing required fields',
  })
  @ApiConflictResponse({
    description: 'Template with this slug already exists',
  })
  @Post()
  async createTemplate(@Body() dto: CreateTemplateDto): Promise<{ id: string }> {
    return this.templatesService.create(dto);
  }

  @ApiOperation({
    summary: 'Get template by ID',
    description: `Fetch a single template's details by its UUID.

**Use this to:**
- Load template data for editing
- Display template details page
- Verify template exists before operations
`,
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiOkResponse({ type: TemplateResponseDto })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @Get(':id([0-9a-fA-F-]{36})')
  async getTemplate(
    @Param('id', templateIdParamPipe) id: string,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.getById(id);
  }

  @ApiOperation({
    summary: 'Get template by slug',
    description: `Fetch a template using its URL-friendly slug identifier.

**Use this to:**
- Look up template by human-readable identifier
- Deep-link to template (e.g., \`/templates/movers_crm\`)
- API integrations that prefer slugs over UUIDs
`,
  })
  @ApiParam({ name: 'slug', description: 'Template slug (e.g., "movers_crm")', example: 'movers_crm' })
  @ApiOkResponse({ type: TemplateResponseDto })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @Get('slug/:slug')
  async getTemplateBySlug(
    @Param('slug') slug: string,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.getBySlug(slug);
  }

  @ApiOperation({
    summary: 'Check if slug is available',
    description: `Validate that a slug can be used for a new template.

**Use this to:**
- Real-time validation in template creation form
- Prevent duplicate slug conflicts before submission

**Note:** Slugs are globally unique and cannot be reused even after deletion.
`,
  })
  @ApiParam({ name: 'slug', description: 'Slug to check', example: 'my_new_template' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', example: true },
      },
    },
  })
  @Get('slug/:slug/available')
  async checkSlugAvailable(
    @Param('slug') slug: string,
  ): Promise<{ available: boolean }> {
    return this.templatesService.checkSlugAvailable(slug);
  }

  @ApiOperation({
    summary: 'Update a template',
    description: `Modify template metadata (name, description, icon, status).

**Use this to:**
- Rename or update template description
- Activate/deactivate template availability
- Change display order in template catalog

**Cannot change:** The \`slug\` is immutable after creation.

**Warning:** Deactivating a template does NOT affect companies that already installed it.
`,
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @Patch(':id([0-9a-fA-F-]{36})')
  async updateTemplate(
    @Param('id', templateIdParamPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ): Promise<MessageResponseDto> {
    return this.templatesService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete a template',
    description: `Permanently remove a template and all its modules/blueprints.

**Use this to:**
- Remove draft templates that won't be used
- Clean up test templates

**Restrictions:**
- Cannot delete if any company has installed this template
- Deletion is permanent and cannot be undone

**Cascade deletes:**
- All modules in the template
- All blueprint objects, fields, associations
`,
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({
    description: 'Cannot delete template while companies are using it',
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @Delete(':id([0-9a-fA-F-]{36})')
  async deleteTemplate(
    @Param('id', templateIdParamPipe) id: string,
  ): Promise<MessageResponseDto> {
    return this.templatesService.delete(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE INSTALLATION
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({
    summary: 'Install template for a company',
    description: `Deploy a template to a company, creating real CRM entities.

**What happens:**
1. Validates company doesn't already have a template
2. For each selected module:
   - Creates CRM object types from blueprint objects
   - Creates fields from blueprint fields
   - Creates associations from blueprint associations
3. Marks entities with \`templateOriginId\` for tracking
4. Applies protection levels to prevent accidental deletion

**Use this when:**
- Onboarding a new company
- Company upgrades to a templated CRM

**Module selection:**
- Pass \`modules: ["core", "inventory"]\` for specific modules
- Or \`installAllModules: true\` for everything
`,
  })
  @ApiBody({ type: InstallTemplateDto })
  @ApiOkResponse({ type: InstallationResultDto })
  @Post('install')
  async installTemplate(
    @Body() dto: InstallTemplateDto,
  ): Promise<InstallationResultDto> {
    return this.templateInstallationService.installTemplate(dto);
  }

  @ApiOperation({
    summary: 'Install additional module',
    description: `Add a module to a company that already has a template installed.

**Use this when:**
- Company wants to add optional features (e.g., "Advanced Reporting")
- Upselling additional CRM capabilities
- Enabling a module that was skipped during initial install

**Requirements:**
- Company must already have the parent template installed
- Module must not already be installed
- Core module dependencies are installed automatically
`,
  })
  @ApiBody({ type: InstallModuleDto })
  @ApiOkResponse({ type: InstallationResultDto })
  @Post('install-module')
  async installModule(
    @Body() dto: InstallModuleDto,
  ): Promise<InstallationResultDto> {
    return this.templateInstallationService.installModule(dto);
  }

  @ApiOperation({
    summary: 'Uninstall a module',
    description: `Remove a module and its entities from a company's CRM.

**What happens:**
1. Checks if module has any data (records in its objects)
2. If data exists and \`force: false\`, returns error with counts
3. If \`force: true\`, deletes all data and entities
4. Removes object types, fields, associations created by the module

**Use this when:**
- Company no longer needs a feature
- Downgrading subscription tier
- Cleaning up unused modules

**Warning:** With \`force: true\`, all data in the module's objects is permanently deleted.
`,
  })
  @ApiBody({ type: UninstallModuleDto })
  @ApiOkResponse({ type: UninstallModuleResponseDto })
  @Post('uninstall-module')
  async uninstallModule(
    @Body() dto: UninstallModuleDto,
  ): Promise<UninstallModuleResponseDto> {
    return this.templateInstallationService.uninstallModule(dto);
  }

  @ApiOperation({
    summary: 'Get company installation status',
    description: `Check which template and modules a company has installed.

**Use this to:**
- Display company's current CRM configuration
- Show available modules for upgrade
- Verify installation before operations

**Returns:**
- \`template\`: The installed template (or null if none)
- \`modules\`: Array of installed modules with their status
`,
  })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  @ApiOkResponse({ type: CompanyTemplateInstallationResponseDto })
  @Get('company/:companyId')
  async getCompanyTemplateInstallation(
    @Param('companyId') companyId: string,
  ): Promise<CompanyTemplateInstallationResponseDto> {
    return this.templateInstallationService.getCompanyInstallation(companyId);
  }
}
