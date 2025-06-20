export class CreateProductDto {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  categoryId: string;
  discountPercentage?: number;
  imageUrls?: string[];
}
