import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { ImportService } from './import.service';
import { ImportHealthDto } from './dto/import-health.dto';
import { CreateImportFileDto } from './dto/create-import-file.dto';
import { ImportFileDto } from './dto/import-file.dto';
import { CreateImportSessionDto } from './dto/create-import-session.dto';
import { ImportSessionDto } from './dto/import-session.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../../entities/user.entity';
import { CreateImportDraftFieldDto } from './dto/create-import-draft-field.dto';
import { ImportDraftFieldDto } from './dto/import-draft-field.dto';
import { UpsertImportObjectMapDto } from './dto/upsert-import-object-map.dto';
import { ImportObjectMapDto } from './dto/import-object-map.dto';
import { UpsertImportFieldMapDto } from './dto/upsert-import-field-map.dto';
import { ImportFieldMapDto } from './dto/import-field-map.dto';
import { CreateImportDraftAssociationTypeDto } from './dto/create-import-draft-association-type.dto';
import { ImportDraftAssociationTypeDto } from './dto/import-draft-association-type.dto';
import { UpsertImportLinkRuleDto } from './dto/upsert-import-link-rule.dto';
import { ImportLinkRuleDto } from './dto/import-link-rule.dto';
import { ImportJobDto } from './dto/import-job.dto';
import { ImportResultsQueryDto } from './dto/import-results-query.dto';
import { ImportRowResultListResponseDto } from './dto/import-row-result-list-response.dto';
import { CreateImportPresignDto } from './dto/create-import-presign.dto';
import { ImportPresignResponseDto } from './dto/import-presign-response.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { UpdateImportLinkRuleDto } from './dto/update-import-link-rule.dto';
import { ImportAssociationTypesQueryDto } from './dto/import-association-types-query.dto';
import { AssociationTypeDto } from '../crm-association-type/dto/association-type.dto';
import { ImportRowsParseResponseDto } from './dto/import-rows-parse-response.dto';

@ApiTags('Object Import')
@Controller('object-import')
@UseGuards(UserAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @ApiOperation({ summary: 'Import module health check' })
  @ApiOkResponse({ type: ImportHealthDto })
  @Get('health')
  async health(): Promise<ImportHealthDto> {
    return this.importService.health();
  }

  @ApiOperation({ summary: 'Create upload URL for an import file' })
  @ApiOkResponse({ type: ImportPresignResponseDto })
  @Post('files/upload-url')
  async createUploadUrl(
    @Body() dto: CreateImportPresignDto,
    @GetUser() user: User,
  ): Promise<ImportPresignResponseDto> {
    return this.importService.createUploadUrl(dto, user?.company?.id);
  }

  @ApiOperation({ summary: 'Create import file metadata' })
  @ApiOkResponse({ type: ImportFileDto })
  @Post('files/metadata')
  async createFile(@Body() dto: CreateImportFileDto): Promise<ImportFileDto> {
    return this.importService.createFile(dto);
  }

  @ApiOperation({ summary: 'Create import session' })
  @ApiOkResponse({ type: ImportSessionDto })
  @Post('sessions')
  async createSession(
    @Body() dto: CreateImportSessionDto,
    @GetUser() user: User,
  ): Promise<ImportSessionDto> {
    return this.importService.createSession(dto, user?.id);
  }

  @ApiOperation({ summary: 'List existing association types for two object types' })
  @ApiOkResponse({ type: [AssociationTypeDto] })
  @Get('association-types')
  async getAssociationTypesForObjectPair(
    @Query() query: ImportAssociationTypesQueryDto,
    @GetUser() user: User,
  ): Promise<AssociationTypeDto[]> {
    return this.importService.getAssociationTypesForObjectPair(query, user?.company?.id);
  }

  @ApiOperation({ summary: 'Create draft field for a session' })
  @ApiOkResponse({ type: ImportDraftFieldDto })
  @Post('sessions/:id/draft-fields')
  async createDraftField(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateImportDraftFieldDto,
  ): Promise<ImportDraftFieldDto> {
    return this.importService.createDraftField(id, dto);
  }

  @ApiOperation({ summary: 'Upsert object maps and match rules' })
  @ApiOkResponse({ type: [ImportObjectMapDto] })
  @Put('sessions/:id/object-maps')
  async upsertObjectMaps(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ParseArrayPipe({ items: UpsertImportObjectMapDto }))
    items: UpsertImportObjectMapDto[],
  ): Promise<ImportObjectMapDto[]> {
    return this.importService.upsertObjectMaps(id, items);
  }

  @ApiOperation({ summary: 'Remove a match field from an object map' })
  @ApiOkResponse({ type: ImportObjectMapDto })
  @Delete('sessions/:id/object-maps/:objectMapId/match-fields/:fieldId')
  async removeMatchField(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('objectMapId', new ParseUUIDPipe({ version: '4' })) objectMapId: string,
    @Param('fieldId', new ParseUUIDPipe({ version: '4' })) fieldId: string,
  ): Promise<ImportObjectMapDto> {
    return this.importService.removeMatchField(id, objectMapId, fieldId);
  }

  @ApiOperation({ summary: 'Replace field maps for a session' })
  @ApiOkResponse({ type: [ImportFieldMapDto] })
  @Put('sessions/:id/field-maps')
  async replaceFieldMaps(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ParseArrayPipe({ items: UpsertImportFieldMapDto }))
    items: UpsertImportFieldMapDto[],
  ): Promise<ImportFieldMapDto[]> {
    return this.importService.replaceFieldMaps(id, items);
  }

  @ApiOperation({ summary: 'Create draft association type' })
  @ApiOkResponse({ type: ImportDraftAssociationTypeDto })
  @Post('sessions/:id/draft-association-types')
  async createDraftAssociationType(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateImportDraftAssociationTypeDto,
  ): Promise<ImportDraftAssociationTypeDto> {
    return this.importService.createDraftAssociationType(id, dto);
  }

  @ApiOperation({ summary: 'Add link rules for a session' })
  @ApiOkResponse({ type: [ImportLinkRuleDto] })
  @Put('sessions/:id/link-rules')
  async addLinkRules(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ParseArrayPipe({ items: UpsertImportLinkRuleDto }))
    items: UpsertImportLinkRuleDto[],
  ): Promise<ImportLinkRuleDto[]> {
    return this.importService.addLinkRules(id, items);
  }

  @ApiOperation({ summary: 'Update a link rule' })
  @ApiOkResponse({ type: ImportLinkRuleDto })
  @Put('sessions/:id/link-rules/:ruleId')
  async updateLinkRule(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('ruleId', new ParseUUIDPipe({ version: '4' })) ruleId: string,
    @Body() dto: UpdateImportLinkRuleDto,
  ): Promise<ImportLinkRuleDto> {
    return this.importService.updateLinkRule(id, ruleId, dto);
  }

  @ApiOperation({ summary: 'Delete a link rule' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Delete('sessions/:id/link-rules/:ruleId')
  async deleteLinkRule(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('ruleId', new ParseUUIDPipe({ version: '4' })) ruleId: string,
  ): Promise<MessageResponseDto> {
    await this.importService.deleteLinkRule(id, ruleId);
    return { message: 'Deleted successfully.' };
  }

  @ApiOperation({ summary: 'Validate an import session' })
  @ApiOkResponse({ type: ImportSessionDto })
  @Post('sessions/:id/validate')
  async validateSession(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ImportSessionDto> {
    return this.importService.validateSession(id);
  }

  @ApiOperation({ summary: 'Parse import rows from storage' })
  @ApiOkResponse({ type: ImportRowsParseResponseDto })
  @Post('sessions/:id/rows')
  async parseRows(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ImportRowsParseResponseDto> {
    return this.importService.parseRowsFromStorage(id);
  }

  @ApiOperation({ summary: 'Create import job' })
  @ApiOkResponse({ type: ImportJobDto })
  @Post('sessions/:id/jobs')
  async createJob(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ImportJobDto> {
    return this.importService.createJob(id);
  }

  @ApiOperation({ summary: 'Get import job status' })
  @ApiOkResponse({ type: ImportJobDto })
  @Get('sessions/:id/jobs/:jobId')
  async getJob(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ): Promise<ImportJobDto> {
    return this.importService.getJob(id, jobId);
  }

  @ApiOperation({ summary: 'List import results' })
  @ApiOkResponse({ type: ImportRowResultListResponseDto })
  @Get('sessions/:id/results')
  async getResults(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: ImportResultsQueryDto,
  ): Promise<ImportRowResultListResponseDto> {
    return this.importService.getResults(id, query);
  }
}
