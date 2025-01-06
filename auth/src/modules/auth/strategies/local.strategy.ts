import { Injectable } from '@nestjs/common';
import { PassportSerializer, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string) {
    console.log(email, password);
    const user = await this.authService.validateUser(email, password);
    return user;
  }
}
