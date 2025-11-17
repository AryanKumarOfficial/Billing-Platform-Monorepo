import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
    ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@app/common/src';
import { UserService } from './user.service';
import { FindAllUsersResponseDto } from './dto/find-all-users.dto';
import { FindOneUserResponseDto } from './dto/find-one-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    findAll(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    ): Promise<FindAllUsersResponseDto> {
        return this.userService.findAll({ limit, offset });
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FindOneUserResponseDto> {
        return this.userService.findOne(id);
    }
}
