type PutOptions = {
    read: boolean,
    uriParam: number,
};

export type Events = {
    put(options: PutOptions): {},
};

