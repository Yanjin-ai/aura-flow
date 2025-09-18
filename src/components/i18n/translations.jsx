
export const translations = {
  "zh-CN": {
    navigation: {
      analytics: "统计",
      insights: "洞察",
      settings: "设置",
      backToToday: "回到今日"
    },
    dayView: {
      todayTasks: "今日待办",
      addTaskPlaceholder: "添加新任务... (支持语音和智能解析)",
      smartInputHint: "试试输入: \"明天下午3点开会 #工作\" 或粘贴链接",
      processing: "处理中...",
    },
    taskList: {
      pending: "待处理",
      completed: "已完成",
      allDone: "太棒了，全部完成！",
      allDoneDesc: "享受这片刻的宁静，或添加新任务。"
    },
    taskItem: {
      categoryConfirmation: "分类正确吗？"
    },
    taskInput: {
      templates: "任务模板",
      quickTemplates: "快速模板",
      templateHint: "点击"+"号可快速创建任务",
      favorites: "我的收藏",
      allTemplates: "所有模板",
      voiceInput: "语音输入",
      stopVoiceInput: "停止录音",
      processingVoice: "识别中...",
      listening: "正在聆听...",
      micPermissionDenied: "麦克风权限被拒绝",
      voiceError: "语音识别失败",
      noSpeechError: "未检测到语音"
    },
    templates: {
      dailyReview: {
        name: "每日复盘",
        content: "今日复盘和明天计划"
      },
      meetingPrep: {
        name: "会议准备",
        content: "准备明天的会议资料和议程"
      },
      weeklyShopping: {
        name: "周末采购",
        content: "去超市买菜和生活用品 #购物"
      },
      exercise: {
        name: "运动健身",
        content: "跑步30分钟或健身房锻炼 !"
      },
      studySession: {
        name: "学习时间",
        content: "学习新技能或看书1小时"
      },
      callFamily: {
        name: "联系家人",
        content: "给家里打电话，关心近况"
      }
    },
    pendingTasks: {
      title: "发现 {{count}} 个过期任务",
      description: "您有一些过去的未完成任务，需要移到今天处理吗？",
      moveAllToday: "全部移到今天",
      viewDetails: "查看详情并选择",
      ignoreTemporarily: "暂时忽略",
      selectTasks: "选择要延期的任务",
      collapse: "收起详情",
      tasksCount: "{{count}}个任务",
    },
    analytics: {
      title: "数据分析",
      subtitle: "回顾您最近30天的效率和产出",
      totalTasks: "总任务数",
      last30Days: "最近30天",
      completionRate: "完成率",
      overallPerformance: "整体表现",
      avgTasksPerDay: "日均任务",
      tasksPerDay: "个/天",
      streakDays: "连续完成",
      consecutiveCompletion: "天",
      weeklyCompletion: "近一周完成情况",
      completed: "完成",
      total: "总计",
      categoryDistribution: "任务分类占比",
      categoryCompletionDetails: "各分类完成详情"
    },
    insights: {
      title: "AI 洞察",
      subtitle: "利用AI分析您的任务，发现模式并获得建议",
      dailyReview: "每日洞察",
      weeklyReview: "每周总结",
      dailyInsight: "每日洞察",
      weeklyInsight: "本周洞察",
      noInsightYet: "暂无{{type}}洞察",
      generateInsight: "生成{{type}}洞察",
      analyzing: "分析中...",
      daily: "每日",
      weekly: "每周",
      generationFailed: "洞察生成失败",
      generationFailedDesc: "无法生成内容，请稍后重试或检查您的任务数据。",
      analysisTime: "分析于 {{time}}",
      highlights: "今日亮点",
      recommendations: "优化建议",
      detailedContent: "详细内容",
      regenerate: "重新生成",
      provideFeedback: '提供反馈',
      todayReflection: '今日复盘',
      myReflection: '我的复盘',
      generationFailedAlertDaily: "生成每日洞察失败，请稍后重试",
      generationFailedAlertWeekly: "生成每周洞察失败，请稍后重试"
    },
    settings: {
      title: "设置",
      subtitle: "个性化您的应用体验",
      language: "语言设置",
      languageDesc: "选择您偏好的界面语言",
      languages: {
        "zh-CN": "简体中文",
        "en-US": "English (US)"
      },
      aiSettings: "AI 智能设置",
      aiSettingsDesc: "管理AI功能，释放您的效率潜能",
      dailyInsights: "启用每日洞察",
      dailyInsightsDesc: "每天结束时自动生成复盘和建议",
      weeklyInsights: "启用每周洞察",
      weeklyInsightsDesc: "每周为您提供效率总结和趋势分析",
      urlExtraction: "启用链接内容提取",
      urlExtractionDesc: "粘贴链接时自动识别内容并创建任务",
      taskSettings: "任务管理",
      taskSettingsDesc: "自定义任务处理方式",
      autoRollover: "自动延期过期任务",
      autoRolloverDesc: "当您打开应用时，自动提示处理过期任务",
      rolloverRange: "延期检查范围",
      rolloverDays: {
        "1": "过去1天",
        "3": "过去3天",
        "7": "过去7天"
      },
      rolloverNotification: "显示延期通知",
      rolloverNotificationDesc: "在首页卡片式提醒您处理过期任务",
    },
    common: {
      save: "保存",
      saving: "保存中...",
      saved: "已保存！",
      cancel: "取消",
      edit: "编辑",
      loading: "加载中...",
      rolloverFailed: "延期任务失败",
      delete: '删除',
      confirm: '确认',
      back: '返回',
      optional: '(可选)',
      submitting: '提交中...',
      sending: '发送中...'
    },
    feedback: {
      title: '您的反馈',
      howHelpful: '这份洞察对您有帮助吗？',
      whatCanImprove: '哪些方面可以改进？',
      additionalComments: '其他建议',
      commentsPlaceholder: '请分享您的想法和建议...',
      submit: '提交反馈',
      accuracy: '准确性',
      relevance: '相关性',
      actionability: '可操作性',
      clarity: '清晰度',
      completeness: '完整性',
      helpful: '有帮助',
      notHelpful: '没帮助',
      thanks: '感谢您的反馈！',
      prompt: '这份洞察对您有帮助吗？',
      commentPlaceholder: '可以分享更多细节吗？',
      send: '发送',
      submitFailed: '反馈提交失败，请稍后重试'
    },
    reflection: {
      writeTitle: '撰写今日复盘',
      editTitle: '编辑复盘',
      todayMood: '今天的心情状态',
      mainContent: '复盘内容',
      contentPlaceholder: '回顾今天的收获、挑战、感悟...\n\n例如：\n• 今天最有成就感的事情是什么？\n• 遇到了什么困难，是如何解决的？\n• 有什么新的想法或启发？\n• 明天想要改进的地方？',
      contentHint: '写下您今天最深刻的感受或收获',
      keyInsights: '关键洞察',
      addInsightPlaceholder: '添加一个重要的领悟或发现',
      tomorrowPlan: '明日计划',
      tomorrowPlanPlaceholder: '明天想要重点关注或改进的事项...',
      tags: '标签',
      addTagPlaceholder: '添加标签（如：工作、学习、生活）',
      noReflectionYet: '今天还没有写复盘',
      writeToday: '写今日复盘',
      edit: '编辑',
      historyTitle: '复盘历史',
      historySubtitle: '回顾您的成长轨迹和思考历程',
      searchPlaceholder: '搜索复盘内容...',
      filterByTags: '按标签筛选',
      noReflections: '您还没有写过任何复盘',
      noMatchingReflections: '没有找到匹配的复盘记录',
      optionalDetails: '更多细节（可选）',
      saveFailed: '保存复盘失败，请重试',
      emptyState: {
        title: '开始今日复盘',
        description: '花几分钟记录今天的思考，这会成为您成长路上珍贵的足迹。'
      },
      mood: {
        excellent: '非常好',
        good: '良好',
        normal: '正常',
        challenging: '有挑战',
        difficult: '困难'
      }
    },
    welcomeGuide: {
      title: "欢迎来到 AuraFlow",
      subtitle: "您的智能效率伙伴，让我们通过3个步骤快速开始。",
      feature1Title: "智能任务输入",
      feature1Desc: "像说话一样添加任务，AuraFlow会自动识别日期、时间和类别。试试输入“明天下午3点开会 #工作”，或直接粘贴一个网页链接。",
      feature2Title: "AI 驱动的洞察",
      feature2Desc: "AuraFlow 会分析您的任务模式，为您提供每日和每周的效率报告，助您发现自己的工作节奏，并给出优化建议。",
      feature3Title: "结构化的复盘",
      feature3Desc: "不仅仅是记录，更是成长。通过引导式的问题和心情记录，让每一次复盘都成为您前进的阶梯。",
      next: "下一步",
      back: "上一步",
      getStarted: "开始使用"
    }
  },
  "en-US": {
    navigation: {
      analytics: "Analytics",
      insights: "Insights",
      settings: "Settings",
      backToToday: "Back to Today"
    },
    dayView: {
      todayTasks: "Today's Tasks",
      addTaskPlaceholder: "Add a new task... (Voice & Smart Parse)",
      smartInputHint: "Try: \"Meeting tomorrow at 3pm #work\" or paste a link",
      processing: "Processing...",
    },
    taskList: {
      pending: "Pending",
      completed: "Completed",
      allDone: "All done, nice work!",
      allDoneDesc: "Enjoy this moment of peace, or add a new task."
    },
    taskItem: {
      categoryConfirmation: "Is this correct?"
    },
    taskInput: {
      templates: "Task Templates",
      quickTemplates: "Quick Templates",
      templateHint: "Click '+' to quickly create a task",
      favorites: "Favorites",
      allTemplates: "All Templates",
      voiceInput: "Voice Input",
      stopVoiceInput: "Stop Recording",
      processingVoice: "Processing...",
      listening: "Listening...",
      micPermissionDenied: "Microphone permission denied",
      voiceError: "Voice recognition failed",
      noSpeechError: "No speech detected"
    },
    templates: {
      dailyReview: {
        name: "Daily Review",
        content: "Today's reflection and tomorrow's plan"
      },
      meetingPrep: {
        name: "Meeting Preparation",
        content: "Prepare meeting materials and agenda for tomorrow"
      },
      weeklyShopping: {
        name: "Weekly Shopping",
        content: "Go to supermarket for groceries and supplies #shopping"
      },
      exercise: {
        name: "Exercise",
        content: "30-minute run or gym workout !"
      },
      studySession: {
        name: "Study Session",
        content: "Learn new skills or read for 1 hour"
      },
      callFamily: {
        name: "Call Family",
        content: "Call home to check on everyone"
      }
    },
    pendingTasks: {
      title: "Found {{count}} overdue tasks",
      description: "You have some unfinished tasks from the past. Move them to today?",
      moveAllToday: "Move All to Today",
      viewDetails: "View Details & Select",
      ignoreTemporarily: "Ignore for Now",
      selectTasks: "Select tasks to roll over",
      collapse: "Collapse Details",
      tasksCount: "{{count}} tasks",
    },
    analytics: {
      title: "Analytics",
      subtitle: "Review your efficiency and output over the last 30 days",
      totalTasks: "Total Tasks",
      last30Days: "Last 30 days",
      completionRate: "Completion Rate",
      overallPerformance: "Overall Performance",
      avgTasksPerDay: "Avg Tasks/Day",
      tasksPerDay: "tasks/day",
      streakDays: "Streak",
      consecutiveCompletion: "days",
      weeklyCompletion: "Last Week's Completion",
      completed: "Completed",
      total: "Total",
      categoryDistribution: "Category Distribution",
      categoryCompletionDetails: "Category Completion Details"
    },
    insights: {
      title: "AI Insights",
      subtitle: "Analyze your tasks with AI to find patterns and get suggestions",
      dailyReview: "Daily Insight",
      weeklyReview: "Weekly Review",
      dailyInsight: "Daily Insight",
      weeklyInsight: "This Week's Insight",
      noInsightYet: "No {{type}} insight yet",
      generateInsight: "Generate {{type}} Insight",
      analyzing: "Analyzing...",
      daily: "Daily",
      weekly: "Weekly",
      generationFailed: "Insight Generation Failed",
      generationFailedDesc: "Could not generate content. Please try again later or check your task data.",
      analysisTime: "Analyzed at {{time}}",
      highlights: "Highlights",
      recommendations: "Recommendations",
      detailedContent: "Detailed Content",
      regenerate: "Regenerate",
      provideFeedback: 'Provide Feedback',
      todayReflection: "Today's Reflection",
      myReflection: 'My Reflection',
      generationFailedAlertDaily: "Failed to generate daily insight, please try again later",
      generationFailedAlertWeekly: "Failed to generate weekly insight, please try again later"
    },
    settings: {
      title: "Settings",
      subtitle: "Personalize your app experience",
      language: "Language",
      languageDesc: "Choose your preferred interface language",
      languages: {
        "zh-CN": "简体中文",
        "en-US": "English (US)"
      },
      aiSettings: "AI Settings",
      aiSettingsDesc: "Manage AI features to unlock your productivity potential",
      dailyInsights: "Enable Daily Insights",
      dailyInsightsDesc: "Automatically generate reviews and suggestions at the end of each day",
      weeklyInsights: "Enable Weekly Insights",
      weeklyInsightsDesc: "Get a weekly summary and trend analysis of your productivity",
      urlExtraction: "Enable Link Content Extraction",
      urlExtractionDesc: "Automatically identify content and create tasks when pasting links",
      taskSettings: "Task Management",
      taskSettingsDesc: "Customize how your tasks are handled",
      autoRollover: "Auto Rollover Overdue Tasks",
      autoRolloverDesc: "Automatically prompt to handle overdue tasks when you open the app",
      rolloverRange: "Rollover Check Range",
      rolloverDays: {
        "1": "Past 1 day",
        "3": "Past 3 days",
        "7": "Past 7 days"
      },
      rolloverNotification: "Show Rollover Notification",
      rolloverNotificationDesc: "Remind you to handle overdue tasks with a card on the homepage",
    },
    common: {
      save: "Save",
      saving: "Saving...",
      saved: "Saved!",
      cancel: "Cancel",
      edit: "Edit",
      loading: "Loading...",
      rolloverFailed: "Failed to roll over tasks",
      delete: 'Delete',
      confirm: 'Confirm',
      back: 'Back',
      optional: '(Optional)',
      submitting: 'Submitting...',
      sending: 'Sending...'
    },
    feedback: {
      title: 'Your Feedback',
      howHelpful: 'How helpful was this insight?',
      whatCanImprove: 'What areas can be improved?',
      additionalComments: 'Additional Comments',
      commentsPlaceholder: 'Please share your thoughts and suggestions...',
      submit: 'Submit Feedback',
      accuracy: 'Accuracy',
      relevance: 'Relevance',
      actionability: 'Actionability',
      clarity: 'Clarity',
      completeness: 'Completeness',
      helpful: 'Helpful',
      notHelpful: 'Not Helpful',
      thanks: 'Thanks for your feedback!',
      prompt: 'Was this insight helpful?',
      commentPlaceholder: 'Could you share more details?',
      send: 'Send',
      submitFailed: 'Failed to submit feedback, please try again later'
    },
    reflection: {
      writeTitle: "Write Today's Reflection",
      editTitle: 'Edit Reflection',
      todayMood: "Today's Mood",
      mainContent: 'Reflection Content',
      contentPlaceholder: 'Reflect on today\'s achievements, challenges, insights...\n\nFor example:\n• What was the most fulfilling thing today?\n• What challenges did you face and how did you solve them?\n• Any new ideas or inspirations?\n• What would you like to improve tomorrow?',
      contentHint: 'Write your most profound feeling or gain today',
      keyInsights: 'Key Insights',
      addInsightPlaceholder: 'Add an important realization or discovery',
      tomorrowPlan: "Tomorrow's Plan",
      tomorrowPlanPlaceholder: 'What you want to focus on or improve tomorrow...',
      tags: 'Tags',
      addTagPlaceholder: 'Add tags (e.g., work, study, life)',
      noReflectionYet: "Haven't written a reflection today",
      writeToday: "Write Today's Reflection",
      edit: 'Edit',
      historyTitle: 'Reflection History',
      historySubtitle: 'Review your growth journey and thought processes',
      searchPlaceholder: 'Search reflection content...',
      filterByTags: 'Filter by Tags',
      noReflections: "You haven't written any reflections yet",
      noMatchingReflections: 'No matching reflection records found',
      optionalDetails: 'More Details (Optional)',
      saveFailed: 'Failed to save reflection, please try again',
      emptyState: {
        title: 'Start Today\'s Reflection',
        description: 'Take a few minutes to record your thoughts today. This will become a precious footprint on your growth journey.'
      },
      mood: {
        excellent: 'Excellent',
        good: 'Good',
        normal: 'Normal',
        challenging: 'Challenging',
        difficult: 'Difficult'
      }
    },
    welcomeGuide: {
      title: "Welcome to AuraFlow",
      subtitle: "Your intelligent productivity partner. Let's get started in 3 quick steps.",
      feature1Title: "Smart Task Input",
      feature1Desc: "Add tasks like you speak. AuraFlow automatically recognizes dates, times, and categories. Try 'Meeting tomorrow at 3pm #work' or just paste a URL.",
      feature2Title: "AI-Powered Insights",
      feature2Desc: "AuraFlow analyzes your task patterns to provide daily and weekly reports, helping you discover your work rhythm and offering suggestions for improvement.",
      feature3Title: "Structured Reflection",
      feature3Desc: "It's not just about logging, it's about growing. Use guided questions and mood tracking to make every reflection a step forward.",
      next: "Next",
      back: "Back",
      getStarted: "Get Started"
    }
  }
};
