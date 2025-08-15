import { Controller, Post, Body, HttpStatus, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import * as querystring from 'querystring';

@Controller('auth')
export class AuthController {
  // --- coloque esses valores em process.env em produção ---
  private readonly CLIENT_ID = 'f1279cc7c8c246f49bad620c58811730';
  private readonly CLIENT_SECRET = 'bd9593f8ffdf44149299889ad2d8c7cd';
  private readonly REDIRECT_URI = 'musicbox://login';

  @Get('login')
  login(@Res() res: Response) {
    const scope = [
      'user-read-email',
      'user-library-read',
      'user-read-private',
    ].join(' ');

    const queryParams = querystring.stringify({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      scope,
      redirect_uri: this.REDIRECT_URI,
      state: this.generateRandomState(),
    });

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${queryParams}`;
    return res.redirect(spotifyAuthUrl);
  }

  /**
   * callback
   * Recebe: { code, codeVerifier?, redirect_uri? }
   * - se codeVerifier presente => usa PKCE (não envia client_secret)
   * - se não => usa Authorization Code tradicional (envia Basic auth header)
   */
  @Post('callback')
  async handleCallback(
    @Body() body: { code?: string; codeVerifier?: string; redirect_uri?: string },
    @Res() res: Response,
  ) {
    try {
      const { code, codeVerifier, redirect_uri } = body || {};

      if (!code) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: 'code_missing', message: 'Código de autorização não fornecido' });
      }

      const finalRedirectUri = redirect_uri || this.REDIRECT_URI;
      const usingPkce = !!codeVerifier;

      console.log('🔄 Trocando código por tokens...', {
        codePreview: code.substring(0, 20) + '...',
        usingPkce,
        redirect_uri: finalRedirectUri,
      });

      // Monta body da requisição pro /api/token
      const tokenPayload: any = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: finalRedirectUri,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      if (usingPkce) {
        // PKCE flow (mobile, expo) -> enviar code_verifier e client_id (sem client_secret)
        tokenPayload.client_id = this.CLIENT_ID;
        tokenPayload.code_verifier = codeVerifier;
      } else {
        // Traditional flow -> envia Basic Auth header (mais seguro) e client_id no payload
        tokenPayload.client_id = this.CLIENT_ID;
        const basic = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');
        headers['Authorization'] = `Basic ${basic}`;
      }

      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(tokenPayload),
        { headers, timeout: 10000 }
      );

      const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

      console.log('✅ Tokens obtidos com sucesso', {
        access_token_preview: access_token ? access_token.substring(0, 30) + '...' : null,
        refresh_token_preview: refresh_token ? refresh_token.substring(0, 30) + '...' : null,
        expires_in,
        scope,
      });

      return res.status(HttpStatus.OK).json({
        message: 'Autenticado com sucesso',
        access_token,
        refresh_token,
        expires_in,
        scope,
      });
    } catch (err: any) {
      // Se for erro do axios (Spotify respondeu com status), repassa o body e status
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message };

      console.error('❌ Erro ao obter token do Spotify:', { status, data });

      // Repassa a resposta do Spotify pra facilitar debug no frontend
      return res.status(status).json({ spotify_error: data });
    }
  }

  @Post('refresh')
  async refreshToken(
    @Body() body: { refresh_token?: string },
    @Res() res: Response,
  ) {
    try {
      const { refresh_token } = body || {};
      if (!refresh_token) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: 'refresh_missing', message: 'Refresh token não fornecido' });
      }

      console.log('🔄 Renovando access token...', { refresh_preview: refresh_token.substring(0, 30) + '...' });

      const tokenPayload: any = {
        grant_type: 'refresh_token',
        refresh_token,
      };

      // Para refresh sempre usamos Basic Auth (client_secret)
      const basic = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basic}`,
      };

      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(tokenPayload),
        { headers, timeout: 10000 },
      );

      const { access_token, refresh_token: new_refresh_token, expires_in } = tokenResponse.data;

      console.log('✅ Token renovado com sucesso', { access_preview: access_token?.substring(0, 30) + '...', new_refresh: !!new_refresh_token });

      return res.status(HttpStatus.OK).json({
        access_token,
        refresh_token: new_refresh_token || refresh_token,
        expires_in,
      });
    } catch (err: any) {
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message };
      console.error('❌ Erro ao renovar token:', { status, data });
      return res.status(status).json({ spotify_error: data });
    }
  }

  @Get('validate')
  async validateToken(@Query('token') token: string, @Res() res: Response) {
    try {
      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).json({ valid: false, error: 'Token não fornecido' });
      }

      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      return res.status(HttpStatus.OK).json({ valid: true, user: response.data });
    } catch (err: any) {
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message };
      console.error('❌ Token inválido:', status, data);
      return res.status(status).json({ valid: false, spotify_error: data });
    }
  }

  @Get('debug/tokens')
  async debugTokens(@Query('access_token') accessToken: string, @Res() res: Response) {
    if (!accessToken) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'access_token query param required' });
    }

    try {
      const userResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return res.status(HttpStatus.OK).json({
        token_valid: true,
        user: {
          id: userResponse.data.id,
          display_name: userResponse.data.display_name,
          email: userResponse.data.email,
          country: userResponse.data.country,
        },
      });
    } catch (err: any) {
      const data = err.response?.data || err.message;
      return res.status(err.response?.status || 500).json({ token_valid: false, error: data });
    }
  }

  private generateRandomState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
