import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Visibility } from '../types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePuzzleDto {
  @ApiProperty({
    example: 'Lake Tahoe',
    description: 'Defines the display name of the puzzle',
    required: true,
    minLength: 32,
    maxLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  title: string;

  @ApiProperty({
    example: Visibility.Private,
    required: true,
    enum: Visibility,
    default: Visibility.Private,
    description:
      'Defines the visibility of the puzzle. Either public, private or invite-only using an invite link',
  })
  @IsEnum(Visibility)
  visibility: Visibility;

  @ApiProperty({
    example: true,
    required: true,
    default: false,
    description:
      'Defines a flag which indicates whether to refresh the invite key when updating the puzzle',
  })
  @IsBoolean()
  updateInviteKey: boolean;
}
