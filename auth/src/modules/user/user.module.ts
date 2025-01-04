import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Publisher } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { NatsModule } from '../nats/nats.module';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { CookieService } from 'src/app/services/cookie.service';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    forwardRef(() => AuthModule),
    NatsModule,
  ],
  controllers: [UserController],
  providers: [UserService, CookieService],
  exports: [UserService],
})
export class UserModule {}
