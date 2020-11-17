import type { Either } from 'fp-ts/Either';
import type { Resource } from '../vk/resource';

export type Resolver = {
    resolve(resource: Resource): Promise<Either<Error, string>>,
}
