import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const Network = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        return context.switchToHttp().getRequest().user.network;
    },
);
