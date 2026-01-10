import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CrmObjectAssociationService } from './crm-object-association.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { CreateCrmObjectAssociationDto } from './dto/requests/create-association.dto';
import { GetAssociationsQueryDto } from './dto/requests/get-associations-query.dto';
import {
  BulkCreateAssociationsDto,
  BulkDeleteAssociationsDto,
} from './dto/requests/bulk-associations.dto';
import { CrmObjectAssociationResponseDto } from './dto/responses/association-response.dto';
import { AssociationListResponseDto } from './dto/responses/association-list-response.dto';
import { ObjectAssociationsResponseDto } from './dto/responses/object-associations-response.dto';
import {
  BulkCreateAssociationsResponseDto,
  BulkDeleteAssociationsResponseDto,
} from './dto/responses/bulk-association-response.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';

@ApiTags('CRM Object Associations')
@Controller('crm-object-association')
export class CrmObjectAssociationController {
  constructor(
    private readonly crmObjectAssociationService: CrmObjectAssociationService,
  ) {}

  // ==================== CREATE ====================

  @ApiOperation({ summary: 'Create an association between two objects' })
  @ApiCreatedResponse({
    description: 'Association created successfully',
    type: CrmObjectAssociationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error, cardinality violation, or invalid object types',
  })
  @UseGuards(UserAuthGuard)
  @Post()
  async createAssociation(
    @Body() dto: CreateCrmObjectAssociationDto,
  ): Promise<CrmObjectAssociationResponseDto> {
    return this.crmObjectAssociationService.createAssociation(dto);
  }

  @ApiOperation({ summary: 'Bulk create associations from a source object' })
  @ApiCreatedResponse({
    description: 'Bulk operation results',
    type: BulkCreateAssociationsResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @Post('bulk')
  async bulkCreate(
    @Body() dto: BulkCreateAssociationsDto,
  ): Promise<BulkCreateAssociationsResponseDto> {
    return this.crmObjectAssociationService.bulkCreateAssociations(dto);
  }

  // ==================== READ ====================

  @ApiOperation({ summary: 'List associations with optional filters' })
  @ApiOkResponse({
    description: 'Paginated list of associations',
    type: AssociationListResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @Get()
  async getAssociations(
    @Query() dto: GetAssociationsQueryDto,
  ): Promise<AssociationListResponseDto> {
    return this.crmObjectAssociationService.getAssociations(dto);
  }

  @ApiOperation({ summary: 'Get a single association by ID' })
  @ApiOkResponse({
    description: 'Association details',
    type: CrmObjectAssociationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Association not found' })
  @UseGuards(UserAuthGuard)
  @Get(':id')
  async getAssociation(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CrmObjectAssociationResponseDto> {
    return this.crmObjectAssociationService.getAssociation(id);
  }

  // ==================== DELETE ====================

  @ApiOperation({ summary: 'Bulk delete associations' })
  @ApiOkResponse({
    description: 'Bulk operation results',
    type: BulkDeleteAssociationsResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @Delete('bulk')
  async bulkDelete(
    @Body() dto: BulkDeleteAssociationsDto,
  ): Promise<BulkDeleteAssociationsResponseDto> {
    return this.crmObjectAssociationService.bulkDeleteAssociations(dto);
  }

  @ApiOperation({ summary: 'Delete an association' })
  @ApiOkResponse({
    description: 'Association deleted successfully',
    type: MessageResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Association not found' })
  @UseGuards(UserAuthGuard)
  @Delete(':id')
  async deleteAssociation(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<MessageResponseDto> {
    return this.crmObjectAssociationService.deleteAssociation(id);
  }
}
