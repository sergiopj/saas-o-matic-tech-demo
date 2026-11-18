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

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (value.toUpperCase() as SortOrderDirection) : value,
  )
  @IsIn(SORT_ORDER_DIRECTIONS)
  order?: SortOrderDirection;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (value.toUpperCase() as SortOrderDirection) : value,
  )
  @IsIn(SORT_ORDER_DIRECTIONS)
  sortOrder?: SortOrderDirection;

  @IsOptional()
  @IsIn(['lite', 'full'])
  fields?: 'lite' | 'full';
}
