import { Subjects } from './subjects';

export interface PuzzleProcessingStartedEvent {
  subject: Subjects.PuzzleProcessingStarted;
  data: {
    id: string;
  };
}
