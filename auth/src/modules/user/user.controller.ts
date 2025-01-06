import {
  Body,
  Controller,
  forwardRef,
  Get,
  HttpCode,
  Inject,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AuthService } from '../auth/auth.service';
import { CookieOptions, Response } from 'express';
import { CookieService } from 'src/app/services/cookie.service';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cookieService: CookieService,
  ) {}

  @ApiOperation({
    summary: `Update the authenticated user's username.`,
    description: `This route alows the authenticated user to update their username. A cookie containing the access token will be sent back to the client.\n\nUpon success, a 'user:updated' event will be generated as well`,
  })
  @ApiResponse({
    status: 200,
    description: 'User profile successfully updated',
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
  @ApiResponse({ status: 400, description: 'Username already exists' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiCookieAuth()
  @Put()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Res({ passthrough: true }) response: Response,
    @CurrentUser() user: TokenPayload,
    @Body() updatedProfile: UpdateProfileDto,
  ) {
    const updatedUser = await this.userService.updateProfile(
      user,
      updatedProfile,
    );
    const token = await this.authService.generateAccessToken(updatedUser);
    this.cookieService.setCookie(response, token);
  }

  @ApiOperation({
    summary: `Retrieve the authenticated user's information`,
    description: `This route validates the token inside the cookie and retrieves the information associated with the currently authenticated user.`,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiResponse({
    status: 200,
    description: 'User is authenticated and will receive data about themselves',
    type: TokenPayload,
  })
  @ApiCookieAuth()
  @Get('me')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: TokenPayload) {
    return user;
  }
}
