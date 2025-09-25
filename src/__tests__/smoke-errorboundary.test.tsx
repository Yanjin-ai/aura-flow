import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ErrorBoundary from '@/components/dev/ErrorBoundary.jsx'

function Boom(){
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('catches render error', () => {
    render(
      <ErrorBoundary>
        {/* @ts-expect-error purposely crash */}
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText(/UI 崩溃/)).toBeInTheDocument()
  })
})

// 简单注释：冒烟测试 3，验证 ErrorBoundary 能捕获子组件异常。

