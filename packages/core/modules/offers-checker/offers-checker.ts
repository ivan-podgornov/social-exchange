import { chain, left, right, isLeft } from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';
import { Injectable } from '@nestjs/common';
import { NetworkType } from '@social-exchange/types';
import { PriceCalculator } from '../price-calculator/price-calculator';
import { VkOffersChecker } from './vk/vk-offers-checker';
import type { CheckerOptions } from './checker-options';
import type { Checker } from './types';

@Injectable()
export class OffersChecker {
    constructor(
        private priceCalculator: PriceCalculator,
        private vkOffersChecker: VkOffersChecker,
    ) {}

    async check(options: CheckerOptions) {
        const count = pipe(
            options.count,
            chain(this.checkType<number>('count', 'number')),
            chain(this.minCount),
            chain(this.hasBalance(options)),
        );

        const link = pipe(
            options.link,
            chain(this.checkType<string>('link', 'string')),
        );

        const type = pipe(
            options.type,
            chain(this.checkType<string>('type', 'string')),
        );

        const networkType = pipe(
            options.networkType,
            chain(this.checkType<NetworkType>('networkType', 'string')),
            chain(this.doesSupportNetwork),
        );

        options.setChecks({ count, link, type, networkType });
        return this.getChecker().check(options);
    }

    private getChecker(): Checker {
        return this.vkOffersChecker;
    }

    /**
     * Возвращает функцию, которая проверит соответствует переданный в
     * возвращенную функцию аргумент, указанному значению
     */
    private checkType<T>(name: string, typename: string) {
        return (value: T) => {
            if (typeof value === typename) return right(value);

            const message = `"${name}" must be a ${typename}`;
            return left(message);
        };
    }

    private minCount(count: number) {
        if (count < 1) {
            const message = 'Минимальное количество выполнений: 1';
            return left(message);
        }

        return right(count);
    }

    private hasBalance(options: CheckerOptions) {
        const isSupportedNetwork = chain(this.doesSupportNetwork)
            (options.networkType);
        const isSupportedType = pipe(
            options.type,
            chain(this.vkOffersChecker.doesSupportType),
        );

        return (count: number) => {
            if (isLeft(isSupportedNetwork)) return isSupportedNetwork;
            if (isLeft(isSupportedType)) return isSupportedType;

            const price = this.priceCalculator.calculate(options.offer);
            if (options.user.balance >= price) return right(count);
            const diff = price - options.user.balance;
            const message = `Не хватает ${diff} сердечек`;
            return left(message);
        };
    }

    private doesSupportNetwork(networkType: NetworkType) {
        const supportedNetworks = Object.keys(NetworkType) as NetworkType[];
        const doesSupport = supportedNetworks.includes(networkType);
        if (doesSupport) return right(networkType);

        const message = `"${networkType}" - неизвестный тип социальной `
            + `сети. Поддерживаемые социальные сети: `
            + `${supportedNetworks.join(', ')}`;

        return left(message);
    }
};
