import type { Either } from 'fp-ts/Either';

export type Info = [
    cover: Either<Error, string>,
    counter: Either<Error, number>,
    created: Either<Error, Date>,
];
