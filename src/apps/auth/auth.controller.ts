import { Controller, Post, Body, HttpStatus, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import * as querystring from 'querystring';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  // Configurações do Spotify - mova para variáveis de ambiente
  private readonly CLIENT_ID = "f1279cc7c8c246f49bad620c58811730";
  private readonly CLIENT_SECRET = "1891040bbc274ff4b9cdc5915d859cc0"; // ADICIONE ISSO
  private readonly REDIRECT_URI = "musicbox://login"; // Consistente com o frontend
  
  @Get('login')
  login(@Res() res: Response) {
    const scope = [
      'user-read-email',
      'user-library-read',
      'user-read-private', // Útil para obter dados do usuário
    ].join(' ');

    const queryParams = querystring.stringify({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      scope: scope,
      redirect_uri: this.REDIRECT_URI,
      state: this.generateRandomState(),
    });

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${queryParams}`;
    return res.redirect(spotifyAuthUrl);
  }

  @Post('callback')
  async handleCallback(
    @Body() body: { code: string; codeVerifier?: string },
    @Res() res: Response,
    @Query('code') queryCode?: string,
  ) {
    try {
      // Aceita código do body ou query params
      const code = body.code || queryCode;
      
      if (!code) {
        throw new BadRequestException('Código de autorização não fornecido');
      }

      console.log('🔄 Trocando código por tokens...', { 
        code: code.substring(0, 20) + '...',
        hasCodeVerifier: !!body.codeVerifier 
      });

      // Para PKCE (sem client secret) ou Authorization Code (com client secret)
      const tokenData: any = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.CLIENT_ID,
      };

      // Se tem code_verifier, usa PKCE
      if (body.codeVerifier) {
        tokenData.code_verifier = body.codeVerifier;
      } else if (this.CLIENT_SECRET) {
        // Se não tem PKCE mas tem client secret
        tokenData.client_secret = this.CLIENT_SECRET;
      }

      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(tokenData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000, // 10 segundos de timeout
        },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      console.log('✅ Tokens obtidos com sucesso', {
        access_token: access_token,
        refresh_token: refresh_token.substring(0, 30) + '...',
        expires_in
      });

      return res!.status(HttpStatus.OK).json({
        message: 'Autenticado com sucesso',
        access_token,
        refresh_token,
        expires_in,
      });

    } catch (err) {
      console.error('❌ Erro ao obter token do Spotify:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });

      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.error === 'invalid_grant') {
          throw new BadRequestException('Código de autorização expirado ou inválido');
        } else if (errorData.error === 'invalid_client') {
          throw new BadRequestException('Client ID ou Client Secret inválidos');
        }
      }

      throw new InternalServerErrorException('Erro ao autenticar com o Spotify');
    }
  }

  @Post('refresh')
  async refreshToken(
    @Body() body: { refresh_token: string },
    @Res() res: Response,
  ) {
    try {
      if (!body.refresh_token) {
        throw new BadRequestException('Refresh token não fornecido');
      }

      console.log('🔄 Renovando access token...', {
        refresh_token: body.refresh_token.substring(0, 30) + '...'
      });

      const tokenData: any = {
        grant_type: 'refresh_token',
        refresh_token: body.refresh_token,
        client_id: this.CLIENT_ID,
      };

      // Adiciona client secret se disponível
      if (this.CLIENT_SECRET) {
        tokenData.client_secret = this.CLIENT_SECRET;
      }

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

      console.log('✅ Token renovado com sucesso', {
        access_token: access_token.substring(0, 30) + '...',
        expires_in,
        new_refresh_token: refresh_token ? 'Sim' : 'Não'
      });

      return res.status(HttpStatus.OK).json({
        message: 'Token renovado com sucesso',
        access_token,
        refresh_token: refresh_token || body.refresh_token, // Usa o novo ou mantém o antigo
        expires_in,
      });

    } catch (err) {
      console.error('❌ Erro ao renovar token:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });

      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.error === 'invalid_grant') {
          throw new BadRequestException('Refresh token expirado ou inválido');
        }
      }

      throw new InternalServerErrorException('Erro ao renovar token');
    }
  }

  @Get('validate')
  async validateToken(@Query('token') token: string) {
    try {
      if (!token) {
        throw new BadRequestException('Token não fornecido');
      }

      // Testa o token fazendo uma requisição para a API do Spotify
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 5000,
      });

      return {
        valid: true,
        user: response.data,
      };

    } catch (err) {
      console.error('❌ Token inválido:', err.response?.status);
      
      return {
        valid: false,
        error: err.response?.status === 401 ? 'Token expirado' : 'Token inválido',
      };
    }
  }

  // Método auxiliar para gerar state aleatório
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Endpoint para debug - remova em produção
  @Get('debug/tokens')
  async debugTokens(@Query('access_token') accessToken: string) {
    if (!accessToken) {
      return { error: 'access_token query param required' };
    }

    try {
      const userResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      return {
        token_valid: true,
        user: {
          id: userResponse.data.id,
          display_name: userResponse.data.display_name,
          email: userResponse.data.email,
          country: userResponse.data.country,
        }
      };
    } catch (err) {
      return {
        token_valid: false,
        error: err.response?.data || err.message
      };
    }
  }
}