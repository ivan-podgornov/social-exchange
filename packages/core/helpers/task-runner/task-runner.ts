import {
    Either,
    isLeft,
    right,
} from 'fp-ts/Either';

type Task<L, R> = Promise<Either<L, R>>|Either<L, R>;
type Tasks<L, R> = ((r: R) => Task<L, R>)[];

/**
 * Возвращает функцию, которая последовательно запускает функции, которые
 * возвращают обещание вернуть Either. Аргументом этих функций будет то, что
 * будет передано в возвращённую функцию Если один из итоговых Either пойдёт по
 * неудачному пути, функция вернёт этот неудачный Either. Если все Either'ы
 * будут удачными, вернёт тот Either, что вернула последняя функция.
 */
export const series = <L, R>(tasks: Tasks<L, R>) => {
    return async (arg: R): Promise<Either<L, R>> => {
        const results: Either<L, R>[] = [];

        for (const task of tasks) {
            const result = await task(arg);
            if (isLeft(result)) return result;
            results.push(result);
        }

        return tasks.length
            ? results.slice(-1)[0]
            : right(arg);
    };
};
