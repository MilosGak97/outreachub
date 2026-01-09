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
import { BlueprintAssociationsService } from './blueprint-associations.service';
import { GetBlueprintAssociationsQueryDto } from './dto/requests/get-blueprint-associations-query.dto';
import { BlueprintAssociationResponseDto } from './dto/responses/blueprint-association-response.dto';
import { CreateBlueprintAssociationDto } from './dto/requests/create-blueprint-association.dto';
import { UpdateBlueprintAssociationDto } from './dto/requests/update-blueprint-association.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';

/**
 * # Templates - Blueprint Associations
 *
 * Blueprint associations define relationships between CRM objects that will be
 * created when a module is installed. They enable linking records together.
 *
 * ## Association Types:
 * - **one-to-many**: Contact has many Jobs
 * - **many-to-many**: Contacts linked to Companies
 * - **one-to-one**: User has one Profile
 *
 * ## Examples:
 * - Contact → Jobs (a contact can have multiple jobs)
 * - Job → Invoice (a job generates an invoice)
 * - Company → Contacts (a company has many contacts)
 *
 * ## Naming:
 * - `sourceObject`: The "from" side of the relationship
 * - `targetObject`: The "to" side of the relationship
 * - `label`: Human-readable name shown in UI
 */
@ApiTags('templates/blueprint-associations')
@ApiBearerAuth()
@Controller('admin/templates/blueprint-associations')
@UseGuards(AdminAuthGuard)
export class BlueprintAssociationsController {
  constructor(
    private readonly blueprintAssociationsService: BlueprintAssociationsService,
  ) {}

  @ApiOperation({
    summary: 'List blueprint associations',
    description: `Fetch blueprint associations for a module.

**Use this to:**
- Display association list in module builder UI
- See what relationships will be created when installed
- Visualize object relationships in a diagram

**Filter by:**
- \`moduleId\`: Required - get associations for a specific module
`,
  })
  @ApiOkResponse({ type: [BlueprintAssociationResponseDto] })
  @Get()
  async getAssociations(
    @Query() query: GetBlueprintAssociationsQueryDto,
  ): Promise<BlueprintAssociationResponseDto[]> {
    return this.blueprintAssociationsService.getAll(query);
  }

  @ApiOperation({
    summary: 'Create a blueprint association',
    description: `Define a relationship between two blueprint objects.

**Use this to:**
- Link related objects (e.g., Contact → Jobs)
- Enable related records in the CRM UI
- Set up data relationships for reporting

**Configuration:**
- \`sourceObjectId\`: The object that "has" the relationship
- \`targetObjectId\`: The object being linked to
- \`associationType\`: The cardinality (one-to-many, etc.)
- \`label\`: Display name in UI (e.g., "Jobs" on Contact)
- \`reverseLabel\`: Display name from the other side (e.g., "Contact" on Job)

**Cross-module associations:**
You can create associations between objects in different modules.
When installed, both modules must be present for the association to work.
`,
  })
  @ApiBody({ type: CreateBlueprintAssociationDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
  })
  @Post()
  async createAssociation(
    @Body() dto: CreateBlueprintAssociationDto,
  ): Promise<{ id: string }> {
    return this.blueprintAssociationsService.create(dto);
  }

  @ApiOperation({
    summary: 'Get blueprint association by ID',
    description: `Fetch a single blueprint association's details.

**Use this to:**
- Load association data for editing
- View association configuration
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint association UUID' })
  @ApiOkResponse({ type: BlueprintAssociationResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint association not found' })
  @Get(':id')
  async getAssociation(
    @Param('id') id: string,
  ): Promise<BlueprintAssociationResponseDto> {
    return this.blueprintAssociationsService.getById(id);
  }

  @ApiOperation({
    summary: 'Update a blueprint association',
    description: `Modify blueprint association configuration.

**Use this to:**
- Change association labels
- Update display settings
- Modify cascade behavior

**Cannot change:**
- \`sourceObjectId\` and \`targetObjectId\` are immutable
- \`associationType\` cannot be changed (create new instead)
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint association UUID' })
  @ApiBody({ type: UpdateBlueprintAssociationDto })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint association not found' })
  @Patch(':id')
  async updateAssociation(
    @Param('id') id: string,
    @Body() dto: UpdateBlueprintAssociationDto,
  ): Promise<MessageResponseDto> {
    return this.blueprintAssociationsService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete a blueprint association',
    description: `Remove a blueprint association from a module.

**Use this to:**
- Remove unused relationship definitions
- Clean up draft configurations
- Simplify module structure

**Note:** Cannot delete if any company has installed the parent module.
Existing association data would need to be handled before deletion.
`,
  })
  @ApiParam({ name: 'id', description: 'Blueprint association UUID' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ description: 'Blueprint association not found' })
  @Delete(':id')
  async deleteAssociation(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.blueprintAssociationsService.delete(id);
  }
}
