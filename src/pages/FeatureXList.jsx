import React from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

async function fetchFeatureX() {
  const res = await apiClient.get('/featurex');
  return res.data?.items ?? [];
}

export default function FeatureXList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['featurex', 'list'],
    queryFn: fetchFeatureX
  });

  if (isLoading) return <div style={{ padding: 24 }}>加载中...</div>;
  if (isError) return <div style={{ padding: 24 }}>出错了：{String(error?.message || 'unknown')}</div>;
  if (!data || data.length === 0) return <div style={{ padding: 24 }}>暂无数据</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-2xl font-bold mb-4">FeatureX 列表</h1>
      <ul className="list-disc pl-6">
        {data.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

// 简单注释：使用 React Query 拉取 /featurex 数据，包含 loading/empty/error 三态。

