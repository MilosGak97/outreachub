import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { CrmObjectService } from './crm-object.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { CreateCrmObjectDto } from './dto/requests/create-crm-object.dto';
import { UpdateCrmObjectDto } from './dto/requests/update-crm-object.dto';
import { GetAllObjectsQueryDto } from './dto/requests/get-all-objects-query.dto';
import { SearchObjectsDto } from './dto/requests/search-objects.dto';
import { BulkCreateObjectsDto } from './dto/requests/bulk-create-objects.dto';
import { BulkUpdateObjectsDto } from './dto/requests/bulk-update-objects.dto';
import { BulkDeleteObjectsDto } from './dto/requests/bulk-delete-objects.dto';
import { CrmObjectResponseDto } from './dto/responses/crm-object-response.dto';
import { CrmObjectListResponseDto } from './dto/responses/crm-object-list-response.dto';
import { CrmObjectFullResponseDto } from './dto/responses/crm-object-full-response.dto';
import {
  BulkCreateResponseDto,
  BulkUpdateResponseDto,
  BulkDeleteResponseDto,
} from './dto/responses/bulk-operation-response.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmObjectAssociationService } from '../crm-object-association/crm-object-association.service';
import { ObjectAssociationsResponseDto } from '../crm-object-association/dto/responses/object-associations-response.dto';

@ApiTags('CRM Objects')
@Controller('crm-object')
export class CrmObjectController {
  constructor(
    private readonly crmObjectService: CrmObjectService,
    private readonly crmObjectAssociationService: CrmObjectAssociationService,
  ) {}

  // ==================== CREATE ====================

  @ApiOperation({ summary: 'Create a new CRM object' })
  @ApiCreatedResponse({
    description: 'Object created successfully',
    type: CrmObjectResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @UseGuards(UserAuthGuard)
  @Post()
  async createObject(@Body() dto: CreateCrmObjectDto): Promise<CrmObjectResponseDto> {
    return this.crmObjectService.createObject(dto);
  }

  @ApiOperation({ summary: 'Bulk create CRM objects' })
  @ApiCreatedResponse({
    description: 'Bulk operation results',
    type: BulkCreateResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @Post('bulk')
  async bulkCreate(@Body() dto: BulkCreateObjectsDto): Promise<BulkCreateResponseDto> {
    return this.crmObjectService.bulkCreate(dto);
  }

  // ==================== READ ====================

  @ApiOperation({ summary: 'List CRM objects by type with pagination' })
  @ApiOkResponse({
    description: 'Paginated list of objects',
    type: CrmObjectListResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @Get()
  async getAllObjects(@Query() dto: GetAllObjectsQueryDto): Promise<CrmObjectListResponseDto> {
    return this.crmObjectService.getAllObjects(dto);
  }

  @ApiOperation({ summary: 'Search CRM objects with field filters' })
  @ApiOkResponse({
    description: 'Search results',
    type: CrmObjectListResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('search')
  async searchObjects(@Body() dto: SearchObjectsDto): Promise<CrmObjectListResponseDto> {
    return this.crmObjectService.searchObjects(dto);
  }

  @ApiOperation({ summary: 'Get a single CRM object by ID' })
  @ApiOkResponse({
    description: 'Object details',
    type: CrmObjectResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Object not found' })
  @UseGuards(UserAuthGuard)
  @Get(':id')
  async getObject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CrmObjectResponseDto> {
    return this.crmObjectService.getObject(id);
  }

  @ApiOperation({ summary: 'Get a CRM object with full details (fields metadata + associations)' })
  @ApiOkResponse({
    description: 'Full object details with field metadata and associations',
    type: CrmObjectFullResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Object not found' })
  @UseGuards(UserAuthGuard)
  @Get(':id/full')
  async getObjectFull(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CrmObjectFullResponseDto> {
    return this.crmObjectService.getObjectFull(id);
  }

  // ==================== UPDATE ====================

  @ApiOperation({ summary: 'Bulk update CRM objects' })
  @ApiOkResponse({
    description: 'Bulk operation results',
    type: BulkUpdateResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @Patch('bulk')
  async bulkUpdate(@Body() dto: BulkUpdateObjectsDto): Promise<BulkUpdateResponseDto> {
    return this.crmObjectService.bulkUpdate(dto);
  }

  @ApiOperation({ summary: 'Update a CRM object' })
  @ApiOkResponse({
    description: 'Updated object',
    type: CrmObjectResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Object not found' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @UseGuards(UserAuthGuard)
  @Patch(':id')
  async updateObject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCrmObjectDto,
  ): Promise<CrmObjectResponseDto> {
    return this.crmObjectService.updateObject(id, dto);
  }

  @ApiOperation({ summary: 'Update a single field value' })
  @ApiOkResponse({
    description: 'Updated object',
    type: CrmObjectResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Object not found' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @UseGuards(UserAuthGuard)
  @Patch(':id/field/:apiName')
  async updateSingleField(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('apiName') apiName: string,
    @Body('value') value: any,
  ): Promise<CrmObjectResponseDto> {
    return this.crmObjectService.updateSingleField(id, apiName, value);
  }

  // ==================== ASSOCIATIONS ====================

  @ApiOperation({ summary: 'Get all associations for an object' })
  @ApiOkResponse({
    description: 'Associations grouped by type',
    type: ObjectAssociationsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Object not found' })
  @UseGuards(UserAuthGuard)
  @Get(':id/associations')
  async getObjectAssociations(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ObjectAssociationsResponseDto> {
    return this.crmObjectAssociationService.getAssociationsForObject(id);
  }

  @ApiOperation({ summary: 'Get associations for an object filtered by type' })
  @ApiOkResponse({
    description: 'Associations of specific type',
    type: ObjectAssociationsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Object not found' })
  @UseGuards(UserAuthGuard)
  @Get(':id/associations/:typeId')
  async getObjectAssociationsByType(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('typeId', new ParseUUIDPipe({ version: '4' })) typeId: string,
  ): Promise<ObjectAssociationsResponseDto> {
    return this.crmObjectAssociationService.getAssociationsForObject(id, typeId);
  }

  // ==================== DELETE ====================

  @ApiOperation({ summary: 'Bulk delete CRM objects' })
  @ApiOkResponse({
    description: 'Bulk operation results',
    type: BulkDeleteResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @Delete('bulk')
  async bulkDelete(@Body() dto: BulkDeleteObjectsDto): Promise<BulkDeleteResponseDto> {
    return this.crmObjectService.bulkDelete(dto);
  }

  @ApiOperation({ summary: 'Delete a CRM object' })
  @ApiOkResponse({
    description: 'Object deleted successfully',
    type: MessageResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Object not found' })
  @UseGuards(UserAuthGuard)
  @Delete(':id')
  async deleteObject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<MessageResponseDto> {
    return this.crmObjectService.deleteObject(id);
  }
}
