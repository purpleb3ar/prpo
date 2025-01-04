import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.get<string>('app.jwt.secret'),
          signOptions: {
            algorithm: config.get<Algorithm>('app.jwt.algorithm'),
            expiresIn: config.get<string>('app.jwt.expiresIn'),
          },
          verifyOptions: {
            algorithms: [config.get<Algorithm>('app.jwt.algorithm')],
            ignoreExpiration: false,
            issuer: config.get<string>('app.jwt.issuer'),
          },
        };
      },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [],
})
export class AuthModule {}
