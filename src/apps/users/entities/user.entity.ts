import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Review } from 'src/apps/review/entities/review.entity';
import { Follow } from 'src/apps/following/entities/following.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  bio: string;

  @Column()
  spotifyID: string;

  @Column()
  colors: string; // hex

  @Column({ nullable: true })
  pfp: string; // link?

  @Column("uuid", { array: true, nullable: true })
  favoriteAlbums: string[];

  @Column("uuid", { array: true, nullable: true })
  favoriteArtists: string[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

}
