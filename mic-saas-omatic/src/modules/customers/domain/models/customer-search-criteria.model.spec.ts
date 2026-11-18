import {
  CUSTOMER_SORTABLE_FIELDS,
  SORT_ORDER_DIRECTIONS,
  isCustomerSortField,
  isSortOrderDirection,
} from './customer-search-criteria.model';

describe('CustomerSearchCriteriaModel', () => {
  describe('CUSTOMER_SORTABLE_FIELDS and isCustomerSortField', () => {
    it('should include companyName, createdAt, country, and taxId in SSOT', () => {
      expect(CUSTOMER_SORTABLE_FIELDS).toEqual([
        'companyName',
        'createdAt',
        'country',
        'taxId',
      ]);
    });

    it('should validate all valid sort fields', () => {
      expect(isCustomerSortField('companyName')).toBe(true);
      expect(isCustomerSortField('createdAt')).toBe(true);
      expect(isCustomerSortField('country')).toBe(true);
      expect(isCustomerSortField('taxId')).toBe(true);
    });

    it('should reject invalid fields, non-strings, null, and undefined', () => {
      expect(isCustomerSortField('invalidField')).toBe(false);
      expect(isCustomerSortField('id')).toBe(false);
      expect(isCustomerSortField(123)).toBe(false);
      expect(isCustomerSortField(null)).toBe(false);
      expect(isCustomerSortField(undefined)).toBe(false);
      expect(isCustomerSortField({})).toBe(false);
    });
  });

  describe('SORT_ORDER_DIRECTIONS and isSortOrderDirection', () => {
    it('should define ASC and DESC directions in SSOT', () => {
      expect(SORT_ORDER_DIRECTIONS).toEqual(['ASC', 'DESC']);
    });

    it('should validate uppercase and lowercase ASC and DESC directions', () => {
      expect(isSortOrderDirection('ASC')).toBe(true);
      expect(isSortOrderDirection('DESC')).toBe(true);
      expect(isSortOrderDirection('asc')).toBe(true);
      expect(isSortOrderDirection('desc')).toBe(true);
    });

    it('should reject invalid directions, non-strings, null, and undefined', () => {
      expect(isSortOrderDirection('INVALID')).toBe(false);
      expect(isSortOrderDirection(123)).toBe(false);
      expect(isSortOrderDirection(null)).toBe(false);
      expect(isSortOrderDirection(undefined)).toBe(false);
    });
  });
});
