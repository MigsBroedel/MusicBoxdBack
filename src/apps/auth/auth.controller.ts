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
      'user-read-private',
      'user-library-read',
      'user-read-playback-state',
      'user-modify-playback-state',
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
   * Callback corrigido para PKCE
   * Recebe: { code, codeVerifier, redirect_uri }
   * Para PKCE: NÃO usar Authorization header, apenas client_id no body
   */
  @Post('callback')
  async handleCallback(
    @Body() body: { code?: string; codeVerifier?: string; redirect_uri?: string },
    @Res() res: Response,
  ) {
    try {
      const { code, codeVerifier, redirect_uri } = body || {};

      if (!code) {
        return res.status(HttpStatus.BAD_REQUEST).json({ 
          error: 'code_missing', 
          message: 'Código de autorização não fornecido' 
        });
      }

      if (!codeVerifier) {
        return res.status(HttpStatus.BAD_REQUEST).json({ 
          error: 'code_verifier_missing', 
          message: 'Code verifier é obrigatório para PKCE' 
        });
      }

      const finalRedirectUri = redirect_uri || this.REDIRECT_URI;

      console.log('🔄 Iniciando troca de código por tokens (PKCE)...', {
        codePreview: code.substring(0, 20) + '...',
        verifierPreview: codeVerifier.substring(0, 20) + '...',
        redirect_uri: finalRedirectUri,
      });

      // Payload para PKCE - CRÍTICO: não usar Authorization header
      const tokenPayload = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: finalRedirectUri,
        client_id: this.CLIENT_ID, // client_id vai no body para PKCE
        code_verifier: codeVerifier, // obrigatório para PKCE
      };

      // Headers para PKCE - CRÍTICO: apenas Content-Type, sem Authorization
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      };

      console.log('📤 Enviando requisição para Spotify:', {
        url: 'https://accounts.spotify.com/api/token',
        payload: {
          ...tokenPayload,
          code: tokenPayload.code.substring(0, 20) + '...',
          code_verifier: tokenPayload.code_verifier.substring(0, 20) + '...',
        },
        headers,
      });

      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(tokenPayload),
        { 
          headers, 
          timeout: 15000,
          validateStatus: (status) => status < 500, // Aceita erros 4xx para melhor debug
        }
      );

      if (tokenResponse.status !== 200) {
        console.error('❌ Spotify retornou erro:', {
          status: tokenResponse.status,
          data: tokenResponse.data,
        });
        
        return res.status(tokenResponse.status).json({ 
          error: 'spotify_token_error',
          spotify_error: tokenResponse.data,
          message: 'Falha ao obter token do Spotify'
        });
      }

      const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

      // Validar se recebemos os tokens necessários
      if (!access_token) {
        console.error('❌ Access token não recebido:', tokenResponse.data);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'invalid_token_response',
          message: 'Access token não foi retornado pelo Spotify',
          spotify_response: tokenResponse.data,
        });
      }

      console.log('✅ Tokens obtidos com sucesso', {
        access_token_length: access_token?.length,
        refresh_token_length: refresh_token?.length,
        expires_in,
        scope,
      });

      // Opcionalmente, validar o token fazendo uma chamada à API do Spotify
      try {
        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${access_token}` },
          timeout: 10000,
        });
        
        console.log('✅ Token validado com sucesso:', {
          user_id: userResponse.data.id,
          display_name: userResponse.data.display_name,
        });
      } catch (validationError: any) {
        console.error('⚠️ Falha na validação do token:', validationError.response?.data);
        // Não retornar erro aqui, pois o token pode estar válido mesmo assim
      }

      return res.status(HttpStatus.OK).json({
        message: 'Autenticação realizada com sucesso',
        access_token,
        refresh_token,
        expires_in,
        scope,
        token_type: 'Bearer',
      });

    } catch (err: any) {
      console.error('❌ Erro crítico no callback:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        stack: err.stack?.split('\n').slice(0, 3), // Primeiras 3 linhas do stack
      });

      // Se for erro do axios (resposta do Spotify)
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        return res.status(status).json({ 
          error: 'spotify_api_error',
          spotify_error: data,
          message: `Erro do Spotify: ${data.error_description || data.error || 'Erro desconhecido'}`
        });
      }

      // Erro de rede ou timeout
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNABORTED') {
        return res.status(HttpStatus.REQUEST_TIMEOUT).json({
          error: 'network_error',
          message: 'Falha de conectividade com o Spotify',
          details: err.message,
        });
      }

      // Outros erros
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'internal_error',
        message: 'Erro interno do servidor',
        details: err.message,
      });
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
        return res.status(HttpStatus.BAD_REQUEST).json({ 
          error: 'refresh_missing', 
          message: 'Refresh token não fornecido' 
        });
      }

      console.log('🔄 Renovando access token...');

      const tokenPayload = {
        grant_type: 'refresh_token',
        refresh_token,
      };

      // Para refresh, usar Basic Auth (método tradicional)
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

      console.log('✅ Token renovado com sucesso');

      return res.status(HttpStatus.OK).json({
        access_token,
        refresh_token: new_refresh_token || refresh_token, // Spotify pode ou não retornar novo refresh token
        expires_in,
        token_type: 'Bearer',
      });
      
    } catch (err: any) {
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message };
      
      console.error('❌ Erro ao renovar token:', { status, data });
      
      return res.status(status).json({ 
        error: 'refresh_failed',
        spotify_error: data,
        message: 'Falha ao renovar token'
      });
    }
  }

  @Get('validate')
  async validateToken(@Query('token') token: string, @Res() res: Response) {
    try {
      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).json({ 
          valid: false, 
          error: 'Token não fornecido' 
        });
      }

      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      return res.status(HttpStatus.OK).json({ 
        valid: true, 
        user: {
          id: response.data.id,
          display_name: response.data.display_name,
          email: response.data.email,
          country: response.data.country,
        }
      });
      
    } catch (err: any) {
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message };
      
      console.error('❌ Token inválido:', status, data);
      
      return res.status(status).json({ 
        valid: false, 
        spotify_error: data,
        message: 'Token inválido ou expirado'
      });
    }
  }

  @Get('debug/tokens')
  async debugTokens(@Query('access_token') accessToken: string, @Res() res: Response) {
    if (!accessToken) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        error: 'access_token query param required' 
      });
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
          followers: userResponse.data.followers?.total || 0,
        },
      });
    } catch (err: any) {
      const data = err.response?.data || err.message;
      return res.status(err.response?.status || 500).json({ 
        token_valid: false, 
        error: data 
      });
    }
  }

  private generateRandomState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}