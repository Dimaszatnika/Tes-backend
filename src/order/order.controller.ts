import { Controller, Post, Get, Delete, Param, Body, Res, HttpStatus } from '@nestjs/common';
import { writeFile, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { setTimeout } from 'timers/promises';
import { readFileSync } from 'fs';
import { unlinkSync } from 'fs';

@Controller('order')
export class OrderController {
  private customerLocks: Map<number, boolean> = new Map();

  @Post()
  async createOrder(@Body() orderData: any) {
    const { address, payment_type, items, id_customer, name, email } = orderData;

    // Concurrency Control - check if customer already has a running order
    if (this.customerLocks.get(id_customer)) {
      return {
        message: 'Customer already has a running order. Please wait until the previous order is completed.'
      };
    }

    this.customerLocks.set(id_customer, true);  // Locking mechanism

    try {
      // Delay process for 3 seconds
      await setTimeout(3000);

      // Generate Order Number with unique check
      const folderPath = join(__dirname, '../database/customer-order');
      const files = await readdir(folderPath);
      let orderNumber;
      let unique = false;
      do {
        const date = new Date();
        const formattedDate = `${date.getDate()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear().toString().slice(2)}`;
        const possibleNumber = `ORDER-${id_customer}-${formattedDate}-00001`; // Simplified for example
        unique = !files.includes(`${possibleNumber}.json`);
        if (unique) {
          orderNumber = possibleNumber;
        }
      } while (!unique);

      // Format Data
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const order = {
        no_order: orderNumber,
        id_customer,
        name,
        email,
        address,
        payment_type,
        items,
        total,
        status: 'Order Diterima'
      };

      // Save to JSON File
      const filePath = join(folderPath, `${orderNumber}.json`);

      let retries = 0;
      while (retries < 3) {
        try {
          await writeFile(filePath, JSON.stringify(order, null, 2));
          break;  // Success, exit retry loop
        } catch (error) {
          retries++;
          if (retries >= 3) throw new Error('Failed to save order after 3 retries');
        }
      }

      // Return response
      return {
        message: 'Order berhasil diproses',
        result: {
          order_number: orderNumber,
        },
      };
    } catch (error) {
      return { message: error.message };
    } finally {
      this.customerLocks.delete(id_customer);  // Unlock
    }
  }

  // NEW: Get a specific order by order number
  @Get(':orderNumber')
  async getOrder(@Param('orderNumber') orderNumber: string, @Res() response) {
    try {
      const filePath = join(__dirname, `../database/customer-order/${orderNumber}.json`);
      const orderData = readFileSync(filePath, 'utf-8');
      response.status(HttpStatus.OK).json(JSON.parse(orderData));
    } catch (error) {
      response.status(HttpStatus.NOT_FOUND).json({ message: 'Order not found' });
    }
  }

  // NEW: Get all orders
  @Get()
  async getAllOrders() {
    try {
      const folderPath = join(__dirname, '../database/customer-order');
      const files = await readdir(folderPath);

      const orders = await Promise.all(files.map(async (file) => {
        const filePath = join(folderPath, file);
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
      }));

      return {
        message: 'Orders retrieved successfully',
        orders,
      };
    } catch (error) {
      return {
        message: 'Error retrieving orders',
        error: error.message,
      };
    }
  }

  @Delete(':orderNumber')
  deleteOrder(@Param('orderNumber') orderNumber: string, @Res() response) {
    try {
      const filePath = join(__dirname, `../database/customer-order/${orderNumber}.json`);
      unlinkSync(filePath);
      response.status(HttpStatus.OK).json({ message: 'Order deleted successfully' });
    } catch (error) {
      response.status(HttpStatus.NOT_FOUND).json({ message: 'Order not found' });
    }
  }
}
