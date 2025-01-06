import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({
    example: 'inexperienced-harlot',
    required: true,
  })
  username: string;

  @ApiProperty({
    example: 'Medv3dk!90_2',
    required: true,
  })
  password: string;
}
