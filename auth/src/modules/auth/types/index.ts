import { ApiProperty } from '@nestjs/swagger';

export enum Provider {
  Local = 'local',
  Google = 'google',
}

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export class TokenPayload {
  @ApiProperty({
    description: 'ID of the user this token was generated for',
    example: '677818f3e259f76a575fda17',
  })
  id: string;
  @ApiProperty({
    description: 'The provider which the user used to create their account',
    example: 'local',
    enum: Provider,
  })
  provider: Provider;
  @ApiProperty({
    description: 'The users role within our system',
    example: 'default',
    enum: UserRole,
  })
  role: UserRole;
  @ApiProperty({
    description: 'Username of the user',
    example: 'inexperiencted-harlot',
  })
  username: string;
}
