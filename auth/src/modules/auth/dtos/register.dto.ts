import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'inexperienced-harlot',
    required: true,
    maxLength: 32,
    minLength: 3,
  })
  @Length(3, 32)
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'Medv3dk!90_2',
    required: true,
    description:
      'Password must be at least 8 characters. (1 uppercase, 1 lowercase, 1 symbol, 1 number)',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    {
      message:
        'Password must be at least 8 characters. (1 uppercase, 1 lowercase, 1 symbol, 1 number)',
    },
  )
  @IsString()
  @IsNotEmpty()
  password: string;
}
