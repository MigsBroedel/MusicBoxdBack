import { Test, TestingModule } from '@nestjs/testing';
import { CloudifyController } from './cloudinary.controller';
import { CloudifyService } from './cloudinary.service';

describe('CloudifyController', () => {
  let controller: CloudifyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudifyController],
      providers: [CloudifyService],
    }).compile();

    controller = module.get<CloudifyController>(CloudifyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
