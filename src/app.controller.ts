import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import ColorThief from 'colorthief';
import axios from 'axios';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('colors')
  async getColors(@Query('url') url: string, @Res() res: Response) {
    if (!url) {
      throw new HttpException('Image URL is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Faz o download da imagem protegida (como a do Spotify)
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      // Extrai as cores usando o buffer
      const palette = await ColorThief.getPaletteFromBuffer(buffer, 5);

      return res.json({ palette });
    } catch (err) {
      console.error('Erro ao processar imagem:', err.message || err);
      throw new HttpException('Erro ao processar imagem', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
