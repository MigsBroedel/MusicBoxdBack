import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/following.entity';
import { Repository } from 'typeorm';
import { CreateFollowDto } from './dto/create.following.dto';
import { UnfollowDto } from './dto/unfollow.dto';

@Injectable()
export class FollowingService {
  constructor(@InjectRepository(Follow) private followRepo: Repository<Follow>) {}

  async follow(createFollow: CreateFollowDto) {
    const alreadyFollowing = await this.followRepo.findOneBy({
      followerId: createFollow.followerId,
      followingId: createFollow.followingId,
    });

    if (alreadyFollowing) {
      throw new ConflictException('Você já segue esse usuário');
    }

    const follow = this.followRepo.create(createFollow);
    return await this.followRepo.save(follow);
  }

  async unfollow(unfollowDto: UnfollowDto) {
    const result = await this.followRepo.delete(unfollowDto);

    if (result.affected === 0) {
      throw new NotFoundException('Follow não encontrado');
    }

    return { message: 'Unfollow com sucesso' };
  }
}
