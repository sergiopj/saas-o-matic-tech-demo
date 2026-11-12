import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateSimulationUseCase } from '../../../../application/use-cases/create-simulation.use-case';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { SimulationResponseDto } from './dto/simulation-response.dto';

@Controller('simulations')
export class SimulationController {
  constructor(
    private readonly createSimulationUseCase: CreateSimulationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSimulationDto: CreateSimulationDto,
  ): Promise<SimulationResponseDto> {
    const simulation = await this.createSimulationUseCase.execute(createSimulationDto);
    return SimulationResponseDto.fromDomain(simulation);
  }
}
