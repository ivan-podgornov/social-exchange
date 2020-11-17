export type ExecutionsCheckerOptions = {
    dispensesIds: number[],
};

export type CheckResult = {
    error?: string,
    dispenseId: number,
    status: boolean,
};

export type ExecutionsCheckResult = {
    results: Array<CheckResult>,
    reward: number,
}
