import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exist');
    }

    const productsIDs = products.map(product => {
      return { id: product.id };
    });

    const foundProducts = await this.productsRepository.findAllById(
      productsIDs,
    );

    const productsForOrder = foundProducts.map(product => {
      const getProductQuantity = products.find(
        foundProduct => foundProduct.id === product.id,
      );

      return {
        product_id: product.id,
        quantity: getProductQuantity?.quantity || 0,
        price: product.price,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsForOrder,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
