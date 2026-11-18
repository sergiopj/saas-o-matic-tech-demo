import {
  Controller,
  Get,
  Post,
  Patch,
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
import { UpdateCustomerUseCase } from '../../../../application/use-cases/update-customer.use-case';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerLiteResponseDto } from './dto/customer-lite-response.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly listCustomersUseCase: ListCustomersUseCase,
    private readonly getCustomerDetailUseCase: GetCustomerDetailUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
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
    @Query() query: ListCustomersQueryDto,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<CustomerResponseDto[] | CustomerLiteResponseDto[]> {
    const { items, total } = await this.listCustomersUseCase.execute({
      term: query.search,
      country: query.country,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.order,
    });

    if (res) {
      res.setHeader('X-Total-Count', total.toString());
      if (query.page) res.setHeader('X-Page', query.page.toString());
      if (query.limit) {
        res.setHeader('X-Limit', query.limit.toString());
        res.setHeader(
          'X-Total-Pages',
          Math.max(1, Math.ceil(total / query.limit)).toString(),
        );
      }
    }

    if (query.fields === 'lite') {
      return items.map((item) => CustomerLiteResponseDto.fromDomain(item));
    }

    return items.map((item) => CustomerResponseDto.fromDomain(item));
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<CustomerResponseDto> {
    const customer = await this.getCustomerDetailUseCase.execute(id);
    return CustomerResponseDto.fromDomain(customer);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.updateCustomerUseCase.execute(
      id,
      updateCustomerDto,
    );
    return CustomerResponseDto.fromDomain(customer);
  }
}
