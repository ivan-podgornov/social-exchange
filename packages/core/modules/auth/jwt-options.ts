import { JwtModuleOptions } from "@nestjs/jwt";

export const jwtOptions: JwtModuleOptions = {
    secret: process.env.SECRET,
    signOptions: {
        expiresIn: '1y',
    },
};
