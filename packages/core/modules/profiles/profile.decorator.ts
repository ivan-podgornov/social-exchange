import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const Profile = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        return context.switchToHttp().getRequest().user.profile;
    },
);
