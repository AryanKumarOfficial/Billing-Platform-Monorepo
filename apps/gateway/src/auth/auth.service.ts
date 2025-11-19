import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProvider } from '../client/client.provider';
import { USER_SERVICE_NAME } from '@app/proto';
import { RpcException } from '@nestjs/microservices';

// Define the gRPC client interface
interface UserServiceClient {
    [key: string]: Function;
    validateUser: (data: {
        email: string;
        password: string;
    }) => Promise<{ id: string; email: string; name: string }>;
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

            // gRPC methods return a promise
            const user = await userService.validateUser({ email, password: pass });

            if (user) {
                return user; // Return the user object (without password)
            }
            return null;
        } catch (error) {
            this.logger.warn(`Login validation failed for ${email}: ${error.message}`);
            if (error instanceof RpcException) {
                return null;
            }
            throw error;
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