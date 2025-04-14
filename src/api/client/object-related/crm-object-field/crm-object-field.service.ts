import { Injectable } from '@nestjs/common';
import { CrmObjectFieldRepository } from '../../../repositories/postgres/object-related/crm-object-field.repository';

@Injectable()
export class CrmObjectFieldService {
  constructor(
    private readonly crmObjectFieldRepository: CrmObjectFieldRepository,
  ) {}
}
