import { Module } from '@nestjs/common';
import { VkModule } from '../vk/vk.module';
import { VkCoverResolver } from './vk-cover-resolver';

@Module({
    exports: [VkCoverResolver],
    imports: [VkModule],
    providers: [VkCoverResolver],
})
export class CoverResolverModule {}
