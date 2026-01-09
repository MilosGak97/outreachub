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
import { CrmAssociationTypeService } from './crm-association-type.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { GetAllAssociationTypesResponseDto } from './dto/get-all-association-types-response.dto';
import { GetAllAssociationTypesQueryDto } from './dto/get-all-association-types-query.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../../entities/user.entity';
import { CreateCrmAssociationTypeDto } from './dto/create-crm-association-type.dto';
import { GetSingleAssociationTypeDto } from './dto/get-single-association-type.dto';
import { UpdateCrmAssociationTypeDto } from './dto/update-crm-association-type.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';

@ApiTags('Crm Association Type')
@Controller('crm-association-type')
export class CrmAssociationTypeController {
  constructor(
    private readonly  crmAssociationTypeService: CrmAssociationTypeService
  ) {
  }

  @ApiOperation({ summary: 'Get all association types for this company' })
  @ApiOkResponse({
    description: 'Paged list of association types scoped to the caller company',
    type: GetAllAssociationTypesResponseDto,
  })
  @UseGuards(UserAuthGuard)
  @Get()
  async getAllAssociationTypes(
    @Query() dto: GetAllAssociationTypesQueryDto,
    @GetUser() user: User,
  ): Promise<GetAllAssociationTypesResponseDto> {
    return this.crmAssociationTypeService.getAllAssociationTypes(dto, user.company.id);
  }

  @ApiOperation({ summary: 'Create association type' })
  @ApiOkResponse({ description: 'Returns the new association type id', type: String })
  @UseGuards(UserAuthGuard)
  @Post()
  async createAssociationType(
    @Body() dto: CreateCrmAssociationTypeDto,
  ): Promise<string> {
    return this.crmAssociationTypeService.createAssociationType(dto);
  }

  @ApiOperation({ summary: 'Get single association type' })
  @ApiOkResponse({ type: GetSingleAssociationTypeDto })
  @UseGuards(UserAuthGuard)
  @Get(':id')
  async getSingleAssociationType(@Param('id') id: string): Promise<GetSingleAssociationTypeDto> {
    return this.crmAssociationTypeService.getSingleAssociationType(id);
  }

  @ApiOperation({ summary: 'Check api_name availability' })
  @ApiOkResponse({ description: 'Returns true if api name is available', type: Boolean })
  @UseGuards(UserAuthGuard)
  @Get('api-name/:value')
  async checkApiNameAvailability(@Param('value') value: string): Promise<boolean> {
    return this.crmAssociationTypeService.checkApiName(value);
  }

  @ApiOperation({ summary: 'Update association type' })
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(UserAuthGuard)
  @Patch(':id')
  async updateAssociationType(
    @Param('id') id: string,
    @Body() dto: UpdateCrmAssociationTypeDto,
  ): Promise<MessageResponseDto> {
    return this.crmAssociationTypeService.updateAssociationType(id, dto);
  }

  @ApiOperation({ summary: 'Delete association type (blocked if associations exist)' })
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(UserAuthGuard)
  @Delete(':id')
  async deleteAssociationType(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.crmAssociationTypeService.deleteAssociationType(id);
  }
}
