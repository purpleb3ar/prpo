import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Visibility } from '../types';

export class UpdatePuzzleDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  title: string;

  @IsEnum(Visibility)
  visibility: Visibility;

  @IsBoolean()
  updateInviteKey: boolean;
}
