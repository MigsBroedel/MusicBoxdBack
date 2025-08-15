import { Controller, Post, Body, HttpStatus, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import * as querystring from 'querystring';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  private readonly CLIENT_ID = "f1279cc7c8c246f49bad620c58811730";
  private readonly REDIRECT_URI = "musicbox://login";

  @Post('callback')
  async handleCallback(
    @Body() body: { code: string; codeVerifier: string },
    @Res() res: Response,
  ) {
    try {
      const { code, codeVerifier } = body;
      
      if (!code || !codeVerifier) {
        throw new BadRequestException('Código e codeVerifier são obrigatórios');
      }

      console.log('Iniciando troca de código por token...');

      const tokenData = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.CLIENT_ID,
        code_verifier: codeVerifier,
      };

      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(tokenData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Verificação adicional do token
      const userResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      return res.status(HttpStatus.OK).json({
        access_token,
        refresh_token,
        expires_in,
        user: userResponse.data,
      });

    } catch (err) {
      console.error('Erro completo:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      if (err.response?.status === 400) {
        throw new BadRequestException(err.response.data?.error_description || 'Erro na autenticação');
      }

      throw new InternalServerErrorException('Falha ao autenticar com o Spotify');
    }
  }

  @Post('refresh')
  async refreshToken(
    @Body() body: { refresh_token: string },
    @Res() res: Response,
  ) {
    try {
      if (!body.refresh_token) {
        throw new BadRequestException('Refresh token é obrigatório');
      }

      const tokenData = {
        grant_type: 'refresh_token',
        refresh_token: body.refresh_token,
        client_id: this.CLIENT_ID,
      };

      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(tokenData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return res.status(HttpStatus.OK).json(tokenResponse.data);

    } catch (err) {
      console.error('Erro ao renovar token:', err.response?.data);
      throw new InternalServerErrorException('Falha ao renovar token');
    }
  }

  @Get('validate')
  async validateToken(@Query('token') token: string) {
    try {
      if (!token) {
        throw new BadRequestException('Token é obrigatório');
      }

      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return {
        valid: true,
        user: response.data,
      };
    } catch (err) {
      return {
        valid: false,
        error: err.response?.status === 401 ? 'Token expirado' : 'Token inválido',
      };
    }
  }
}