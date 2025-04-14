import { Controller } from '@nestjs/common';
import { CrmObjectFieldService } from './crm-object-field.service';

@Controller('crm-object-field')
export class CrmObjectFieldController {
  constructor(private readonly crmObjectFieldService: CrmObjectFieldService) {}
}
