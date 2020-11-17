import {
    Either,
    getOrElseW,
    isLeft,
    right,
} from 'fp-ts/Either';

type PromiseEither<L, R> = Promise<Either<L, R>>|Either<L, R>;

type ChainFPE<L, R, Argument> =
    (arg: Argument) => PromiseEither<L, R>;

export const promiseChain = <L, R, Argument>(fn: ChainFPE<L, R, Argument>) => {
    return (arg: Either<L, Argument>) => {
        if (isLeft(arg)) return Promise.resolve(arg);
        const raw = getOrElseW((left: L) => left)(arg) as Argument;
        return fn(raw) as Promise<Either<L, R>>;
    };
};

export const promiseMap = <R, Argument>(fn: (arg: Argument) => R|Promise<R>) => {
    return async <L>(arg: Either<L, Argument>): Promise<Either<L, R>> => {
        if (isLeft(arg)) return arg;

        const rawArg = getOrElseW((left: never) => left)(arg);
        const result = await fn(rawArg);
        return right(result);
    };
};
