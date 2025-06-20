import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const existingUser = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        statusCode: 409,
        message: 'User already exists',
      };
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    createUserDto.password = hashedPassword;

    const user = await this.prisma.client.user.create({
      data: createUserDto,
    });

    return {
      statusCode: 201,
      message: 'User created successfully',
      data: user,
    };
  }

  async findOne(id: string) {
    return this.prisma.client.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.client.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.prisma.client.user.delete({
      where: { id },
    });
  }
}
