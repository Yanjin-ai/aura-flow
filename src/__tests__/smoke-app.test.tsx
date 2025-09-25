import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import App from '@/App.jsx'

describe('App smoke', () => {
  it('renders home via router', () => {
    render(<App />)
    expect(screen.getByText(/Home/i)).toBeInTheDocument()
  })
})

// 简单注释：冒烟测试 1，验证 App 能渲染出 Home。

