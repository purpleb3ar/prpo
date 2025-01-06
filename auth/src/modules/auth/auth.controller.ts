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
import {
  ApiBody,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dtos/login.dto';

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

  @ApiOperation({
    summary: 'Authenticate a user and set cookie containing an access token.',
    description: `This route verifies the user's credentials and issues an access token upon successfuly authentication. The token is set back to the user inside a cookie.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Correct credentials provided',
    headers: {
      'Set-Cookie': {
        description:
          'Cookie containing the JWT used to authenticate subsequent requests',
        example: 'prpo_app_access_token=<token>; HttpOnly; Secure; Path=/;',
        schema: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '(1) Username does not exist\n\n(2) Incorrect password',
  })
  @ApiResponse({
    status: 422,
    description: 'Provided request body failed validation (invalid)',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token',
  })
  @ApiBody({
    description: 'User credentials',
    type: LoginDto,
  })
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

  @ApiOperation({
    summary: 'Log out the user by wiping the cookie containg the access token.',
    description:
      'This route logs out the currently authenticated user by clearing the cookie with access_token',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token',
  })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT\n\nTo test the API leave the value empty`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @HttpCode(200)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.cookieService.clearCookie(res);
  }

  @ApiOperation({
    summary: 'Register a new user account.',
    description: `This route allows users to create a new account by providing the required details (username and password). Upon successfuly registration the user's account is created in the system and a cookie containg the access token is sent back to the user\n\nUpon success, a 'user:created' event will be generated as well`,
  })
  @ApiResponse({ status: 400, description: 'Username already exists' })
  @ApiResponse({
    status: 201,
    description: 'User registered',
    headers: {
      'Set-Cookie': {
        description:
          'Cookie containing the JWT used to authenticate subsequent requests',
        example: 'prpo_app_access_token=<token>; HttpOnly; Secure; Path=/;',
        schema: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Provided request body failed validation (invalid)',
  })
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

  @ApiOperation({
    summary: 'Redirects user to Google for authentication.',
    description: `This route redirects the user to Google's OAuth2 authentication page. The user will be asked to grant permission for this application to access their basic profile information. After successful authentication, Google will redirect the user to the callback URL.`,
  })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated with Google',
    headers: {
      'Set-Cookie': {
        description:
          'Cookie containing the JWT used to authenticate subsequent requests',
        example: 'prpo_app_access_token=<token>; HttpOnly; Secure; Path=/;',
        schema: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({
    summary:
      'Handle the google authentication callback and issue an access token',
    description: `This route is the callback endpoint that Google redirects to after the user has authenticated. The user's authentication data will be processed, and the cookie containg the access token (generated by us) will be sent back to the user.`,
  })
  @ApiResponse({
    status: 401,
    description: 'Failed to authenticate',
  })
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
