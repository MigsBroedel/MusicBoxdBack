import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import axios from 'axios'
import * as qs from 'qs';

@Injectable()
export class AuthService {
  async getToken(code: string) {
  try {
    const data = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    console.log('Enviando dados para Spotify:', data);

    const response = await axios.post('https://accounts.spotify.com/api/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('Resposta do Spotify:', response.data);

    return response.data;

  } catch (error) {
    console.error('Erro ao trocar código por token:', error.response?.data || error.message);
    throw error;
  }
}
}
