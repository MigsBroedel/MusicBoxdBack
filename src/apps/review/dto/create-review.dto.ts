import {
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  userId: string;

  @IsString()
  albumId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  nota: number;

  @IsString()
  text: string;
}
