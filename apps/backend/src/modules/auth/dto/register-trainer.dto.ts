import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class RegisterTrainerDto {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsString()
  @IsOptional()
  preferredLanguage?: string
}
