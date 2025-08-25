import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './apps/auth/auth.module';
import { ReviewModule } from './apps/review/review.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './apps/users/users.module';
import { FollowingModule } from './apps/following/following.module';
import { CloudinaryModule } from './apps/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
          type: 'postgres',
          url: 'postgresql://neondb_owner:npg_MdVAy6wjW2Uf@ep-weathered-salad-acqfdaky-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
          ssl: {
          rejectUnauthorized: false, 
          },
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, //just dev
        }),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    AuthModule,
    UsersModule,
    ReviewModule,
    FollowingModule,
    CloudinaryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
