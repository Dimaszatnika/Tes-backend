import { Controller, Post, Body } from '@nestjs/common';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { setTimeout } from 'timers/promises';

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

      // Generate Order Number
      const date = new Date();
      const formattedDate = `${date.getDate()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear().toString().slice(2)}`;
      const orderNumber = `ORDER-${id_customer}-${formattedDate}-00001`;  // Running number logic should be implemented

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
      const folderPath = join(__dirname, '../database/customer-order');
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
}
