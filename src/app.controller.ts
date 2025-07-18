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
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const palette = await ColorThief.getPaletteFromBuffer(buffer, 5);
    res.json({ palette });
  } catch (err) {
    console.error(err.message);
    throw new HttpException('Erro ao processar imagem', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}


}
