import { Injectable } from '@nestjs/common';
import { ClientProvider } from '../client/client.provider';
import { USER_SERVICE_NAME } from '@app/proto/src';
import { FindAllUsersResponseDto } from './dto/find-all-users.dto';
import { FindOneUserResponseDto } from './dto/find-one-user.dto';
import { UserDto } from './dto/user.dto';

/**
 * gRPC client interface — include index signature so it satisfies provider constraints.
 */
interface UserServiceClient {
    [key: string]: any;
    // method names used by your user-service. Adjust to match your proto if different.
    findAll?: (query: { limit: number; offset: number }) => Promise<{ users: any[]; total?: number }>;
    findOne?: (q: { id: string }) => Promise<any | null>;
}

@Injectable()
export class UserService {
    constructor(private readonly clientProvider: ClientProvider) {}

    async findAll(pagination: { limit: number; offset: number }): Promise<FindAllUsersResponseDto> {
        const client = await this.clientProvider.getServiceClient<UserServiceClient>(USER_SERVICE_NAME);
        const resp = await client.findAll!(pagination); // non-null assert because interface optional

        const usersRaw = Array.isArray(resp?.users) ? resp.users : [];
        const users = usersRaw.map((u: any) => {
            const mapped: UserDto = {
                id: u.id ?? u._id ?? u.user_id ?? '',
                email: u.email ?? '',
                name: u.name ?? '',
            };
            return mapped;
        });

        return {
            users,
            limit: pagination.limit,
            offset: pagination.offset,
            total: typeof resp?.total === 'number' ? resp.total : users.length,
        };
    }

    async findOne(id: string): Promise<FindOneUserResponseDto> {
        const client = await this.clientProvider.getServiceClient<UserServiceClient>(USER_SERVICE_NAME);
        const userRaw = await client.findOne!({ id });

        if (!userRaw) return { user: null };

        const user: UserDto = {
            id: userRaw.id ?? userRaw._id ?? '',
            email: userRaw.email ?? '',
            name: userRaw.name ?? '',
        };

        return { user };
    }
}
