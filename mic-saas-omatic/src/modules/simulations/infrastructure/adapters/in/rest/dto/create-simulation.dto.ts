import { IsInt, IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';

export class CreateSimulationDto {
  @IsString({ message: 'customerId must be a string.' })
  @IsNotEmpty({ message: 'customerId is required.' })
  @Matches(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    { message: 'customerId must be a valid UUID.' },
  )
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

