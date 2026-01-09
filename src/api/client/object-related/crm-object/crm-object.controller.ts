import { Controller } from '@nestjs/common';
import { CrmObjectService } from './crm-object.service';

@Controller('crm-object')
export class CrmObjectController {
  constructor(
    private readonly crmObjectService: CrmObjectService
  ) {

  }
}
