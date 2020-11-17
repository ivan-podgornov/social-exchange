export type VkGroup = {
    deactivated: 'banned'|'deleted',
    isClosed: 0|1|2,
    name: string,
    membersCount: number,
    photo50: string,
};

export type VkUser = {
    deactivated: 'banned'|'deleted',
    isClosed: 0|1,
    firstName: string,
    lastName: string,
    photo50: string,
    counters: {
        followers: number,
        friends: number,
    },
};

export type VkOwner = VkUser|VkGroup;
export const isVkUser = (owner: VkOwner): owner is VkUser => {
    return 'firstName' in owner;
}

type Size = {
    type: 's'|string,
    url: string,
};

export type VkPhoto = {
    date: number,
    sizes: Array<Size>,
}

type Attachment = {
    type: 'photo'|string,
    photo?: VkPhoto,
};

export type VkPost = {
    attachments?: Array<Attachment>,
    copyHistory?: VkPost[],
    date: number,
    id: number,
    likes: { count: number },
    ownerId: number,
    postType: 'post'|'photo',
    reposts: { count: number },
};
