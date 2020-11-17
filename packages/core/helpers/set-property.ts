import { Either, getOrElseW, right, toError } from 'fp-ts/Either';

export const setProperty =
<K extends string, E, V>(key: K, value: Either<E, V>) => {
    return <T>(target: T) => {
        const eitherValue = getOrElseW(toError)(value);
        const source = { [key]: eitherValue } as { [key in K]: V };
        const result = Object.assign(target, source);
        return right(result) as Either<Error, typeof result>;
    };
};
