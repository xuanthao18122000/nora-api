export const convertToBoolean = (value: string | undefined) => {
    if (!value) {
        return false;
    }
    return Boolean(JSON.parse(value));
};
