import { http, HttpResponse } from 'msw';

export const handlers = [
  // FeatureX 列表接口 Mock
  http.get('http://localhost:5173/featurex', () => {
    console.log('[MSW] Intercepted /featurex request');
    return HttpResponse.json({ items: [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' }
    ]});
  }),
  // 也支持相对路径
  http.get('/featurex', () => {
    console.log('[MSW] Intercepted relative /featurex request');
    return HttpResponse.json({ items: [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' }
    ]});
  })
];

// 简单注释：MSW 请求处理集合，包含 FeatureX 列表的 Mock。

