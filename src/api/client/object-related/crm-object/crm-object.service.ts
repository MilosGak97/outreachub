import { Injectable } from '@nestjs/common';
import { CrmObjectRepository } from '../../../repositories/postgres/object-related/crm-object.repository';

@Injectable()
export class CrmObjectService {
  constructor(private readonly crmObjectRepository: CrmObjectRepository) {}
}
