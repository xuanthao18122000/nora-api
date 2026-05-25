import { Transform, TransformFnParams } from "class-transformer";
import { convertToBoolean } from "../utils";

export const ToBooleanCustom = (): PropertyDecorator => {
    return Transform(({ value }: TransformFnParams) => convertToBoolean(value as string));
};

export const ToTrimCustom = (): PropertyDecorator => {
    return Transform(({ value }: TransformFnParams) => {
        return typeof value === "string" ? value.trim() : (value as null | undefined);
    });
};

export const ToNumberCustom = (): PropertyDecorator => {
    return Transform(({ value }: TransformFnParams) => Number(value) || 0);
};

/**
 * Transform comma-separated string or array to number array.
 * "1,2,3" / ["1","2"] / 1 → number[]
 */
export const ToIntArray = (): PropertyDecorator => {
    return Transform(({ value }: TransformFnParams) => {
        if (!value) return undefined;
        if (typeof value === "string") {
            return value
                .split(",")
                .map((v) => parseInt(v.trim(), 10))
                .filter((v) => !isNaN(v));
        }
        if (Array.isArray(value)) {
            return value
                .map((v) => (typeof v === "string" ? parseInt(v, 10) : Number(v)))
                .filter((v) => !isNaN(v));
        }
        return [typeof value === "string" ? parseInt(value, 10) : Number(value)].filter(
            (v) => !isNaN(v),
        );
    });
};
