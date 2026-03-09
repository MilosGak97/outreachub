import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post, Query,
  UseGuards,
} from '@nestjs/common';
import { CrmObjectTypeService } from './crm-object-type.service';
import { CreateCrmObjectTypeDto } from './dto/create-crm-object-type.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { UpdateCrmObjectTypeDto } from './dto/update-crm-object-type.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { GetAllObjectsResponseDto } from './dto/get-all-objects-response.dto';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../../entities/user.entity';
import { GetAllQueryDto } from './dto/get-all-query.dto';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { GetSingleObjectTypeDto } from './dto/get-single-object.dto';

@ApiTags('Crm Object Type')
@Controller('crm-object-type')
export class CrmObjectTypeController {
  constructor(private readonly crmObjectTypeService: CrmObjectTypeService) {}


  @ApiOperation({ summary: ''})
  @ApiOkResponse({description: 'Get all crm objects for this user', type: GetAllObjectsResponseDto})
  @UseGuards(AuthGuard)
  @Get()
  async getAllCrmObjects(
    @Query() dto: GetAllQueryDto,
    @CurrentUser() user: User
  ):Promise<GetAllObjectsResponseDto>{
    return this.crmObjectTypeService.getAllObjectTypes(dto, user.company.id)
  }


  @ApiOperation({ summary: 'Create crm object' })
  @ApiOkResponse({ description: 'Returns true if api name is available', type: String })
  @UseGuards(AuthGuard)
  @Post()
  async createObject(@Body() dto: CreateCrmObjectTypeDto):Promise<string> {
    return this.crmObjectTypeService.createObject(dto);
  }


  @ApiOperation({summary: 'Single Object Type' })
  @ApiOkResponse({ description: 'Returns true if api name is available', type: GetSingleObjectTypeDto })
  @UseGuards(AuthGuard)
  @Get(':id')
  async getSingleObject(@Param('id') id: string):Promise<GetSingleObjectTypeDto> {
    return this.crmObjectTypeService.getSingleObject(id);
  }

  @ApiOperation({summary: 'Check api_name availability'})
  @ApiOkResponse({ description: 'Returns true if api name is available', type: Boolean })
  @UseGuards(AuthGuard)
  @Get('api-name/:value')
  async checkApiNameAvailability(@Param('value') value: string) {
      return this.crmObjectTypeService.checkApiName(value);
  }

  @ApiOperation({ summary: 'Update CRM object type (name or description)' })
  @ApiOkResponse({ description: 'Returns a success message after updating the CRM object type', type: MessageResponseDto })
  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateObject(
    @Param('id') id: string,
    @Body() dto: UpdateCrmObjectTypeDto,
):Promise<MessageResponseDto>{
    return this.crmObjectTypeService.updateObject(id, dto);
  }

  @ApiOperation({ summary: 'Delete CRM object type by ID' })
  @ApiOkResponse({ description: 'Returns a success message of deleting an object', type: MessageResponseDto })
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteObject(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.crmObjectTypeService.deleteObject(id);
  }

}
