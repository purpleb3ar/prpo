import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Provider, UserRole } from 'src/modules/auth/types';

export type UserDocument = HydratedDocument<UserDoc>;

export interface UserDoc extends mongoose.Document {
  username: string;
  password: string;
  googleId?: string;
  role: UserRole;
  provider: Provider;
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

  @Prop({ required: false })
  password: string;

  @Prop({ index: { unique: true, sparse: true } })
  googleId: string;

  @Prop({ required: true, enum: Provider, default: Provider.Local })
  provider: Provider;

  @Prop({ required: true, enum: UserRole, default: UserRole.User })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
