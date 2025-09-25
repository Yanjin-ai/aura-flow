module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档更新
        'style',    // 代码格式调整
        'refactor', // 代码重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建过程或辅助工具的变动
        'ci',       // CI/CD 相关
        'build',    // 构建系统或外部依赖的变动
        'revert',   // 回滚提交
        'security', // 安全相关
        'deps',     // 依赖更新
        'docker',   // Docker 相关
        'config'    // 配置文件更新
      ]
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100]
  },
  prompt: {
    questions: {
      type: {
        description: "选择提交类型",
        enum: {
          feat: {
            description: '新功能',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: '修复 bug',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: '文档更新',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description: '代码格式调整',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: '代码重构',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: '性能优化',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: '测试相关',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description: '构建系统或外部依赖的变动',
            title: 'Builds',
            emoji: '🛠',
          },
          ci: {
            description: 'CI/CD 相关',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          chore: {
            description: '构建过程或辅助工具的变动',
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: '回滚提交',
            title: 'Reverts',
            emoji: '🗑',
          },
          security: {
            description: '安全相关',
            title: 'Security',
            emoji: '🔒',
          },
          deps: {
            description: '依赖更新',
            title: 'Dependencies',
            emoji: '📦',
          },
          docker: {
            description: 'Docker 相关',
            title: 'Docker',
            emoji: '🐳',
          },
          config: {
            description: '配置文件更新',
            title: 'Configuration',
            emoji: '⚙️',
          }
        }
      },
      scope: {
        description: '选择影响范围 (可选)',
        enum: {
          'frontend': {
            description: '前端相关',
            title: 'Frontend'
          },
          'backend': {
            description: '后端相关',
            title: 'Backend'
          },
          'api': {
            description: 'API 相关',
            title: 'API'
          },
          'ui': {
            description: 'UI 组件',
            title: 'UI'
          },
          'auth': {
            description: '认证相关',
            title: 'Authentication'
          },
          'db': {
            description: '数据库相关',
            title: 'Database'
          },
          'docker': {
            description: 'Docker 相关',
            title: 'Docker'
          },
          'ci': {
            description: 'CI/CD 相关',
            title: 'CI/CD'
          },
          'security': {
            description: '安全相关',
            title: 'Security'
          },
          'perf': {
            description: '性能相关',
            title: 'Performance'
          },
          'test': {
            description: '测试相关',
            title: 'Testing'
          },
          'docs': {
            description: '文档相关',
            title: 'Documentation'
          },
          'config': {
            description: '配置相关',
            title: 'Configuration'
          }
        }
      },
      subject: {
        description: '简短描述变更内容'
      },
      body: {
        description: '详细描述变更内容 (可选)'
      },
      isBreaking: {
        description: '是否包含破坏性变更?'
      },
      breakingBody: {
        description: '描述破坏性变更'
      },
      breaking: {
        description: '列出破坏性变更'
      },
      isIssueAffected: {
        description: '是否关联 issue?'
      },
      issuesBody: {
        description: '如果关联 issue，请描述'
      },
      issues: {
        description: '列出关联的 issue (例如: #123)'
      }
    }
  }
};
