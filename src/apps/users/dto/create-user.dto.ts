import {
  IsString,
  IsOptional,
  IsHexColor,
  IsUrl,
  IsUUID,
  IsArray,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsString()
  spotifyID: string;

  @IsHexColor()
  colors: string;

  @IsOptional()
  @IsUrl()
  pfp?: string;

  @IsOptional()
  @IsArray()

  favoriteAlbums?: string[];

  @IsOptional()
  @IsArray()

  favoriteArtists?: string[];
}
