import { IsUUID } from 'class-validator';

export class CreateFollowDto {
  @IsUUID()
  followerId: string;

  @IsUUID()
  followingId: string;
}