import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import axios from 'axios';

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

@Controller('auth')
export class AuthController {

  @Post('spotify/save-user')
  async saveSpotifyUser(@Body() body: { accessToken: string; refreshToken?: string }) {
    try {
      const { accessToken, refreshToken } = body;

      if (!accessToken) {
        throw new Error('Access token não fornecido');
      }

      // Buscar dados do usuário no Spotify
      const userResponse = await axios.get<SpotifyUser>('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const spotifyUser = userResponse.data;

      // Aqui você salvaria o usuário no seu banco de dados
      // Por exemplo:
      // const user = await this.userService.createOrUpdateUser({
      //   spotifyId: spotifyUser.id,
      //   name: spotifyUser.display_name,
      //   email: spotifyUser.email,
      //   profileImage: spotifyUser.images[0]?.url,
      //   accessToken,
      //   refreshToken,
      // });

      console.log('Usuário do Spotify:', spotifyUser);

      return {
        success: true,
        user: {
          id: spotifyUser.id,
          name: spotifyUser.display_name,
          email: spotifyUser.email,
          profileImage: spotifyUser.images[0]?.url,
        },
      };

    } catch (error) {
      console.error('Erro ao salvar usuário:', error.response?.data || error.message);
      throw new Error('Falha ao salvar usuário do Spotify');
    }
  }

  @Post('spotify/refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    try {
      const { refreshToken } = body;

      if (!refreshToken) {
        throw new Error('Refresh token não fornecido');
      }

      const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.SPOTIFY_CLIENT_ID || 'f1279cc7c8c246f49bad620c58811730',
          client_secret: process.env.SPOTIFY_CLIENT_SECRET || '',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        access_token: tokenResponse.data.access_token,
        expires_in: tokenResponse.data.expires_in,
      };

    } catch (error) {
      console.error('Erro ao renovar token:', error.response?.data || error.message);
      throw new Error('Falha ao renovar token do Spotify');
    }
  }
}