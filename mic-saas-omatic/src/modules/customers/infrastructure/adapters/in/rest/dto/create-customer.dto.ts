import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  taxId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'Country must be a valid 2-letter ISO code.',
  })
  country: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  selectedPlan: string;
}

