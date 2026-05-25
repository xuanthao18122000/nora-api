import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserService } from "../../services/user.service";
import { CreateUserDto } from "../../dtos/create-user.dto";
import { UpdateUserDto } from "../../dtos/update-user.dto";
import { UpdatePasswordDto } from "../../dtos/update-password.dto";
import { ListUserDto } from "../../dtos/query-user.dto";

@Controller("cms/users")
@ApiTags("[CMS] USER")
@ApiBearerAuth()
export class UserControllerForCMS {
    constructor(private readonly userService: UserService) {}

    @Post()
    @ApiOperation({ summary: "Tạo user CMS" })
    create(@Body() dto: CreateUserDto) {
        return this.userService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách user CMS" })
    findAll(@Query() query: ListUserDto) {
        return this.userService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết user" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật user (không sửa password)" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
        return this.userService.update(id, dto);
    }

    @Patch(":id/password")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Đổi mật khẩu (yêu cầu mật khẩu cũ)" })
    updatePassword(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdatePasswordDto,
    ) {
        return this.userService.updatePassword(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm user" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.userService.remove(id);
    }
}
