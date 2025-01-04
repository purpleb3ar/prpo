import {
  Body,
  Controller,
  Get,
  HttpCode,
  OnModuleInit,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserDocument } from '../user/schemas/user.schema';
import { RegisterDto } from './dtos/register.dto';
import { GoogleAuthGuard } from './guards/google.guard';
import { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CookieService } from 'src/app/services/cookie.service';

@Controller('auth')
export class AuthController implements OnModuleInit {
  private frontendURL: string;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private cookieService: CookieService,
  ) {}

  onModuleInit() {
    this.frontendURL = this.configService.get('app.frontendURL');
  }

  @HttpCode(200)
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Req() request: { user: UserDocument },
  ) {
    const token = await this.authService.generateAccessToken(request.user);
    this.cookieService.setCookie(res, token);
  }

  @HttpCode(200)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.cookieService.clearCookie(res);
  }

  @HttpCode(201)
  @Post('register')
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() registerDto: RegisterDto,
  ) {
    const user = await this.authService.registerUser(registerDto);
    const token = await this.authService.generateAccessToken(user);
    this.cookieService.setCookie(res, token);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Res({ passthrough: true }) res: Response,
    @Req() request: { user: { id: string } },
  ) {
    const user = await this.authService.validateGoogleUser(request.user);
    const token = await this.authService.generateAccessToken(user);

    this.cookieService.setCookie(res, token);
    res.redirect(this.frontendURL);
  }
}
