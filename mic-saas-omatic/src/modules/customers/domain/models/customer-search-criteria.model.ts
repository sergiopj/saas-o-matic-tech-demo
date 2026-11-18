/**
 * Canonical Single Source of Truth (SSOT) for customer sortable fields.
 * Runtime array enables zero-duplication runtime validation while 'as const'
 * derives the compile-time TypeScript union type.
 */
export const CUSTOMER_SORTABLE_FIELDS = [
  'companyName',
  'createdAt',
  'country',
  'taxId',
] as const;

export type CustomerSortField = (typeof CUSTOMER_SORTABLE_FIELDS)[number];

export const SORT_ORDER_DIRECTIONS = ['ASC', 'DESC'] as const;
export type SortOrderDirection = (typeof SORT_ORDER_DIRECTIONS)[number];

/**
 * Type guard for validating sort fields at runtime without type casting or 'any'.
 */
export function isCustomerSortField(value: unknown): value is CustomerSortField {
  return (
    typeof value === 'string' &&
    (CUSTOMER_SORTABLE_FIELDS as readonly string[]).includes(value)
  );
}

/**
 * Type guard for validating sort order directions at runtime.
 */
export function isSortOrderDirection(value: unknown): value is SortOrderDirection {
  return (
    typeof value === 'string' &&
    (SORT_ORDER_DIRECTIONS as readonly string[]).includes(
      value.toUpperCase() as SortOrderDirection,
    )
  );
}

/**
 * Cohesive sorting specification.
 */
export interface CustomerSortOptions {
  field: CustomerSortField;
  order: SortOrderDirection;
}

/**
 * Parameter Object encapsulating query, filtering, pagination, and sorting criteria.
 * Eliminates the Long Parameter List code smell in Hexagonal application use cases and ports.
 */
export interface CustomerSearchCriteria {
  term?: string;
  country?: string;
  page?: number;
  limit?: number;
  sortBy?: CustomerSortField;
  sortOrder?: SortOrderDirection;
}

/**
 * Generic contract for paginated query results.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
}
