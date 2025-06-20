import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Destruturando o categoryId do DTO
    const { categoryId, slug } = createProductDto;

    if (slug) {
      const slugExists = await this.prisma.client.product.findUnique({
        where: { slug },
      });
      if (slugExists) {
        // Retorna um erro se o slug já existir
        throw new BadRequestException(
          'Create product failed: Slug already exists',
        );
      }
    }

    if (categoryId) {
      // Verifica se o categoryId foi passado
      // Buscou por uma unica categoria no banco de dados
      const categoryExists = await this.prisma.client.category.findUnique({
        where: { id: categoryId },
      });

      if (!categoryExists) {
        // Retorna um erro se a categoria não for encontrada
        throw new NotFoundException(
          'Create product failed: Category not found',
        );
      }
    } else {
      // Retorna um erro se o categoryId não for passado
      throw new BadRequestException(
        'Create product failed: Category ID is required',
      );
    }

    // Gera um Hash ID para o produto com bcrypt
    const id = uuidv4();

    // Cria o produto no banco de dados
    const productCreated = await this.prisma.client.product.create({
      data: {
        id,
        name: createProductDto.name,
        description: createProductDto.description,
        basePrice: createProductDto.basePrice,
        slug: createProductDto.slug,
        discountPercentage: createProductDto.discountPercentage,
        imageUrls: createProductDto.imageUrls,
        category: { connect: { id: categoryId } },
      },
    });

    // Retorna a resposta de sucesso
    return {
      statusCode: 201,
      message: 'Product created successfully',
      data: productCreated,
    };
  }

  async findAll(page?: number, perPage?: number, name?: string) {
    // Paginação: calcula o número de registros a pular e o número de registros a buscar
    let skip = 0; // Valor padrão para skip
    let take = 0; // Valor padrão para take
    if (page !== undefined && perPage !== undefined) {
      skip = (page - 1) * perPage;
      take = perPage;
    }

    // Busca os produtos no banco de dados com base nos parâmetros de consulta
    const products = await this.prisma.client.product.findMany({
      skip: skip === 0 ? undefined : skip,
      take: take === 0 ? undefined : take,
      where: {
        name: name ? { contains: name, mode: 'insensitive' } : undefined,
        enabled: true, // Apenas produtos habilitados
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Conta o número total de produtos que correspondem ao filtro de nome
    const totalProducts = await this.prisma.client.product.count({
      where: {
        name: name ? { contains: name, mode: 'insensitive' } : undefined,
        enabled: true, // Apenas produtos habilitados
      },
    });

    // Retorna a resposta com os produtos e informações de paginação
    return {
      statusCode: 200,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        page,
        perPage,
        totalRecords: totalProducts,
        totalPages: perPage ? Math.ceil(totalProducts / perPage) : 1, // Calcula o total de páginas
      },
    };
  }

  async findOne(id: string) {
    // Busca um produto específico pelo ID no banco de dados
    const product = await this.prisma.client.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    // Verifica se o produto foi encontrado
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Retorna a resposta com o produto encontrado
    return {
      statusCode: 200,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  async findOneBySlugWithRelations(slug: string) {
    // Busca um produto específico pelo slug no banco de dados
    const product = await this.prisma.client.product.findUnique({
      where: { slug }, // Apenas produtos habilitados
      include: {
        category: {
          include: {
            products: {
              where: { enabled: true }, // Apenas produtos habilitados
              orderBy: { name: 'asc' }, // Ordena os produtos pelo nome
            },
          },
        },
      },
    });

    // Verifica se o produto foi encontrado
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Retorna a resposta com o produto encontrado
    return {
      statusCode: 200,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Destruturando o categoryId do DTO
    const { categoryId } = updateProductDto;

    // Verifica se o categoryId foi passado
    if (categoryId) {
      // Buscou por uma unica categoria no banco de dados
      const categoryExists = await this.prisma.client.category.findUnique({
        where: { id: categoryId },
      });

      if (!categoryExists) {
        // Retorna um erro se a categoria não for encontrada
        throw new NotFoundException(
          'Updated product failed: Category not found',
        );
      }
    }

    // Atualiza o produto no banco de dados de acordo com o ID fornecido
    const productUpdated = await this.prisma.client.product.update({
      data: {
        name: updateProductDto.name,
        description: updateProductDto.description,
        basePrice: updateProductDto.basePrice,
        slug: updateProductDto.slug,
        discountPercentage: updateProductDto.discountPercentage,
        imageUrls: updateProductDto.imageUrls,
        category: { connect: { id: categoryId } },
      },
      where: { id },
    });

    // Retorna a resposta de sucesso
    return {
      statusCode: 200,
      message: 'Product updated successfully',
      data: productUpdated,
    };
  }

  remove(id: string) {
    // Remove um produto do banco de dados pelo ID fornecido
    return this.prisma.client.product
      .update({
        where: { id: id },
        data: { enabled: false },
      })
      .then(() => {
        return {
          statusCode: 200,
          message: 'Product removed successfully',
        };
      })
      .catch(() => {
        throw new NotFoundException('Product not found');
      });
  }
}
