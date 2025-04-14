import { Controller } from '@nestjs/common';
import { CrmObjectAssociationService } from './crm-object-association.service';

@Controller('crm-object-association')
export class CrmObjectAssociationController {
  constructor(
    private readonly crmObjectAssociationService: CrmObjectAssociationService,
  ) {
  }
}
