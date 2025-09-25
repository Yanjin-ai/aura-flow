import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// 简单注释：浏览器端 MSW worker 初始化。

