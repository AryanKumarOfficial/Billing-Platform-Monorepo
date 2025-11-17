import { UserDto } from './user.dto';

export class FindAllUsersResponseDto {
    users: UserDto[];
    limit: number;
    offset: number;
    total: number;
}
