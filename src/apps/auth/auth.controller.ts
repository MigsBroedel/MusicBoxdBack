import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private configService: ConfigService) {}

  @Get('spotify')
  redirectSpotify (@Res() res: Response) {
    const scope = 'user-top-read user-read-email';
    const redirect_uri = encodeURIComponent(this.configService.get<string>('SPOTIFY_REDIRECT_URI')!)
    const client_id = this.configService.get<string>('SPOTIFY_CLIENT_ID')!

    const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}`;

    return res.redirect(url)

  }

  @Post('callback')
  async handleCallback(@Body('code') code: string, @Res() res: Response) {
    try {
      const tokens = await this.authService.getToken(code);
      return res.json(tokens);
    } catch (e) {
      console.error('Erro ao trocar código por token:', e.response?.data || e.message);
      return res.status(500).json({ error: 'Erro ao trocar código por token' });
    }
  }


}
