import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { NatsModule } from '../nats/nats.module';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    NatsModule,
  ],
  controllers: [UserController],
  providers: [],
  exports: [],
})
export class UserModule {}
