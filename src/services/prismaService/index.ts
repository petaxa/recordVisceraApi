import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

export * from './users'
export * from './temps'
export * from './profiles'
export * from './weights'
export * from './dailyReports'

export class DbRecordNotFoundError extends Error {
    constructor(...args: any[]) {
        super(...args);

        // this.name = this.constructor.name; でも問題ないが、
        // enumerable を false にしたほうがビルトインエラーに近づく、
        Object.defineProperty(this, 'name', {
            configurable: true,
            enumerable: false,
            value: this.constructor.name,
            writable: true,
        });

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DbRecordNotFoundError);
        }
    }

    // NOTE: 独自のunique関数をfindUniqueOrThrowに変更中のための一時的な処置
    // findUniqueOrThrowで投げられるエラーでもinstanceofでtrueを返すようにしておく。
    static [Symbol.hasInstance](e: unknown) {
        if (e instanceof PrismaClientKnownRequestError) {
            return true
        } else {
            return false
        }
    }
}