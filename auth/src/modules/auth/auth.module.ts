import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CookieService } from 'src/app/services/cookie.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('app.jwt.secret'),
        signOptions: {
          algorithm: config.get<Algorithm>('app.jwt.algorithm'),
          expiresIn: config.get<string>('app.jwt.expiresIn'),
          issuer: config.get<string>('app.jwt.issuer'),
        },
      }),
    }),
    PassportModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    GoogleStrategy,
    JwtStrategy,
    CookieService,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
