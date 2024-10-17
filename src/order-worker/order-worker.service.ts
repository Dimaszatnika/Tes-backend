import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, readFile, writeFile, rename } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class OrderWorkerService {
  @Cron('*/10 * * * * *')  // Set to run every 10 seconds
  async processOrders() {
    const folderPath = join(__dirname, '../database/customer-order');
    const deliveredFolderPath = join(__dirname, '../database/delivered-order');

    try {
      const files = await readdir(folderPath);
      const processingFiles = files.slice(0, 10);  // Process up to 10 files

      await Promise.all(processingFiles.map(async (file) => {
        const filePath = join(folderPath, file);
        let retries = 0;
        while (retries < 3) {
          try {
            const data = await readFile(filePath, 'utf-8');
            const order = JSON.parse(data);
            order.status = 'Dikirim ke customer';

            // Write updated order
            await writeFile(filePath, JSON.stringify(order, null, 2));

            // Move to delivered-order folder
            const deliveredFilePath = join(deliveredFolderPath, file);
            await rename(filePath, deliveredFilePath);
            break;
          } catch (error) {
            retries++;
            if (retries >= 3) console.error(`Failed to process order file ${file}:`, error);
          }
        }
      }));
    } catch (error) {
      console.error('Failed to process orders:', error);
    }
  }
}
