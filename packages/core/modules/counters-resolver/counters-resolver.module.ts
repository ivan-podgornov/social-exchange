import { Module } from '@nestjs/common';
import { VkModule } from '../vk/vk.module';
import { VkCountersResolver } from './vk-counters-resolver';

@Module({
    exports: [VkCountersResolver],
    imports: [VkModule],
    providers: [VkCountersResolver],
})
export class CountersResolverModule {}
