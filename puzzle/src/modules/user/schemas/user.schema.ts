import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
  @Prop({ unique: true, required: true })
  username: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
