import { Injectable } from '@nestjs/common';
import { StatesAbbreviation } from '../enums/common/states-abbreviation.enum';
import { StatesResponseDto } from './dto/states-response.dto';
import { countries } from 'country-codes-flags-phone-codes';
import { PhoneNumbersResponseDto } from './dto/phone-numbers-response.dto';
import { PhoneNumbersDto } from './dto/phone-numbers.dto';
import { CountiesResponseDto } from './dto/counties-response.dto';
import { CountiesDynamoService } from './aws/counties-dynamo.service';
import { CountiesQueryDto } from './dto/counties-query.dto';

@Injectable()
export class CommonService {
  constructor(private readonly countiesDynamoService: CountiesDynamoService) {}

  async getStates(): Promise<StatesResponseDto> {
    const states = Object.values(StatesAbbreviation);
    return { states };
  }

  async getCounties(query: CountiesQueryDto = {}): Promise<CountiesResponseDto> {
    const { search, state, limit, offset } = query;
    const normalizedSearch = search?.trim();
    const requestedLimit = Number.isFinite(limit) ? limit : undefined;
    const requestedOffset = Number.isFinite(offset) ? offset : undefined;
    const safeLimit =
      requestedLimit !== undefined && requestedLimit > 0 ? requestedLimit : 20;
    const safeOffset =
      requestedOffset !== undefined && requestedOffset >= 0 ? requestedOffset : 0;

    const counties = await this.countiesDynamoService.getCounties(
      normalizedSearch || undefined,
      state,
    );

    const totalRecords = counties.length;
    const paginatedResult = counties.slice(safeOffset, safeOffset + safeLimit);
    const totalPages = safeLimit > 0 ? Math.ceil(totalRecords / safeLimit) : 0;
    const currentPage = safeLimit > 0 ? Math.floor(safeOffset / safeLimit) + 1 : 1;

    return {
      result: paginatedResult,
      totalRecords,
      currentPage,
      totalPages,
      limit: safeLimit,
      offset: safeOffset,
    };
  }

  async getPhoneNumbers(phoneNumbersDto: PhoneNumbersDto): Promise<PhoneNumbersResponseDto> {
    const { limit, offset } = phoneNumbersDto;
    const countriesFiltered = countries.map((country) => ({
      name: country.name,
      code: country.code,
      flag: `https://flagsapi.com/${country.code}/flat/16.png`,
      prefix: country.dialCode,
    }));


    const totalRecords = countriesFiltered.length;

    // Get the paginated result.
    const result = countriesFiltered.slice(offset, offset + limit);

    // Calculate the total pages and the current page.
    const totalPages = Math.ceil(totalRecords / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    // Construct the response object.
    const response: PhoneNumbersResponseDto = {
      result,
      totalRecords,
      currentPage,
      totalPages,
      limit,
      offset,
    };

    return response;
  }
}
