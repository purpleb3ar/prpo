import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class PuzzleIdDto {
  @ApiProperty({
    type: 'string',
    required: true,
    example: '677818f3e259f76a575fda17',
    description: 'A valid MongoDB ObjectId of the puzzle to be considered',
  })
  @IsMongoId()
  id: string;
}
