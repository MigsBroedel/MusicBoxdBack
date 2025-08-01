import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository, In, MoreThan } from 'typeorm';
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
      user: user, // Mudou de 'userid' para 'user'
      albumid: createReviewDto.albumId,
      nota: createReviewDto.nota,
      text: createReviewDto.text,
    });

    return await this.reviewsRepo.save(review);
  }

  findAll() {
    return this.reviewsRepo.find({
      relations: ['user'], // Inclui o usuário na resposta
    });
  }
  
  async findOne(uid: string): Promise<Review> {
    const finded = await this.reviewsRepo.findOne({
      where: {
        id: uid
      },
      relations: ['user'] // Inclui o usuário na resposta
    });
    if (finded == null) {
      throw new Error('Review não encontrada');
    }
    return finded;
  }

  async findBySpotifyId(id: string): Promise<Review[]> {
    const finded = await this.reviewsRepo.find({
      where: {
        albumid: id
      },
      relations: ['user'] // Inclui o usuário na resposta
    });
    if (finded == null) {
      throw new Error('Reviews não encontradas');
    }
    return finded;
  }

  async findByUserId(uid: string): Promise<Review[]> {
    return await this.reviewsRepo.find({
      where: {
        user: { id: uid }, // Mudou de 'userid' para 'user'
      },
      relations: ['user'],
    });
  }

  async findByFollowing(followingIds: string[]): Promise<Review[]> {
    if (!Array.isArray(followingIds) || followingIds.length === 0) {
      return [];
    }

    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    return await this.reviewsRepo.find({
      where: {
        user: { id: In(followingIds) }, // Usar In() para array de IDs e 'user' ao invés de 'userid'
        createdAt: MoreThan(oneDayAgo),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string) {
    const result = await this.reviewsRepo.delete(id);

    if (result.affected === 0) {
      return { message: 'Review não encontrado' };
    }
    
    return { message: 'Review deletado com sucesso' };
  }
}