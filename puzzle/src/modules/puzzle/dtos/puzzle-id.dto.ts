import { IsMongoId, IsString } from 'class-validator';

export class PuzzleIdDto {
  @IsMongoId()
  id: string;
}
