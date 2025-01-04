import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Visibility } from '../types';

export interface PuzzleDoc extends mongoose.Document {
  title: string;
  rows: number;
  columns: number;
  owner: string;
  size: number;
  visibility: Visibility;
  collaborators: string[];
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

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  owner: string;

  @Prop({ required: true })
  rows: number;

  @Prop({ required: true })
  columns: number;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true, enum: Visibility, default: Visibility.Private })
  visibility: Visibility;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    required: true,
    default: [],
  })
  collaborators: string[];
}

export const PuzzleSchema = SchemaFactory.createForClass(Puzzle);
