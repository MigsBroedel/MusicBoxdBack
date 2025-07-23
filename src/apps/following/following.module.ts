import { Module } from '@nestjs/common';
import { FollowingService } from './following.service';
import { FollowingController } from './following.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/following.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Follow])],
  controllers: [FollowingController],
  providers: [FollowingService],
  exports: [FollowingService]
})
export class FollowingModule {}
