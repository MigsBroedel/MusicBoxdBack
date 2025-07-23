import { Entity, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from 'src/apps/users/entities/user.entity';

@Entity('follows')
export class Follow {
  @PrimaryColumn('uuid')
  followerId: string;

  @PrimaryColumn('uuid')
  followingId: string;

  @ManyToOne(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  follower: User;

  @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  following: User;
}