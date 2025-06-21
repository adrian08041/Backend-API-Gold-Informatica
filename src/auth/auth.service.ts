import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email: username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(authDto: AuthDto) {
    const { email, password } = authDto;
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const token: string = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'default_secret',
      expiresIn: '1d',
    });

    return {
      accessToken: token,
      statusCode: HttpStatus.OK,
      message: 'Login successful',
    };
  }

  //  Registro
  async register(dto: CreateUserDto) {
    const userExists = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'USER', // padrão
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      user,
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully',
    };
  }
}
