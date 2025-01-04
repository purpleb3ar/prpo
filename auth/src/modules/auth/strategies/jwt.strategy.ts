import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../types';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const algorithms = [configService.get<string>('app.jwt.algorithm')];
    const cookieName = configService.get<string>('app.cookie.name');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request.cookies[cookieName];
        },
      ]),
      secretOrKey: configService.get<string>('app.jwt.secret'),
      algorithms,
      issuer: configService.get<string>('app.jwt.issuer'),
    });
  }

  async validate(payload: TokenPayload) {
    return payload;
  }
}
