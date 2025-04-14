import { Controller } from '@nestjs/common';
import { CrmAssociationTypeService } from './crm-association-type.service';

@Controller('crm-association-type')
export class CrmAssociationTypeController {
  constructor(
    private readonly  crmAssociationTypeService: CrmAssociationTypeService
  ) {
  }
}
