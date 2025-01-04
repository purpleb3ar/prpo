import { Subjects } from './subjects';

export interface PuzzleCreatedEvent {
  subject: Subjects.PuzzleCreated;
  data: {
    id: string;
    title: string;

    rows: number;
    columns: number;
    size: number;
    visibility: string;
    status: string;

    objectNames: {
      spritesheet: string;
      thumbnail: string;
      specification: string;
    };
  };
}
