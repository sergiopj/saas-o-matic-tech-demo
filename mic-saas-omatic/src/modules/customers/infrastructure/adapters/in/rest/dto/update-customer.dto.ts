import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  taxId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'Country must be a valid 2-letter ISO code.',
  })
  country?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  selectedPlan?: string;
}
