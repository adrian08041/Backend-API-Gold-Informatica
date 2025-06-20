import { Injectable } from '@nestjs/common';
import { CreateOrderProductDto } from './dto/create-order-product.dto';
import { UpdateOrderProductDto } from './dto/update-order-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderProductDto: CreateOrderProductDto) {
    const { productId, orderId } = createOrderProductDto;

    if (productId) {
      // Buscou por uma unica order product no banco de dados
      const productExists = await this.prisma.client.product.findUnique({
        where: { id: productId },
      });

      if (!productExists) {
        // Retorna um erro se a order product não for encontrada
        return {
          statusCode: 404,
          message: 'Create order product failed: product not found',
        };
      }
    } else {
      // Retorna um erro se o productId não for passado
      return {
        statusCode: 400,
        message: 'Create order product failed: product ID is required',
      };
    }

    if (orderId) {
      // Buscou por uma unica order product no banco de dados
      const orderExists = await this.prisma.client.order.findUnique({
        where: { id: orderId },
      });

      if (!orderExists) {
        // Retorna um erro se a order product não for encontrada
        return {
          statusCode: 404,
          message: 'Create order product failed: order not found',
        };
      }
    } else {
      // Retorna um erro se o orderId não for passado
      return {
        statusCode: 400,
        message: 'Create order product failed: order ID is required',
      };
    }

    const id = uuidv4();

    const orderProductCreated = await this.prisma.client.orderProduct.create({
      data: {
        id,
        basePrice: createOrderProductDto.basePrice,
        discountPercentage: createOrderProductDto.discountPercentage,
        quantity: createOrderProductDto.quantity,
        order: { connect: { id: orderId } },
        product: { connect: { id: createOrderProductDto.productId } },
      },
    });

    return {
      statusCode: 201,
      message: 'Order Product created successfully',
      data: orderProductCreated,
    };
  }

  async findAll(page: number, perPage: number) {
    const skip = (page - 1) * perPage;
    const take = perPage;

    const orderProduct = await this.prisma.client.orderProduct.findMany({
      skip,
      take,
      where: {
        enabled: true, // Apenas produtos habilitados
      },

      orderBy: {
        productId: 'asc', // Ordena por data de criação
      },
    });
    const totalOrderProduct = await this.prisma.client.orderProduct.count({
      where: {
        enabled: true, // Apenas produtos habilitados
      },
    });
    return {
      statusCode: 200,
      message: 'order product retrieved successfully',
      data: orderProduct,
      pagination: {
        page,
        perPage,
        totalRecords: totalOrderProduct,
        totalPages: Math.ceil(totalOrderProduct / perPage),
      },
    };
  }

  async findOne(id: string) {
    const orderProduct = await this.prisma.client.orderProduct.findUnique({
      where: { id },
    });
    if (!orderProduct) {
      return {
        statusCode: 404,
        message: 'order product not found',
      };
    }

    return {
      statusCode: 200,
      message: 'order product retrieved successfully',
      data: orderProduct,
    };
  }

  async update(id: string, updateOrderProductDto: UpdateOrderProductDto) {
    const orderProductUpdate = await this.prisma.client.orderProduct.update({
      data: {
        basePrice: updateOrderProductDto.basePrice,
        discountPercentage: updateOrderProductDto.discountPercentage,
        quantity: updateOrderProductDto.quantity,
        productId: updateOrderProductDto.productId,
        orderId: updateOrderProductDto.orderId,
      },
      where: { id },
    });

    return {
      statusCode: 201,
      message: 'Category updated successfully',
      data: orderProductUpdate,
    };
  }

  remove(id: string) {
    return this.prisma.client.orderProduct
      .update({
        where: { id: id },
        data: { enabled: false },
      })
      .then(() => {
        return {
          statusCode: 200,
          message: 'order Product removed successfully',
        };
      })
      .catch(() => {
        return {
          statusCode: 404,
          message: 'orderProduct not found',
        };
      });
  }
}
