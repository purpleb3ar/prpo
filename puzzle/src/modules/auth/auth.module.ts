import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('app.jwt.secret'),
        signOptions: {
          algorithm: config.get<Algorithm>('app.jwt.algorithm'),
          expiresIn: config.get<string>('app.jwt.expiresIn'),
        },
      }),
    }),
    PassportModule,
  ],
  providers: [JwtStrategy],
  exports: [],
  controllers: [],
})
export class AuthModule {}
