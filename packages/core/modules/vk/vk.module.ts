import { Module } from '@nestjs/common';
import { VkService } from './vk.service';

@Module({
    exports: [VkService],
    providers: [VkService],
})
export class VkModule {}
