import { Module } from '@nestjs/common';
import { VkModule } from '../vk/vk.module';
import { TitleResolver } from './title-resolver.service';

@Module({
    exports: [TitleResolver],
    imports: [VkModule],
    providers: [TitleResolver],
})
export class TitleResolverModule {}
