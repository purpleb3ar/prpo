import { ProcessingState, Visibility } from 'src/modules/puzzle/types';
import { Subjects } from './subjects';

export interface PuzzleCreatedEvent {
  subject: Subjects.PuzzleCreated;
  data: {
    id: string;
    title: string;
    owner: string;

    rows: number;
    columns: number;
    size: number;
    visibility: Visibility;
    status: ProcessingState;

    objectNames: {
      spritesheet: string;
      thumbnail: string;
      specification: string;
    };
  };
}
