import { IsEnum, IsMongoId, IsString } from 'class-validator';
import { PuzzleAsset } from '../types';
import { ApiProperty } from '@nestjs/swagger';

export class GetPuzzleAssetDto {
  @ApiProperty({
    type: 'string',
    required: true,
    example: '677818f3e259f76a575fda17',
    description: 'A valid MongoDB ObjectId of the puzzle to be considered',
  })
  @IsMongoId()
  id: string;

  @ApiProperty({
    enum: PuzzleAsset,
    default: PuzzleAsset.Specification,
    required: true,
    description: 'Defines the type of asset that should be served',
    example: PuzzleAsset.Spritesheet,
  })
  @IsEnum(PuzzleAsset)
  assetType: PuzzleAsset;
}
