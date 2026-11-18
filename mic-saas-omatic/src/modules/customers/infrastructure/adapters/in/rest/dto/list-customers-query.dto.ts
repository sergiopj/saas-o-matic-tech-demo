import { Type, Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  CUSTOMER_SORTABLE_FIELDS,
  SORT_ORDER_DIRECTIONS,
} from '../../../../../domain/models/customer-search-criteria.model';
import type {
  CustomerSortField,
  SortOrderDirection,
} from '../../../../../domain/models/customer-search-criteria.model';

export class ListCustomersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(CUSTOMER_SORTABLE_FIELDS)
  sortBy?: CustomerSortField;

  // Normalizes query string values like 'asc'/'desc' to uppercase to match domain directions
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(SORT_ORDER_DIRECTIONS)
  order?: SortOrderDirection;

  // Read-model projection: 'lite' returns only id, companyName, and country for high-performance dropdowns
  @IsOptional()
  @IsIn(['lite', 'full'])
  fields?: 'lite' | 'full';
}
