import { IsInt, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateSimulationDto {
  @IsUUID('4', { message: 'customerId must be a valid UUID v4.' })
  @IsNotEmpty({ message: 'customerId is required.' })
  customerId: string;

  @IsInt({ message: 'activeUsers must be an integer.' })
  @Min(0, { message: 'activeUsers must be greater than or equal to 0.' })
  activeUsers: number;

  @IsNumber({}, { message: 'storageGb must be a valid number.' })
  @Min(0, { message: 'storageGb must be greater than or equal to 0.' })
  storageGb: number;

  @IsInt({ message: 'apiCalls must be an integer.' })
  @Min(0, { message: 'apiCalls must be greater than or equal to 0.' })
  apiCalls: number;
}
