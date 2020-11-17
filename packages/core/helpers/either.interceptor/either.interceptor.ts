import { Either, getOrElseW, toError } from 'fp-ts/Either';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ValidationError } from 'errors/validation-error';

import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';

type Response<T> = T;

/**
 * Если какой-то из контроллеров вернёт Either, преобразует этот Either в
 * привычное значение.
 */
@Injectable()
export class EitherInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        const isEither = (obj: T|Either<Error, T>): obj is Either<Error, T> => {
            if (typeof obj === 'undefined') return false;
            return '_tag' in obj;
        };

        const isValidationErrors = (error: Error): error is ValidationError => {
            return error.name === 'ValidationError';
        };

        const errorToJSON = (error: Error) => {
            return {
                status: 'error',
                error: 'name' in error ? error.name : 'error',
                message: error.message,
            };
        };

        const handleEither = (source: T) => {
            if (!isEither(source)) return source;

            const value = getOrElseW(toError)(source);

            if (value instanceof Error) {
                const isT = (value: any): value is T => true;
                const errorValue = isValidationErrors(value)
                    ? value.toJSON()
                    : errorToJSON(value);

                if (!isT(errorValue)) throw value;
                return errorValue;
            }

            return value;
        };

        return next.handle().pipe(map(handleEither));
    }
}
