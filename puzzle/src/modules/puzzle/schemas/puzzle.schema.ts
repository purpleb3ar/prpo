import { Prop, Schema, SchemaFactory, Virtual } from '@nestjs/mongoose';
import { User, UserDoc } from 'src/modules/user/schemas/user.schema';
import * as mongoose from 'mongoose';
import { ProcessingState, Visibility } from '../types';
import { ApiProcessingResponse, ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({
    description: 'Defines the display name of the puzzle',
    example: 'Lake Tahoe',
    required: true,
  })
  @Prop({ unique: true, required: true })
  title: string;

  @ApiProperty({
    required: true,
    description: 'Defines the owner or creator of the puzzle',
    type: User,
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: UserDoc;

  @ApiProperty({
    example: 11,
    required: true,
    description: 'Defines the number of rows the generators should use',
    type: 'number',
  })
  @Prop({ required: true })
  rows: number;

  @ApiProperty({
    example: 21,
    required: true,
    description: 'Defines the number of columns the generator should use',
    type: 'number',
  })
  @Prop({ required: true })
  columns: number;

  @ApiProperty({
    example: 90,
    required: true,
    type: 'number',
    description: 'Defines the size of the individual puzzle pieces',
  })
  @Prop({ required: true })
  size: number;

  @ApiProperty({
    example: Visibility.Private,
    required: true,
    enum: Visibility,
    default: Visibility.Private,
    description:
      'Defines the visibility of the puzzle. Either public, private or invite-only using an invite link',
  })
  @Prop({ required: true, enum: Visibility, default: Visibility.Private })
  visibility: Visibility;

  @ApiProperty({
    example: ProcessingState.Created,
    required: true,
    enum: ProcessingState,
    default: ProcessingState.Created,
    description:
      'Defines the current processing state of the puzzle. This property decides puzzle readiness',
  })
  @Prop({
    required: true,
    enum: ProcessingState,
    default: ProcessingState.Created,
  })
  status: ProcessingState;

  @ApiProperty({
    type: 'string',
    required: false,
    description:
      'When the puzzle visiblity is "invite-only", this value represents the invite key which can be used to become a puzzle collaborator',
    example: 'gyS54Ca2HetqVYe4',
  })
  @Prop({
    unique: true,
    sparse: true,
  })
  inviteKey: string;

  @ApiProperty({
    type: [User],
    isArray: true,
    uniqueItems: true,
    description:
      'Defines the list of users which are this puzzles collaborators',
    required: true,
    default: [],
  })
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
