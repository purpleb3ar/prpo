import { IsMongoId } from 'class-validator';

export class PuzzleIdDto {
  @IsMongoId()
  id: string;
}
