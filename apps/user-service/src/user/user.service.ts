import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from './user.entity';
import {In, Repository} from 'typeorm';
import {RpcException} from '@nestjs/microservices';
import {status} from '@grpc/grpc-js';

// DTOs matching the proto definitions
interface PaginationQuery {
    limit?: number;
    offset?: number;
}

interface CreateUserDto {
    email: string;
    password: string;
    name: string;
}

interface FindOneUserDto {
    id: string;
}

interface FindByIdsDto {
    ids: string[];
}

interface ValidateUserDto {
    email: string;
    password: string;
}

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
    }

    async findOne(data: FindOneUserDto): Promise<User> {
        const user = await this.userRepository.findOneBy({id: data.id});
        if (!user) {
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'User not found',
            });
        }
        // Manually remove password hash
        const {passwordHash, ...result} = user;
        return result as User;
    }

    async findAll(pagination: PaginationQuery) {
        const {limit = 10, offset = 0} = pagination;
        const [users, total] = await this.userRepository.findAndCount({
            take: limit,
            skip: offset,
            select: ['id', 'email', 'name'], // Explicitly exclude password
        });
        return {users};
    }

    async findByIds(data: FindByIdsDto) {
        const users = await this.userRepository.find({
            where: {id: In(data.ids)},
            select: ['id', 'email', 'name'],
        });
        return {users};
    }

    async validateUser(data: ValidateUserDto): Promise<User> {
        const user = await this.userRepository.findOne({
            where: {email: data.email},
            select: ['id', 'email', 'name', 'passwordHash'], // Need to select hash
        });

        if (user && (await user.validatePassword(data.password))) {
            const {passwordHash, ...result} = user;
            return result as User;
        }
        throw new RpcException({
            code: status.UNAUTHENTICATED,
            message: 'Invalid credentials',
        });
    }

    async create(data: CreateUserDto): Promise<User> {
        const user = this.userRepository.create({
            email: data.email,
            name: data.name,
            passwordHash: data.password, // Entity will hash it
        });
        const savedUser = await this.userRepository.save(user);
        const {passwordHash, ...result} = savedUser;
        return result as User;
    }
}