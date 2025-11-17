import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';
import { USER_SERVICE_NAME } from '@app/proto/src';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @GrpcMethod(USER_SERVICE_NAME, 'FindOne')
    findOne(data: { id: string }) {
        return this.userService.findOne(data);
    }

    @GrpcMethod(USER_SERVICE_NAME, 'FindAll')
    findAll(data: { limit?: number; offset?: number }) {
        return this.userService.findAll(data);
    }

    @GrpcMethod(USER_SERVICE_NAME, 'FindByIds')
    findByIds(data: { ids: string[] }) {
        return this.userService.findByIds(data);
    }

    @GrpcMethod(USER_SERVICE_NAME, 'ValidateUser')
    validateUser(data: { email: string; password: string }) {
        return this.userService.validateUser(data);
    }

    @GrpcMethod(USER_SERVICE_NAME, 'Create')
    create(data: { email: string; password: string; name: string }) {
        return this.userService.create(data);
    }
}