import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepo.create(createUserDto);

    const savedUser = await this.usersRepo.save(user);

    
    return savedUser;
  }

  findAll() {
    return this.usersRepo.find({
      
    });
  }

  async findOne(uid: string): Promise<User> {
    const finded = await this.usersRepo.findOne({
      where: {
        id: uid
      }
    });
    if (finded == null) {
      throw new Error
    }
    return finded;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.usersRepo.update(id, updateUserDto);
    return this.usersRepo.find({
      where: {id}
    })

  }

  async remove(id: string) {
    const result = await this.usersRepo.delete(id);

      if (result.affected === 0) {
    return { message: 'Usuário não encontrado'}
  }
  
  return { message: 'Usuário deletado com sucesso' };

  }
}
