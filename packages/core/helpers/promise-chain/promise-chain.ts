import { Either, isLeft, getOrElseW } from 'fp-ts/Either';

type FunctionPE<L, R, Arg> = (arg: Arg) => Promise<Either<L, R>>;

/**
 * Используется для того чтобы чейнить Either в функции, которые возвращают
 * Either.
 */
export const promiseChain = <L, R, Arg>(fn: FunctionPE<L, R, Arg>) => {
    return (arg: Either<L, Arg>) => {
        if (isLeft(arg)) return Promise.resolve(arg);
        const rawArg = getOrElseW((e: L) => e)(arg) as Arg;
        return fn(rawArg);
    };
};
