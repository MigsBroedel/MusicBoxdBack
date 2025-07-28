import { v2 as cloudinary } from 'cloudinary';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: 'dvyqptldm',
      api_key: '396299864835434',
      api_secret: 'bqNAGjiTh5iV20Tnv2gPt2QoFfY',
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<any> {
    if (!file || !file.buffer) {
      throw new Error('Arquivo inválido ou não enviado');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      const readablePhotoStream = new Readable();
      readablePhotoStream.push(file.buffer);
      readablePhotoStream.push(null);
      readablePhotoStream.pipe(uploadStream);
    });
  }
}
