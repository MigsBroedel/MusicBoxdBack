import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/apps/users/entities/user.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE'})
  user: User; // Mudou de 'userid' para 'user'

  @Column()
  albumid: string; // id do Spotify

  @Column({ type: 'int' })
  nota: number; // 1 a 10

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}