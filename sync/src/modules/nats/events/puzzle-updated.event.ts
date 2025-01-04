import { ProcessingState, Visibility } from 'src/modules/puzzle/types';
import { Subjects } from './subjects';

export interface PuzzleUpdatedEvent {
  subject: Subjects.PuzzleUpdated;
  data: {
    id: string;
    title: string;
    visibility: Visibility;
    status: ProcessingState;
    version: number;
    collaborators: string[];
  };
}
