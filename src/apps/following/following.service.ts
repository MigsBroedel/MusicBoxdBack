import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/following.entity';
import { Repository } from 'typeorm';
import { CreateFollowDto } from './dto/create.following.dto';
import { UnfollowDto } from './dto/unfollow.dto';
import { User } from '../users/entities/user.entity';

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

  async getFollowers(userId: string): Promise<User[]> {
  const follows = await this.followRepo.find({
    where: { followingId: userId },
    relations: ['follower'],
  });

  return follows.map(f => f.follower);
}

  async getFollowing(userId: string): Promise<User[]> {
  const follows = await this.followRepo.find({
    where: { followerId: userId },
    relations: ['following'],
  });

  return follows.map(f => f.following);
}

  async countFollowers(userId: string): Promise<number> {
    return await this.followRepo.count({
      where: { followingId: userId },
    });
  }

  async countFollowing(userId: string): Promise<number> {
    return await this.followRepo.count({
      where: { followerId: userId },
    });
  }


}
