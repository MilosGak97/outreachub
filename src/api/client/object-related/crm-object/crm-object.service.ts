import { Injectable } from '@nestjs/common';
import { CrmObjectRepository } from '../../../repositories/postgres/object/crm-object.repository';

@Injectable()
export class CrmObjectService {
  constructor(private readonly crmObjectRepository: CrmObjectRepository) {}
}
