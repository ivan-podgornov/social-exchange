import type { Either } from 'fp-ts/Either';
import type { ValidationError } from 'errors/validation-error';
import type { CheckerOptions } from './checker-options';
import type { Resource } from '../vk/resource';

export type ValidationResult<T> = Either<string, T>;
export type Checks = {
    count: ValidationResult<number>,
    link: ValidationResult<string>,
    networkType: ValidationResult<string>,
    type: ValidationResult<string>,
};

export type Checker = {
    check(options: CheckerOptions): Promise<Either<ValidationError, Resource>>,
    doesSupportType(type: string): Either<string, string>,
};
