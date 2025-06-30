import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from 'generated/prisma';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const id = uuidv4();

    const categoryCreated = await this.prisma.client.category.create({
      data: {
        id,
        name: createCategoryDto.name,
        slug: createCategoryDto.slug,
        imageUrl: createCategoryDto.imageUrl,
      },
    });

    return {
      statusCode: 201,
      message: 'Category created successfully',
      data: categoryCreated,
    };
  }

  async findAll(page?: number, perPage?: number, name?: string) {
    const where: Prisma.CategoryWhereInput = {
      name: name ? { contains: name, mode: 'insensitive' } : undefined,
      enabled: true,
    };

    const args: Prisma.CategoryFindManyArgs = {
      where,
      orderBy: { name: 'asc' },
    };

    if (page !== undefined && perPage !== undefined) {
      const skip = (page - 1) * perPage;
      const take = perPage;
      args.skip = skip;
      args.take = take;
    }

    const categories = await this.prisma.client.category.findMany({
      ...args,
    });

    const totalCategories = await this.prisma.client.category.count({
      where: {
        name: name ? { contains: name, mode: 'insensitive' } : undefined,
        enabled: true, // Apenas produtos habilitados
      },
    });
    return {
      statusCode: 200,
      message: 'Categories retrieved successfully',
      data: categories,
      pagination: {
        page,
        perPage,
        totalRecords: totalCategories,
        totalPages: perPage ? Math.ceil(totalCategories / perPage) : 1, // Calcula o total de páginas
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.client.category.findUnique({
      where: { id },
    });

    if (!category) {
      return {
        statusCode: 404,
        message: 'Category not found',
      };
    }

    // Retorna a resposta com o produto encontrado
    return {
      statusCode: 200,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const categoryUpdated = await this.prisma.client.category.update({
      data: {
        name: updateCategoryDto.name,
        slug: updateCategoryDto.slug,
        imageUrl: updateCategoryDto.imageUrl,
      },
      where: { id },
    });

    return {
      statusCode: 200,
      message: 'Category updated successfully',
      data: categoryUpdated,
    };
  }

  async remove(id: string) {
    // Busca todos os produtos vinculados à categoria
    const products = await this.prisma.client.product.findMany({
      where: { categoryId: id },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);

    // Se existirem produtos vinculados
    if (productIds.length > 0) {
      // Remove OrderProduct relacionados a esses produtos
      await this.prisma.client.orderProduct.deleteMany({
        where: {
          productId: { in: productIds },
        },
      });

      // Remove os próprios produtos
      await this.prisma.client.product.deleteMany({
        where: {
          id: { in: productIds },
        },
      });
    }

    // Remove a categoria
    await this.prisma.client.category.delete({
      where: { id },
    });

    return {
      statusCode: 200,
      message: 'Category deleted successfully',
    };
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.client.category.findFirst({
      where: { slug, enabled: true },
      include: {
        products: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!category) {
      return {
        statusCode: 404,
        message: 'Category not found',
      };
    }

    return {
      statusCode: 200,
      message: 'Category retrieved successfully',
      data: category,
    };
  }
}
