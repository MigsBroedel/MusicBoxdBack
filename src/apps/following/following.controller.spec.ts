import { Test, TestingModule } from '@nestjs/testing';
import { FollowingController } from './following.controller';
import { FollowingService } from './following.service';

describe('FollowingController', () => {
  let controller: FollowingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowingController],
      providers: [FollowingService],
    }).compile();

    controller = module.get<FollowingController>(FollowingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
