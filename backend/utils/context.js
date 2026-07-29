import { AsyncLocalStorage } from 'async_hooks';

// Central store to make the request context (and its resolved db pool) accessible anywhere
export const requestContext = new AsyncLocalStorage();
