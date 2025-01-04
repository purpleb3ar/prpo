import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';
import { Visibility } from '../types';
import { Transform } from 'class-transformer';

export class CreatePuzzleDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  title: string;

  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNotEmpty()
  rows: number;

  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNotEmpty()
  columns: number;

  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNotEmpty()
  size: number;

  @IsEnum(Visibility)
  visibility: Visibility;
}
