import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { hash, verify } from 'argon2';
import { UserDocument } from '../user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dtos/register.dto';
import { generateUsername } from 'unique-username-generator';
import { Provider } from './types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async doPasswordsMatch(actual: string, provided: string) {
    return verify(actual, provided);
  }

  async hashPassword(plain: string) {
    return hash(plain, { hashLength: 40 });
  }

  async validateUser(username: string, password: string) {
    const user = await this.userService.findLocalByUsername(username);

    if (!user) {
      throw new HttpException(
        'User with provided username does not exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.doPasswordsMatch(user.password, password)) {
      throw new HttpException('Incorrect password', HttpStatus.BAD_REQUEST);
    }

    return user;
  }

  async validateGoogleUser(googleUser: any) {
    const { id } = googleUser;

    const user = await this.userService.findByGoogleId(id);

    if (!user) {
      const randomUsername = generateUsername('-');
      const user = await this.userService.createUser({
        provider: Provider.Google,
        googleId: id,
        username: randomUsername,
      });

      return user;
    }

    return user;
  }

  async registerUser(registerDto: RegisterDto) {
    const existingUser = await this.userService.findByUsername(
      registerDto.username,
    );

    if (existingUser) {
      throw new HttpException(
        'Username already exists.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const newUser = await this.userService.createUser({
      username: registerDto.username,
      password: hashedPassword,
      provider: Provider.Local,
    });

    return newUser;
  }

  async generateAccessToken(user: UserDocument) {
    const payload = {
      username: user.username,
      id: user.id,
      provider: user.provider,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload, {
      subject: user.id,
    });

    return token;
  }
}
