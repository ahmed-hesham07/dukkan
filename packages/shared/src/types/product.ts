export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
  costPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
}

export interface StockAdjustInput {
  delta: number;
}
