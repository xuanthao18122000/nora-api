import { QueryBuilder } from "@mikro-orm/mysql";
import type {
    AnyEntity,
    FilterQuery as QBFilterQuery,
    GroupOperator,
    QBQueryOrderMap,
} from "@mikro-orm/core";
import type { Knex, Field, QueryOrderMap } from "@mikro-orm/mysql";

type CustomField<T> = keyof T | (string & {});

declare module "@mikro-orm/mysql" {
    interface QueryBuilder<
        Entity extends object = AnyEntity,
        RootAlias extends string = never,
        Hint extends string = never,
        Context extends object = never,
    > {
        __fQueryObject?: unknown;
        fSetQuery(query: unknown): this;
        fSelect<T extends AnyEntity<T>>(fields?: Field<T> | Field<T>[], distinct?: boolean): this;
        fAddSelect<T extends AnyEntity<T>>(fields: Field<T> | Field<T>[]): this;
        fWhere<T extends AnyEntity<T>>(
            cond: QBFilterQuery<T>,
            operator?: keyof typeof GroupOperator,
        ): this;
        fAndWhere(cond: string, params?: unknown): this;
        fOrWhere(cond: string, params?: unknown[]): this;
        fOrderBy<T extends AnyEntity<T>>(orderBy: QBQueryOrderMap<T> | QBQueryOrderMap<T>[]): this;
        fLimit(limit: number, offset?: number): this;
        fOffset(offset: number): this;
        fLeftJoin(field: string, alias: string, cond?: QBFilterQuery<unknown>): this;
        fInnerJoin(field: string, alias: string, cond?: QBFilterQuery<unknown>): this;
        fLeftJoinAndSelect(
            field:
                | string
                | [
                      field: string,
                      qb:
                          | Knex.QueryBuilder<Record<string, unknown>, unknown>
                          | QueryBuilder<Record<string, unknown>, never, never, never>,
                  ],
            alias: string,
            cond?: QBFilterQuery<unknown>,
            fields?: string[],
            schema?: string,
        ): this;
        fInnerJoinAndSelect(field: string, alias: string, cond?: QBFilterQuery<unknown>): this;
        fGroupBy(fields: string | string[]): this;
        fHaving<T extends AnyEntity<T>>(cond: QBFilterQuery<T>): this;
        fAndWhereLike<T extends AnyEntity<T>>(field: CustomField<T>, value?: unknown): this;
        fOrWhereLike<T extends AnyEntity<T>>(field: CustomField<T>, value?: unknown): this;
        fAndWhereLikeAny<T extends AnyEntity<T>>(fields: CustomField<T>[], value: unknown): this;
        fAddPagination(page?: number, limit?: number, getFull?: boolean): this;
        fAddOrderBy<T extends AnyEntity<T>>(orderBy?: QueryOrderMap<T>, nullsFirst?: boolean): this;
        fAndWhereIn<T extends AnyEntity<T>>(field: CustomField<T>, values: unknown[]): this;
        fAndWhereNotIn<T extends AnyEntity<T>>(field: CustomField<T>, values: unknown[]): this;
        fAndWhereBetween<T extends AnyEntity<T>>(
            field: CustomField<T>,
            from: unknown,
            to: unknown,
        ): this;
        fAndWhereDateRange<T extends AnyEntity<T>>(
            field: CustomField<T>,
            startDate?: Date,
            endDate?: Date,
        ): this;
        fOnlyActive(deletedField?: string, activeValue?: unknown): this;
    }
}

const QBProto = (QueryBuilder as unknown as { prototype: Record<string, unknown> }).prototype;

function getQueryObject(self: QueryBuilder<any, any, any, any>): unknown {
    type WithQueryObject = { __fQueryObject?: unknown };
    return (self as unknown as WithQueryObject).__fQueryObject;
}

if (!("fSetQuery" in QBProto)) {
    QBProto["fSetQuery"] = function (this: QueryBuilder, query: unknown) {
        (this as unknown as { __fQueryObject?: unknown }).__fQueryObject = query;
        return this;
    } as unknown;
}

if (!("fSelect" in QBProto)) {
    QBProto["fSelect"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        fields?: Field<T> | Field<T>[],
        distinct?: boolean,
    ) {
        let selectFields: unknown = fields as unknown;
        const qObj = getQueryObject(this) as Record<string, unknown> | undefined;
        if (!selectFields && qObj && "fields" in qObj) {
            selectFields = qObj["fields"];
        }
        if (selectFields) {
            this.select(selectFields as Field<T> | Field<T>[], distinct);
        }
        return this;
    } as unknown;
}

if (!("fAddSelect" in QBProto)) {
    QBProto["fAddSelect"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        fields: Field<T> | Field<T>[],
    ) {
        this.addSelect(fields);
        return this;
    } as unknown;
}

if (!("fWhere" in QBProto)) {
    QBProto["fWhere"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        cond: QBFilterQuery<T>,
        operator?: keyof typeof GroupOperator,
    ) {
        this.where(cond, operator);
        return this;
    } as unknown;
}

if (!("fAndWhere" in QBProto)) {
    QBProto["fAndWhere"] = function (this: QueryBuilder, cond: string, params?: unknown) {
        const hasOperator = /(=|<>|<=|>=|<|>|\blike\b|\bin\b|\bis\b|\bbetween\b)/i.test(cond);
        const clause = hasOperator ? cond : `${cond} = ?`;

        let value: unknown;
        if (params === undefined) {
            const queryObject = getQueryObject(this) as Record<string, unknown> | undefined;
            const key = cond.includes(".") ? cond.split(".").slice(-1)[0] : cond;
            value = queryObject ? queryObject[key] : undefined;
        } else {
            value = params;
        }

        if (value === undefined || value === null || value === "") {
            return this;
        }
        const arr = Array.isArray(value) ? value : [value];
        this.andWhere(clause, arr as unknown as unknown[]);
        return this;
    } as unknown;
}

if (!("fOrWhere" in QBProto)) {
    QBProto["fOrWhere"] = function (this: QueryBuilder, cond: string, params?: unknown[]) {
        this.orWhere(cond as unknown as string, params as unknown as unknown[]);
        return this;
    } as unknown;
}

if (!("fOrderBy" in QBProto)) {
    QBProto["fOrderBy"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        orderBy: QBQueryOrderMap<T> | QBQueryOrderMap<T>[],
    ) {
        this.orderBy(orderBy);
        return this;
    } as unknown;
}

if (!("fLimit" in QBProto)) {
    QBProto["fLimit"] = function (this: QueryBuilder, limit: number, offset?: number) {
        this.limit(limit, offset);
        return this;
    } as unknown;
}

if (!("fOffset" in QBProto)) {
    QBProto["fOffset"] = function (this: QueryBuilder, offset: number) {
        this.offset(offset);
        return this;
    } as unknown;
}

if (!("fLeftJoin" in QBProto)) {
    QBProto["fLeftJoin"] = function (
        this: QueryBuilder,
        field: string,
        alias: string,
        cond?: QBFilterQuery<unknown>,
    ) {
        this.leftJoin(field, alias, cond as unknown as QBFilterQuery<unknown>);
        return this;
    } as unknown;
}

if (!("fInnerJoin" in QBProto)) {
    QBProto["fInnerJoin"] = function (
        this: QueryBuilder,
        field: string,
        alias: string,
        cond?: QBFilterQuery<unknown>,
    ) {
        this.innerJoin(field, alias, cond as unknown as QBFilterQuery<unknown>);
        return this;
    } as unknown;
}

if (!("fLeftJoinAndSelect" in QBProto)) {
    QBProto["fLeftJoinAndSelect"] = function (
        this: QueryBuilder,
        field:
            | string
            | [
                  field: string,
                  qb:
                      | Knex.QueryBuilder<Record<string, unknown>, unknown>
                      | QueryBuilder<Record<string, unknown>, never, never, never>,
              ],
        alias: string,
        cond?: QBFilterQuery<unknown>,
        fields?: string[],
        schema?: string,
    ) {
        const typedField = field as
            | string
            | [
                  string,
                  (
                      | Knex.QueryBuilder<Record<string, unknown>, unknown>
                      | QueryBuilder<Record<string, unknown>, never, never, never>
                  ),
              ];
        this.leftJoinAndSelect(typedField, alias, cond, fields, schema);
        return this;
    } as unknown;
}

if (!("fInnerJoinAndSelect" in QBProto)) {
    QBProto["fInnerJoinAndSelect"] = function (
        this: QueryBuilder,
        field: string,
        alias: string,
        cond?: QBFilterQuery<unknown>,
    ) {
        this.innerJoinAndSelect(field, alias, cond);
        return this;
    } as unknown;
}

if (!("fGroupBy" in QBProto)) {
    QBProto["fGroupBy"] = function (this: QueryBuilder, fields: string | string[]) {
        this.groupBy(fields);
        return this;
    } as unknown;
}

if (!("fHaving" in QBProto)) {
    QBProto["fHaving"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        cond: QBFilterQuery<T>,
    ) {
        this.having(cond);
        return this;
    } as unknown;
}

if (!("fAndWhereLike" in QBProto)) {
    QBProto["fAndWhereLike"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        field: CustomField<T>,
        value?: unknown,
    ) {
        let searchValue = value;
        const queryObject = getQueryObject(this) as Record<string, unknown> | undefined;
        if (searchValue === undefined && queryObject) {
            searchValue = queryObject[field as unknown as string];
        }
        if (typeof searchValue === "string" && searchValue.trim()) {
            this.andWhere({
                [field as unknown as string]: { $like: `%${searchValue}%` },
            } as unknown as QBFilterQuery<T>);
        }
        return this;
    } as unknown;
}

if (!("fOrWhereLike" in QBProto)) {
    QBProto["fOrWhereLike"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        field: CustomField<T>,
        value: unknown,
    ) {
        if (typeof value === "string" && value.trim()) {
            this.orWhere({
                [field as unknown as string]: { $like: `%${value}%` },
            } as unknown as QBFilterQuery<T>);
        }
        return this;
    } as unknown;
}

if (!("fAndWhereLikeAny" in QBProto)) {
    QBProto["fAndWhereLikeAny"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        fields: CustomField<T>[],
        value: unknown,
    ) {
        if (typeof value === "string" && value.trim() && fields?.length) {
            const conditions = fields.map((f) => ({
                [f as unknown as string]: { $like: `%${value}%` },
            }));
            this.andWhere({ $or: conditions } as unknown as QBFilterQuery<T>);
        }
        return this;
    } as unknown;
}

if (!("fAddPagination" in QBProto)) {
    QBProto["fAddPagination"] = function (
        this: QueryBuilder,
        page?: number,
        limit?: number,
        getFull?: boolean,
    ) {
        let pageNum = page;
        let limitNum = limit;
        let getFullFlag = getFull;
        const queryObject = getQueryObject(this) as Record<string, unknown> | undefined;
        if (queryObject) {
            const qo = queryObject;
            pageNum = pageNum ?? (typeof qo.page === "number" ? qo.page : undefined);
            limitNum = limitNum ?? (typeof qo.limit === "number" ? qo.limit : undefined);
            getFullFlag = getFullFlag ?? (typeof qo.getFull === "boolean" ? qo.getFull : undefined);
        }
        if (getFullFlag) return this;
        if (pageNum && limitNum) {
            const offset = (pageNum - 1) * limitNum;
            this.limit(limitNum).offset(offset);
        }
        return this;
    } as unknown;
}

if (!("fAddOrderBy" in QBProto)) {
    QBProto["fAddOrderBy"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        orderBy?: QueryOrderMap<T>,
        nullsFirst = false,
    ) {
        let orderConfig: QueryOrderMap<T> | undefined = orderBy;
        const queryObject = getQueryObject(this) as Record<string, unknown> | undefined;
        if (!orderConfig && queryObject) {
            const qo = queryObject;
            const sortBy = typeof qo.sortBy === "string" ? qo.sortBy : "id";
            const order = typeof qo.order === "string" ? qo.order : "DESC";
            orderConfig = { [sortBy]: order } as unknown as QueryOrderMap<T>;
        }
        if (orderConfig) {
            this.orderBy(orderConfig);
            if (nullsFirst) {
                const knex = (this as unknown as { getKnex?: () => Knex | undefined }).getKnex?.();
                if (knex) {
                    Object.keys(orderConfig).forEach((field) => {
                        knex.orderByRaw(`${field} IS NULL DESC`);
                    });
                }
            }
        }
        return this;
    } as unknown;
}

if (!("fAndWhereIn" in QBProto)) {
    QBProto["fAndWhereIn"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        field: CustomField<T>,
        values: unknown[],
    ) {
        if (values?.length) {
            this.andWhere({
                [field as unknown as string]: { $in: values },
            } as unknown as QBFilterQuery<T>);
        }
        return this;
    } as unknown;
}

if (!("fAndWhereNotIn" in QBProto)) {
    QBProto["fAndWhereNotIn"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        field: CustomField<T>,
        values: unknown[],
    ) {
        if (values?.length) {
            this.andWhere({
                [field as unknown as string]: { $nin: values },
            } as unknown as QBFilterQuery<T>);
        }
        return this;
    } as unknown;
}

if (!("fAndWhereBetween" in QBProto)) {
    QBProto["fAndWhereBetween"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        field: CustomField<T>,
        from: unknown,
        to: unknown,
    ) {
        if (from !== undefined && to !== undefined) {
            this.andWhere({
                [field as unknown as string]: { $gte: from, $lte: to },
            } as unknown as QBFilterQuery<T>);
        }
        return this;
    } as unknown;
}

if (!("fAndWhereDateRange" in QBProto)) {
    QBProto["fAndWhereDateRange"] = function <T extends AnyEntity<T>>(
        this: QueryBuilder<T>,
        field: CustomField<T>,
        startDate?: Date,
        endDate?: Date,
    ) {
        if (startDate)
            this.andWhere({
                [field as unknown as string]: { $gte: startDate },
            } as unknown as QBFilterQuery<T>);
        if (endDate)
            this.andWhere({
                [field as unknown as string]: { $lte: endDate },
            } as unknown as QBFilterQuery<T>);
        return this;
    } as unknown;
}

/**
 * Filter only "active" rows. Default field = "deleted", default value = 0 (DeletedEnum.AVAILABLE).
 * Why: project dùng cột số (tinyint) chứ không phải nullable timestamp `deletedAt`.
 */
if (!("fOnlyActive" in QBProto)) {
    QBProto["fOnlyActive"] = function (
        this: QueryBuilder,
        deletedField = "deleted",
        activeValue: unknown = 0,
    ) {
        this.andWhere({ [deletedField]: activeValue } as unknown as QBFilterQuery<any>);
        return this;
    } as unknown;
}
