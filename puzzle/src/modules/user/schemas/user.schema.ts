import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserDoc>;

export interface UserDoc extends mongoose.Document {
  username: string;
  version: number;
}

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
export class User {
  @ApiProperty({
    description: 'Defines the username of the user',
    example: 'inexperienced-harlot',
    required: true,
    type: 'string',
  })
  @Prop({ unique: true, required: true })
  username: string;

  @ApiProperty({
    description: 'Defines the MongoDB ObjectId of the user',
    example: '677818f3e259f76a575fda17',
    required: true,
    type: 'string',
  })
  id: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
