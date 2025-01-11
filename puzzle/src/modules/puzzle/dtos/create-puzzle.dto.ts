import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';
import { Visibility } from '../types';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePuzzleDto {
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
    example: 11,
    required: true,
    description: 'Defines the number of rows the generators should use',
    type: 'number',
  })
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNotEmpty()
  rows: number;

  @ApiProperty({
    example: 21,
    required: true,
    description: 'Defines the number of columns the generator should use',
    type: 'number',
  })
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNotEmpty()
  columns: number;

  @ApiProperty({
    example: 90,
    required: true,
    type: 'number',
    description: 'Defines the size of the individual puzzle pieces',
  })
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNotEmpty()
  size: number;

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
    required: true,
    format: 'binary',
    type: 'string',
    description:
      'Defines the source image from which the jigsaw puzzle should be derived',
  })
  image: Express.Multer.File;
}
