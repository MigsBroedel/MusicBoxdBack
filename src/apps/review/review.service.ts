import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReviewService {
  constructor(@InjectRepository(Review) private reviewsRepo: Repository<Review>) {}

  async create(createReviewDto: CreateReviewDto) {
    const review = this.reviewsRepo.create(createReviewDto)
    const saved = await this.reviewsRepo.save(review)
    return saved;
  }

  findAll() {
      return this.reviewsRepo.find({
        
      });
    }
  
    async findOne(uid: string): Promise<Review> {
      const finded = await this.reviewsRepo.findOne({
        where: {
          id: uid
        }
      });
      if (finded == null) {
        throw new Error
      }
      return finded;
    }

    // fazer find por nome e id de usuario depois

  
    async remove(id: string) {
      const result = await this.reviewsRepo.delete(id);
  
        if (result.affected === 0) {
      return { message: 'Review não encontrado'}
    }
    
    return { message: 'Review deletado com sucesso' };
  
    }
}
