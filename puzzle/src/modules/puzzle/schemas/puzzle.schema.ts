import { Prop, Schema, SchemaFactory, Virtual } from '@nestjs/mongoose';
import { User, UserDoc } from 'src/modules/user/schemas/user.schema';
import * as mongoose from 'mongoose';
import { ProcessingState, Visibility } from '../types';

export interface PuzzleDoc extends mongoose.Document {
  title: string;
  rows: number;
  columns: number;
  size: number;
  owner: UserDoc;
  visibility: Visibility;
  status: ProcessingState;
  inviteKey: string | undefined;
  collaborators: UserDoc[];
  version: number;
}

export type PuzzleDocument = mongoose.HydratedDocument<PuzzleDoc>;

@Schema({
  optimisticConcurrency: true,
  versionKey: 'version',
  id: true,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
    },
  },
  toObject: {
    virtuals: true,
  },
})
export class Puzzle {
  @Prop({ unique: true, required: true })
  title: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: UserDoc;

  @Prop({ required: true })
  rows: number;

  @Prop({ required: true })
  columns: number;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true, enum: Visibility, default: Visibility.Private })
  visibility: Visibility;

  @Prop({
    required: true,
    enum: ProcessingState,
    default: ProcessingState.Created,
  })
  status: ProcessingState;

  @Prop({
    unique: true,
    sparse: true,
  })
  inviteKey: string;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    required: true,
    default: [],
  })
  collaborators: UserDoc[];
}

export const PuzzleSchema = SchemaFactory.createForClass(Puzzle);
