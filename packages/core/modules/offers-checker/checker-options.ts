import { OfferConstructorOptions, User } from '@social-exchange/types';
import { Left, fold, isLeft, isRight, right } from 'fp-ts/Either';
import type { Checks, ValidationResult } from './types';
import { ValidationError } from 'errors/validation-error';

export class CheckerOptions {
    offer: OfferConstructorOptions;
    checks: Partial<Checks>;
    user: User;

    constructor(options: OfferConstructorOptions, user: User) {
        this.offer = options;
        this.checks = {};
        this.user = user;
    }

    get count() {
        return this.getParam('count');
    }

    get link() {
        return this.getParam('link');
    }

    get networkType() {
        return this.getParam('networkType');
    }

    get type() {
        return this.getParam('type');
    }

    haveLeft() {
        const leftOne = (Object.values(this.checks) as ValidationResult<any>[])
            .find((check): check is Left<string> => isLeft(check));
        return Boolean(leftOne);
    }

    setChecks(checks: Partial<Checks>) {
        this.checks = { ...this.checks, ...checks };
    }

    toValidationErrors() {
        type Entry = [keyof Checks, ValidationResult<any>];
        const errors = (Object.entries(this.checks) as Entry[])
            .reduce((errors, entry) => {
                const [key, value] = entry;
                if (isRight(value)) return errors;
                const error = fold(
                    String,
                    (value: never) => value,
                )(value);

                return { ...errors, [key]: error };
            }, {} as { [key: string]: string });

        return new ValidationError(errors);
    }

    private getParam<K extends keyof OfferConstructorOptions>(param: K) {
        return param in this.checks
            ? this.checks[param] as ValidationResult<OfferConstructorOptions[K]>
            : right(this.offer[param]) as ValidationResult<OfferConstructorOptions[K]>;
    }
}
