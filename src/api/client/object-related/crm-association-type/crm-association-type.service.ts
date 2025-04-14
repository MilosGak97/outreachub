import { Injectable } from '@nestjs/common';
import { CrmAssociationTypeRepository } from '../../../repositories/postgres/object-related/crm-association-type.repository';

@Injectable()
export class CrmAssociationTypeService {
  constructor(
    private readonly crmAssociationTypeRepository: CrmAssociationTypeRepository,
  ) {}
}
