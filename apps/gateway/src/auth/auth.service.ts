import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProvider } from '../client/client.provider';
import { USER_SERVICE_NAME } from '@app/proto';
import { RpcException } from '@nestjs/microservices';

// Define the gRPC client interface matching the raw grpc-js signature
interface UserServiceClient {
    [key: string]: any;
    validateUser: (
        data: { email: string; password: string },
        callback: (err: any, response: any) => void
    ) => void;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly clientProvider: ClientProvider,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Called by LocalStrategy to validate user credentials.
     * This calls the user-service via gRPC.
     */
    async validateUser(email: string, pass: string): Promise<any> {
        try {
            const userService =
                await this.clientProvider.getServiceClient<UserServiceClient>(
                    USER_SERVICE_NAME,
                );

            // FIX: Wrap the callback-based gRPC method in a Promise
            const user = await new Promise((resolve, reject) => {
                userService.validateUser({ email, password: pass }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });

            if (user) {
                return user;
            }
            return null;
        } catch (error: any) {
            this.logger.warn(`Login validation failed for ${email}: ${error.message}`);
            // Return null so LocalStrategy throws UnauthorizedException
            return null;
        }
    }

    /**
     * Called by AuthController after successful validation
     * to issue a JWT.
     */
    async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        };
    }
}