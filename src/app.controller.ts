import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import ColorThief from 'colorthief';

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
      const palette = await ColorThief.getPalette(url, 5); // 5 cores dominantes
      res.json({ palette }); // formato: [[r,g,b], [r,g,b], ...]
    } catch (err) {
      throw new HttpException('Erro ao extrair cores', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
