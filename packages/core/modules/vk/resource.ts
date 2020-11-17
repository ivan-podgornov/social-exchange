import type { IResolvedResource } from 'vk-io/lib/snippets/resource-resolver';
import { NetworkType } from '@social-exchange/types';

export type Resource = {
    network: NetworkType,
    objectId: number,
    ownerId?: number,
    type: 'user'|'group'|'photo'|'post',

    toString(): string,
}

export class VkResource implements Resource {
    network = NetworkType.vk;
    objectId: number;
    ownerId?: number;
    type: 'user'|'group'|'photo'|'post';

    constructor(resource: IResolvedResource) {
        this.objectId = resource.id;
        this.ownerId = resource.owner;

        const type = resource.type === 'wall' ? 'post' : resource.type;
        const isSupportedType = (type: string): type is Resource['type'] => {
            const types = ['user', 'group', 'photo', 'post'];
            return types.includes(type);
        };

        if (!isSupportedType(type)) {
            throw new TypeError(`Тип ресурса "${type}" не поддерживается`);
        }

        this.type = type;
    }

    toString() {
        const resolveType = (type: Resource['type']) => {
            switch (type) {
                case 'group': return 'public';
                case 'post': return 'wall';
                case 'user': return 'id';
                default: return type;
            }
        };

        const type = resolveType(this.type);
        const owner = this.ownerId ? `${this.ownerId}_` : '';
        const id = this.type === 'group'
            ? Math.abs(this.objectId)
            : this.objectId;

        return `https://vk.com/${type}${owner}${id}`;
    }
}
