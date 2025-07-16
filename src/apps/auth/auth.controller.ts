import { Controller, Post, Body, HttpStatus, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import * as querystring from 'querystring';
import { InternalServerErrorException } from '@nestjs/common';



@Controller('auth')
export class AuthController {

  @Get('login')
  login(@Res() res: Response) {
    const scope = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-library-read',
    ].join(' ');

    const queryParams = querystring.stringify({
      response_type: 'code',
      client_id: "f1279cc7c8c246f49bad620c58811730",
      scope: scope,
      redirect_uri: "musicbox://callback",
      state: 'algum_state_aleatorio_opcional', // use para prevenir CSRF
    });

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${queryParams}`;

    return res.redirect(spotifyAuthUrl);
  }


  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: "exp://192.168.15.9:8081",
          client_id: "f1279cc7c8c246f49bad620c58811730",
          client_secret: "1891040bbc274ff4b9cdc5915d859cc0",
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Aqui você pode armazenar o token, ou redirecionar o usuário de volta para o app mobile
      return res.status(HttpStatus.OK).json({
        message: 'Autenticado com sucesso',
        access_token,
        refresh_token,
        expires_in,
      });
    } catch (err) {
      console.error('Erro ao obter token do Spotify:', err.response?.data || err.message);
      throw new InternalServerErrorException('Erro ao autenticar com o Spotify');
    }
  }

}