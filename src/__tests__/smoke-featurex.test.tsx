import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FeatureXList from '@/pages/FeatureXList.jsx'

const queryClient = new QueryClient()

describe('FeatureX list', () => {
  it('shows loading and then list (mocked by msw)', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/FeatureX"]}>
          <Routes>
            <Route path="/FeatureX" element={<FeatureXList />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByText(/加载中/)).toBeInTheDocument()
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
  })
})

// 简单注释：冒烟测试 2，验证 FeatureX 三态（至少覆盖加载与成功列表）。

