import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @Length(3, 32)
  @IsString()
  @IsNotEmpty()
  username: string;
}
