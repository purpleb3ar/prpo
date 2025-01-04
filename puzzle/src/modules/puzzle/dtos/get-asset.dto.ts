import { IsEnum, IsMongoId, IsString } from 'class-validator';
import { PuzzleAsset } from '../types';

export class GetPuzzleAssetDto {
  @IsMongoId()
  id: string;

  @IsEnum(PuzzleAsset)
  assetType: PuzzleAsset;
}
