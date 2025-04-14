import { Injectable } from '@nestjs/common';
import { StatesAbbreviation } from '../enums/states-abbreviation.enum';
import { StatesResponseDto } from './dto/states-response.dto';
import { countries } from 'country-codes-flags-phone-codes';
import { PhoneNumbersResponseDto } from './dto/phone-numbers-response.dto';
import { PhoneNumbersDto } from './dto/phone-numbers.dto';

@Injectable()
export class CommonService {
  async getStates(): Promise<StatesResponseDto> {
    const states = Object.values(StatesAbbreviation);
    return { states };
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
