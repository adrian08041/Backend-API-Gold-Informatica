import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateOrderProductDto } from './dto/create-order-product.dto';
import { UpdateOrderProductDto } from './dto/update-order-product.dto';
import { OrderProductService } from './order-product.service';
import { JwtAuthGuard } from 'src/core/guards/jwt-verify.interceptors';

@Controller('order-product')
@UseGuards(JwtAuthGuard)
export class OrderProductController {
  constructor(private readonly orderProductService: OrderProductService) {}

  @Post()
  create(@Body() createOrderProductDto: CreateOrderProductDto) {
    return this.orderProductService.create(createOrderProductDto);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.orderProductService.findAll(+page, +perPage);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderProductService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderProductDto: UpdateOrderProductDto,
  ) {
    return this.orderProductService.update(id, updateOrderProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderProductService.remove(id);
  }
}
