import {
    ExecutionsCheckerOptions,
    ExecutionsCheckResult,
} from '@social-exchange/types';

export type Executions = {
    post(options: ExecutionsCheckerOptions): ExecutionsCheckResult,
};
