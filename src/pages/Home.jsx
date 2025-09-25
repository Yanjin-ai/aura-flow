import React from "react";

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-2xl font-bold mb-2">Home</h1>
      <p className="text-slate-600">欢迎来到首页。</p>
      <a href="/FeatureX" className="text-blue-600 underline">前往 FeatureX 列表</a>
    </div>
  );
}

// 简单注释：这是新的首页组件 Home，用于恢复 /Home 为主入口。

