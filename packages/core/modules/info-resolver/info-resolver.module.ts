import { Module } from '@nestjs/common';
import { VkModule } from '../vk/vk.module';
import { CoverResolverModule } from '../cover-resolver/cover-resolver.module';
import { CountersResolverModule } from '../counters-resolver/counters-resolver.module';
import { InfoResolver } from './info-resolver';
import { VkInfoResolver } from './vk-info-resolver';

@Module({
    exports: [InfoResolver],
    imports: [CoverResolverModule, CountersResolverModule, VkModule],
    providers: [InfoResolver, VkInfoResolver],
})
export class InfoResolverModule {}
