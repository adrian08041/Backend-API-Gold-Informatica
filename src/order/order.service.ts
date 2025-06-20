import { Injectable } from '@nestjs/common';

import { UpdateOrderDto } from './dto/update-order.dto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string) {
    const id = uuidv4();
    // Verifica se o userId existe
    if (userId) {
      const userExists = await this.prisma.client.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        return {
          statusCode: 404,
          message: 'Create order failed: User not found',
        };
      }
    } else {
      return {
        statusCode: 400,
        message: 'Create order failed: User ID is required',
      };
    }

    const orderCreated = await this.prisma.client.order.create({
      data: {
        id,
        user: { connect: { id: userId } },
      },
    });

    return {
      statusCode: 201,
      message: 'Order created successfully',
      data: orderCreated,
    };
  }

  async findAll(page: number = 1, perPage: number = 10, name?: string) {
    const skip = (page - 1) * perPage;
    const take = perPage;

    // Busca os produtos no banco de dados com base nos parâmetros de consulta
    const orders = await this.prisma.client.order.findMany({
      skip,
      take,
      where: {
        user: name
          ? { name: { contains: name, mode: 'insensitive' } }
          : undefined,
        enabled: true, // Apenas produtos habilitados
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc', // Ordena por data de criação, do mais recente para o mais antigo
      },
    });
    const totalOrders = await this.prisma.client.order.count({
      where: {
        user: name
          ? { name: { contains: name, mode: 'insensitive' } }
          : undefined,
        enabled: true, // Apenas produtos habilitados
      },
    });

    return {
      statusCode: 200,
      message: 'Order retrieved successfully',
      data: orders,
      pagination: {
        page,
        perPage,
        totalRecords: totalOrders,
        totalPages: Math.ceil(totalOrders / perPage),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    // Verifica se o produto foi encontrado
    if (!order) {
      return {
        statusCode: 404,
        message: 'Order not found',
      };
    }

    // Retorna a resposta com o produto encontrado
    return {
      statusCode: 200,
      message: 'Order retrieved successfully',
      data: order,
    };
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const { userId } = updateOrderDto;

    if (userId) {
      const userExists = await this.prisma.client.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        // Retorna um erro se a categoria não for encontrada
        return {
          statusCode: 404,
          message: 'Updated product failed: User not found',
        };
      }
    } else {
      return {
        statusCode: 400,
        message: 'Updated product failed: User ID is required',
      };
    }

    const orderCreated = await this.prisma.client.order.update({
      data: {
        id,
        user: { connect: { id: userId } },
        status: updateOrderDto.status,
      },
      where: { id },
    });

    return {
      statusCode: 200,
      message: 'Order updated successfully',
      data: orderCreated,
    };
  }

  remove(id: string) {
    // Remove um produto do banco de dados pelo ID fornecido
    return this.prisma.client.order
      .update({
        where: { id: id },
        data: { enabled: false },
      })
      .then(() => {
        return {
          statusCode: 200,
          message: 'Order removed successfully',
        };
      })
      .catch(() => {
        return {
          statusCode: 404,
          message: 'Order not found',
        };
      });
  }
}
