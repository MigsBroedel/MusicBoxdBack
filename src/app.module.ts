import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './apps/auth/auth.module';
import { ReviewModule } from './apps/review/review.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './apps/users/users.module';
import { FollowingModule } from './apps/following/following.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
          type: 'postgres',
          url: 'postgresql://musicbox_postgres_user:1GEg9QfcxpjjAdF6AESxAzSBHJzbt0ea@dpg-d216rb2li9vc739lngb0-a.oregon-postgres.render.com/musicbox_postgres',
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
    FollowingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
