import { Injectable } from '@nestjs/common';
import { CrmObjectTypeRepository } from '../../../repositories/postgres/object-related/crm-object-type.repository';

@Injectable()
export class CrmObjectTypeService {
  constructor(
    private readonly crmObjectTypeRepository: CrmObjectTypeRepository,
  ) {}
}
