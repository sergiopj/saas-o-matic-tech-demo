import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CreateSimulationUseCase } from '../../../../application/use-cases/create-simulation.use-case';
import { ListSimulationsByCustomerUseCase } from '../../../../application/use-cases/list-simulations-by-customer.use-case';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { SimulationResponseDto } from './dto/simulation-response.dto';

@Controller('simulations')
export class SimulationController {
  constructor(
    private readonly createSimulationUseCase: CreateSimulationUseCase,
    private readonly listSimulationsByCustomerUseCase: ListSimulationsByCustomerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSimulationDto: CreateSimulationDto,
  ): Promise<SimulationResponseDto> {
    const simulation = await this.createSimulationUseCase.execute(createSimulationDto);
    return SimulationResponseDto.fromDomain(simulation);
  }

  @Get()
  async findByCustomer(
    @Query('customerId') customerId: string,
  ): Promise<SimulationResponseDto[]> {
    const simulations = await this.listSimulationsByCustomerUseCase.execute(customerId);
    return simulations.map(SimulationResponseDto.fromDomain);
  }
}
