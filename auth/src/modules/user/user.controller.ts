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

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cookieService: CookieService,
  ) {}

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

  @Get('me')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: TokenPayload) {
    return user;
  }
}
