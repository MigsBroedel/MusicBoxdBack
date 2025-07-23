import { Controller, Delete, Post, Body } from '@nestjs/common';
import { FollowingService } from './following.service';
import { CreateFollowDto } from './dto/create.following.dto';
import { UnfollowDto } from './dto/unfollow.dto';

@Controller('')
export class FollowingController {
  constructor(private readonly followingService: FollowingService) {}

  @Post('follow')
  async follow (@Body() following: CreateFollowDto) {
    await this.followingService.follow(following)
  }


  @Delete('unfollow')
  async unfollow (@Body() following: UnfollowDto) {
    await this.followingService.unfollow(following)
  }
}
