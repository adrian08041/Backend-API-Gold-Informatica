export class CreateOrderProductDto {
  productId: string;
  orderId: string;
  quantity: number;
  basePrice: number;
  discountPercentage?: number;
}
