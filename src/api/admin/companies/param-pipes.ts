import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

export const companyIdParamPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () =>
    new BadRequestException('Invalid company id format. Expected UUID.'),
});

export const userIdParamPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () =>
    new BadRequestException('Invalid user id format. Expected UUID.'),
});
