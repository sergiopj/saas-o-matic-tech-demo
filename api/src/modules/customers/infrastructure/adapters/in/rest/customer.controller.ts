import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateCustomerUseCase } from '../../../../application/use-cases/create-customer.use-case';
import { ListCustomersUseCase } from '../../../../application/use-cases/list-customers.use-case';
import { GetCustomerDetailUseCase } from '../../../../application/use-cases/get-customer-detail.use-case';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerDetailResponseDto } from './dto/customer-detail-response.dto';

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
  async list(@Query('search') search?: string): Promise<CustomerResponseDto[]> {
    const customers = await this.listCustomersUseCase.execute(search);
    return customers.map(CustomerResponseDto.fromDomain);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<CustomerDetailResponseDto> {
    const customer = await this.getCustomerDetailUseCase.execute(id);
    return CustomerDetailResponseDto.fromDomain(customer, []);
  }
}
