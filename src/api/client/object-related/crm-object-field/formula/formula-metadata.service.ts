import { BadRequestException, Injectable } from '@nestjs/common';
import { FormulaCategoryToFunctionsDto } from '../dto/formula-category-to-functions.dto';
import { FormulaFunctionDefinitionDto } from '../dto/formula-function-definition.dto';
import { FormulaCategory } from './formula-category.enum';
import { CATEGORY_TO_FUNCTIONS, FUNCTION_PALETTE } from './function-palette';
import { FormulaCategoryResponseDto } from '../dto/formula-category-response.dto';

@Injectable()
export class FormulaMetadataService {
  getFormulaCategories(): Promise<FormulaCategoryResponseDto> {
    return Promise.resolve({
      values: Object.values(FormulaCategory) as FormulaCategory[],
    });
  }

  getFormulaCategoryToFunctions(categories?: FormulaCategory[]): FormulaCategoryToFunctionsDto {
    if (!categories?.length) {
      return CATEGORY_TO_FUNCTIONS;
    }

    const uniqueCategories = Array.from(new Set(categories));
    return uniqueCategories.reduce(
      (acc, category) => {
        acc[category] = CATEGORY_TO_FUNCTIONS[category];
        return acc;
      },
      {} as Partial<Record<FormulaCategory, string[]>>,
    );
  }

  getFormulaFunctions(
    category?: FormulaCategory,
    name?: string,
  ): FormulaFunctionDefinitionDto[] {
    let functions = Object.values(FUNCTION_PALETTE);

    if (category) {
      functions = functions.filter((fn) => fn.category === category);
    }

    if (name) {
      const normalizedName = name.toUpperCase();
      functions = functions.filter((fn) => fn.name === normalizedName);
      if (!functions.length) {
        throw new BadRequestException(`Unknown formula function "${name}".`);
      }
    }

    return functions;
  }
}
