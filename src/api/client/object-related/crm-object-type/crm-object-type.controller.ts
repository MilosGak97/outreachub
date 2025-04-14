import { Controller } from '@nestjs/common';
import { CrmObjectTypeService } from './crm-object-type.service';

@Controller('crm-object-type')
export class CrmObjectTypeController {
  constructor(private readonly crmObjectTypeService: CrmObjectTypeService) {}
}
