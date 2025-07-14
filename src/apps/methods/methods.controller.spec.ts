import { Test, TestingModule } from '@nestjs/testing';
import { MethodsController } from './methods.controller';
import { MethodsService } from './methods.service';

describe('MethodsController', () => {
  let controller: MethodsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MethodsController],
      providers: [MethodsService],
    }).compile();

    controller = module.get<MethodsController>(MethodsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
