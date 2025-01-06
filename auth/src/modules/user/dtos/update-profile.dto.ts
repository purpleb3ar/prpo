import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
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
}
