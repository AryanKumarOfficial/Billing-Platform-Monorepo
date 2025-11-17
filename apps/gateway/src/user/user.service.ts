import { Injectable } from '@nestjs/common';
import { ClientProvider } from '../client/client.provider';
import { USER_SERVICE_NAME } from '@app/proto/src';

interface User {
    id: string;
    email: string;
    name: string;
}
interface UserServiceClient {
    [key: string]: Function;
    findAll: (query: {
        limit: number;
        offset: number;
    }) => Promise<{ users: User[] }>;
    findOne: (query: { id: string }) => Promise<User>;
}

@Injectable()
export class UserService {
    constructor(private readonly clientProvider: ClientProvider) {}

    async findAll(pagination: { limit: number; offset: number }) {
        const userService =
            await this.clientProvider.getServiceClient<UserServiceClient>(
                USER_SERVICE_NAME,
            );
        return userService.findAll(pagination);
    }

    async findOne(id: string) {
        const userService =
            await this.clientProvider.getServiceClient<UserServiceClient>(
                USER_SERVICE_NAME,
            );
        return userService.findOne({ id });
    }
}