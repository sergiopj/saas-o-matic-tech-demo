export const CUSTOMER_SORTABLE_FIELDS = [
  'companyName',
  'createdAt',
  'country',
  'taxId',
] as const;

export type CustomerSortField = (typeof CUSTOMER_SORTABLE_FIELDS)[number];

export const SORT_ORDER_DIRECTIONS = ['ASC', 'DESC'] as const;
export type SortOrderDirection = (typeof SORT_ORDER_DIRECTIONS)[number];

export function isCustomerSortField(value: unknown): value is CustomerSortField {
  return (
    typeof value === 'string' &&
    (CUSTOMER_SORTABLE_FIELDS as readonly string[]).includes(value)
  );
}

export function isSortOrderDirection(value: unknown): value is SortOrderDirection {
  return (
    typeof value === 'string' &&
    (SORT_ORDER_DIRECTIONS as readonly string[]).includes(
      value.toUpperCase() as SortOrderDirection,
    )
  );
}

export interface CustomerSortOptions {
  field: CustomerSortField;
  order: SortOrderDirection;
}

export interface CustomerSearchCriteria {
  term?: string;
  country?: string;
  page?: number;
  limit?: number;
  sortBy?: CustomerSortField;
  sortOrder?: SortOrderDirection;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}
