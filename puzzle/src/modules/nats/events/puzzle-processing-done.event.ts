import { Subjects } from './subjects';

export interface PuzzleProcessingDoneEvent {
  subject: Subjects.PuzzleProcessingDone;
  data: {
    id: string;
  };
}
