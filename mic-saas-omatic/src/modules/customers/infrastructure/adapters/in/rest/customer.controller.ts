import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateCustomerUseCase } from '../../../../application/use-cases/create-customer.use-case';
import { ListCustomersUseCase } from '../../../../application/use-cases/list-customers.use-case';
import { GetCustomerDetailUseCase } from '../../../../application/use-cases/get-customer-detail.use-case';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerLiteResponseDto } from './dto/customer-lite-response.dto';
import type {
  CustomerSortField,
  SortOrderDirection,
} from '../../../../application/ports/out/customer-repository.port';

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
    @Query('search') search?: string,
    @Query('country') country?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Res({ passthrough: true }) res?: Response,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('fields') fields?: string,
  ): Promise<CustomerResponseDto[] | CustomerLiteResponseDto[]> {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;

    const validSortFields: CustomerSortField[] = [
      'companyName',
      'createdAt',
      'country',
      'taxId',
    ];
    const cleanSortBy = validSortFields.includes(sortBy as any)
      ? (sortBy as CustomerSortField)
      : undefined;

    const rawOrder = sortOrder || order;
    const cleanOrder: SortOrderDirection | undefined =
      rawOrder &&
      (rawOrder.toUpperCase() === 'ASC' || rawOrder.toUpperCase() === 'DESC')
        ? (rawOrder.toUpperCase() as SortOrderDirection)
        : undefined;

    const { items, total } = await this.listCustomersUseCase.execute(
      search,
      country,
      pageNum,
      limitNum,
      cleanSortBy,
      cleanOrder,
    );

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
