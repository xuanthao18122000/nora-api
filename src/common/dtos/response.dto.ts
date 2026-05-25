import { ApiProperty } from "@nestjs/swagger";
import { SUCESS_RESPONSE } from "../constants";

export class ResponseDto<T> {
    constructor(data: T) {
        this.data = data;
        this.success = true;
        this.statusCode = SUCESS_RESPONSE.code;
    }

    @ApiProperty({ description: "Mã trạng thái", example: "SUCCESS" })
    statusCode: string;

    @ApiProperty({ description: "Trạng thái thành công", example: true })
    success: boolean;

    @ApiProperty({ description: "Dữ liệu trả về" })
    data: T;
}
