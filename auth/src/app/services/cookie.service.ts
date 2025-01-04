import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';

@Injectable()
export class CookieService implements OnModuleInit {
  private cookieName: string;
  private cookieOpts: CookieOptions;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.cookieName = this.configService.get('app.cookie.name');
    this.cookieOpts = this.configService.get('app.cookie.libraryOpts');
  }

  setCookie(res: Response, value: string) {
    res.cookie(this.cookieName, value, this.cookieOpts);
  }

  clearCookie(res: Response) {
    res.clearCookie(this.cookieName, this.cookieOpts);
  }
}
