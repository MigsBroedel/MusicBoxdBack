import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    @InjectRepository(User) private usersRepo: Repository<User>
  ) {}

  async create(createReviewDto: CreateReviewDto) {
  const user = await this.usersRepo.findOne({
    where: { id: createReviewDto.userId },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const review = this.reviewsRepo.create({
    userid: user,
    albumid: createReviewDto.albumId,
    nota: createReviewDto.nota,
    text: createReviewDto.text,
  });

  return await this.reviewsRepo.save(review);
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

  async findBySpotifyId(id: string): Promise<Review[]> {
    const finded = await this.reviewsRepo.find({
        where: {
          albumid: id
        }
      });
      if (finded == null) {
        throw new Error
      }
      return finded;
  }

  async findByUserId(uid: string): Promise<Review[]> {
  return await this.reviewsRepo.find({
    where: {
      userid: { id: uid },
    },
    relations: ['userid'], // caso precise incluir o objeto User no retorno
  });
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
