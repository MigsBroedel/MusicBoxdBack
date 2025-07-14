import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import axios from 'axios'
import * as qs from 'qs';

@Injectable()
export class AuthService {
  async getToken (code: string) {
    const data = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    })

    const response = await axios.post('https://accounts.spotify.com/api/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;

  }
}
