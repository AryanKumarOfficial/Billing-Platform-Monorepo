import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'YOUR_SECRET_KEY'),
        });
    }

    // Passport automatically validates the token's signature and expiration
    // This method is called after validation to return the payload
    async validate(payload: any) {
        // The payload is what we put in it during login (auth.service.ts)
        // It's attached to request.user
        return { userId: payload.sub, email: payload.email };
    }
}