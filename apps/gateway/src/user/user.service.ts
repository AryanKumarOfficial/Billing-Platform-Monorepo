import {Injectable} from '@nestjs/common';
import {ClientProvider} from '../client/client.provider';
import {USER_SERVICE_NAME} from '@app/proto';
import {FindAllUsersResponseDto} from './dto/find-all-users.dto';
import {FindOneUserResponseDto} from './dto/find-one-user.dto';
import {UserDto} from './dto/user.dto';

/**
 * gRPC client interface
 */
interface UserServiceClient {
    [key: string]: any;

    findAll: (
        query: { limit: number; offset: number },
        callback: (err: any, response: any) => void
    ) => void;
    findOne: (
        q: { id: string },
        callback: (err: any, response: any) => void
    ) => void;
}

@Injectable()
export class UserService {
    constructor(private readonly clientProvider: ClientProvider) {
    }

    async findAll(pagination: { limit: number; offset: number }): Promise<FindAllUsersResponseDto> {
        const client = await this.clientProvider.getServiceClient<UserServiceClient>(USER_SERVICE_NAME);

        const resp: any = await new Promise((resolve, reject) => {
            client.findAll(pagination, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

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

        const userRaw: any = await new Promise((resolve, reject) => {
            client.findOne({id}, (err, response) => {
                if (err) return reject(err);
                resolve(response);
            });
        });

        if (!userRaw) return {user: null};

        const user: UserDto = {
            id: userRaw.id ?? userRaw._id ?? '',
            email: userRaw.email ?? '',
            name: userRaw.name ?? '',
        };

        return {user};
    }
}