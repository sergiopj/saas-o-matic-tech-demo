import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateCustomerUseCase } from '../../../../application/use-cases/create-customer.use-case';
import { ListCustomersUseCase } from '../../../../application/use-cases/list-customers.use-case';
import { GetCustomerDetailUseCase } from '../../../../application/use-cases/get-customer-detail.use-case';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerDetailResponseDto } from './dto/customer-detail-response.dto';
import { CustomerLiteResponseDto } from './dto/customer-lite-response.dto';
import {
  isCustomerSortField,
  isSortOrderDirection,
} from '../../../../domain/models/customer-search-criteria.model';
import type { SortOrderDirection } from '../../../../domain/models/customer-search-criteria.model';

/**
 * Primary inbound REST controller exposing Customer management endpoints.
 * Supports multi-parameter search, fiscal jurisdiction filtering, and RFC-compliant pagination.
 */
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly listCustomersUseCase: ListCustomersUseCase,
    private readonly getCustomerDetailUseCase: GetCustomerDetailUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.createCustomerUseCase.execute(createCustomerDto);
    return CustomerResponseDto.fromDomain(customer);
  }

  @Get()
  async list(
    @Query()
    query: {
      search?: string;
      country?: string;
      page?: string;
      limit?: string;
      sortBy?: string;
      order?: string;
      sortOrder?: string;
      fields?: string;
    },
    @Res({ passthrough: true }) res?: Response,
  ): Promise<CustomerResponseDto[] | CustomerLiteResponseDto[]> {
    const { search, country, page, limit, sortBy, order, sortOrder, fields } =
      query;
    const pageNum = page ? Number.parseInt(page, 10) : undefined;
    const limitNum = limit ? Number.parseInt(limit, 10) : undefined;

    const cleanSortBy = isCustomerSortField(sortBy) ? sortBy : undefined;

    const rawOrder = sortOrder || order;
    const cleanOrder: SortOrderDirection | undefined =
      rawOrder && isSortOrderDirection(rawOrder)
        ? (rawOrder.toUpperCase() as SortOrderDirection)
        : undefined;

    const { items, total } = await this.listCustomersUseCase.execute({
      term: search,
      country,
      page: pageNum,
      limit: limitNum,
      sortBy: cleanSortBy,
      sortOrder: cleanOrder,
    });

    if (res) {
      res.setHeader('X-Total-Count', total.toString());
      if (pageNum) res.setHeader('X-Page', pageNum.toString());
      if (limitNum) {
        res.setHeader('X-Limit', limitNum.toString());
        res.setHeader(
          'X-Total-Pages',
          Math.max(1, Math.ceil(total / limitNum)).toString(),
        );
      }
    }

    if (fields === 'lite') {
      return items.map((item) => CustomerLiteResponseDto.fromDomain(item));
    }

    return items.map((item) => CustomerResponseDto.fromDomain(item));
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<CustomerResponseDto> {
    const customer = await this.getCustomerDetailUseCase.execute(id);
    return CustomerResponseDto.fromDomain(customer);
  }
}
