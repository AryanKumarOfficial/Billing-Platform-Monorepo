import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientModule } from '../client/client.module';

@Module({
    imports: [ClientModule],
    providers: [UserService],
    controllers: [UserController],
})
export class UserModule {}