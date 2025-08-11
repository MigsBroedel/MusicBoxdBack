import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('search')
  findByName(@Query('name') name: string) {
    if (name) {
      return this.usersService.findByName(name);
    }
    return this.usersService.findAll();
  }

  @Get('spotifySearch/:spotifyID')
  findOneBySpotifyID(@Param('spotifyID') id: string) {
    return this.usersService.findBySpotifyID(id);
  }

  @Post('logProcess/:spotifyID')
async findOrCreate(
  @Param('spotifyID') spotifyID: string,
  @Query('name') name?: string,
) {
  let user = await this.usersService.findBySpotifyID(spotifyID);

  if (!user) {
    user = await this.usersService.create({
      name: name || 'Desconhecido',
      spotifyID,
      colors: '#fff'
    });
  }

  return user;
}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}