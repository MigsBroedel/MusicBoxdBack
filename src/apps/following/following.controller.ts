import { Controller, Delete, Post, Body, Get, Param, Inject } from '@nestjs/common';
import { FollowingService } from './following.service';
import { CreateFollowDto } from './dto/create.following.dto';
import { UnfollowDto } from './dto/unfollow.dto';
import { ReviewService } from '../review/review.service';

@Controller('')
export class FollowingController {
  constructor(
    private readonly followingService: FollowingService,
    @Inject(ReviewService) private readonly reviewService: ReviewService
  ) {}

  @Get('followers/count/:userId')
  countFollowers(@Param('userId') userId: string) {
    return this.followingService.countFollowers(userId);
  }

  @Get('following/count/:userId')
  countFollowing(@Param('userId') userId: string) {
    return this.followingService.countFollowing(userId);
  }

  @Get('followers/:userId')
  getFollowers(@Param('userId') userId: string) {
    return this.followingService.getFollowers(userId);
  }

  @Get('following/:userId')
  getFollowing(@Param('userId') userId: string) {
    return this.followingService.getFollowing(userId);
  }

  // Novo endpoint que pega diretamente as reviews das pessoas que o usuário segue
  @Get('following/:userId/reviews')
  async getFollowingReviews(@Param('userId') userId: string) {
    const followingIds = await this.followingService.getFollowingIds(userId);
    return this.reviewService.findByFollowing(followingIds);
  }

  @Post('follow')
  async follow(@Body() following: CreateFollowDto) {
    await this.followingService.follow(following);
  }

  @Delete('unfollow')
  async unfollow(@Body() following: UnfollowDto) {
    await this.followingService.unfollow(following);
  }
}