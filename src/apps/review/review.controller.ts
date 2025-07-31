import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}


  @Post('from-following')
  getReviewsFromFollowing(@Body() body: { followingIds: string[] }) {
    return this.reviewService.findByFollowing(body.followingIds);
  }

  
  @Post()
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto);
  }

  @Get()
  findAll() {
    return this.reviewService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Get('user/:uid')
  findByUserId(@Param('uid') uid: string) {
    return this.reviewService.findByUserId(uid);
  }

  @Get('album/:id')
  findBySpotifyId(@Param('id') id: string) {
    return this.reviewService.findBySpotifyId(id);
  }


  



  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
