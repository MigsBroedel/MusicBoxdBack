import { Module } from '@nestjs/common';
import { FollowingService } from './following.service';
import { FollowingController } from './following.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/following.entity';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow]),
    ReviewModule // Importa o ReviewModule para usar o ReviewService
  ],
  controllers: [FollowingController],
  providers: [FollowingService],
  exports: [FollowingService]
})
export class FollowingModule {}