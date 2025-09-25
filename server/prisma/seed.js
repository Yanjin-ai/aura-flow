/**
 * 数据库种子文件
 * 用于初始化开发环境的示例数据
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始播种数据库...');
  
  // 清理现有数据
  await prisma.insightFeedback.deleteMany();
  await prisma.reflection.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.task.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('🧹 清理现有数据完成');
  
  // 创建示例用户
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@auraflow.com',
      name: '演示用户',
      password_hash: hashedPassword,
      has_seen_welcome_guide: true,
      language: 'zh-CN',
      auto_rollover_enabled: true,
      auto_rollover_days: 3,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true
    }
  });
  
  console.log('👤 创建示例用户:', user.email);
  
  // 创建示例任务
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: '完成项目文档',
        description: '编写 API 文档和用户手册',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
        user_id: user.id,
        tags: JSON.stringify(['文档', '项目']),
        metadata: JSON.stringify({ estimated_hours: 4 })
      }
    }),
    prisma.task.create({
      data: {
        title: '代码审查',
        description: '审查团队成员的代码提交',
        status: 'PENDING',
        priority: 'MEDIUM',
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1天后
        user_id: user.id,
        tags: JSON.stringify(['代码审查', '团队']),
        metadata: JSON.stringify({ estimated_hours: 2 })
      }
    }),
    prisma.task.create({
      data: {
        title: '学习新技术',
        description: '学习 React 18 的新特性',
        status: 'PENDING',
        priority: 'LOW',
        user_id: user.id,
        tags: JSON.stringify(['学习', 'React']),
        metadata: JSON.stringify({ estimated_hours: 6 })
      }
    }),
    prisma.task.create({
      data: {
        title: '团队会议',
        description: '参加每周团队例会',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
        user_id: user.id,
        tags: JSON.stringify(['会议', '团队']),
        metadata: JSON.stringify({ duration_minutes: 60 })
      }
    })
  ]);
  
  console.log('📝 创建示例任务:', tasks.length, '个');
  
  // 创建示例洞察
  const insights = await Promise.all([
    prisma.insight.create({
      data: {
        title: '每日洞察 - 2024年1月15日',
        content: `基于您今天的任务完成情况，我注意到：

**完成情况分析：**
- 团队会议已成功完成，为项目进展提供了良好的沟通
- 项目文档编写正在进行中，建议保持当前节奏

**效率建议：**
- 建议将代码审查安排在上午进行，此时注意力更集中
- 学习新技术可以安排在下午，作为工作间隙的调剂

**改进方向：**
- 考虑使用番茄工作法来提高专注度
- 建议为每个任务设置明确的时间块`,
        type: 'DAILY',
        user_id: user.id,
        metadata: JSON.stringify({
          generated_at: new Date().toISOString(),
          tasks_analyzed: 4,
          ai_provider: 'mock'
        })
      }
    }),
    prisma.insight.create({
      data: {
        title: '每周洞察 - 2024年第3周',
        content: `本周工作回顾：

**任务完成统计：**
- 总任务数：8个
- 已完成：5个
- 进行中：2个
- 待开始：1个

**效率趋势：**
- 周一到周三效率较高，完成了大部分重要任务
- 周四和周五主要处理细节和优化工作

**下周建议：**
- 继续保持当前的工作节奏
- 重点关注项目文档的完成
- 安排时间进行技术学习`,
        type: 'WEEKLY',
        user_id: user.id,
        metadata: JSON.stringify({
          generated_at: new Date().toISOString(),
          week: 3,
          year: 2024,
          ai_provider: 'mock'
        })
      }
    })
  ]);
  
  console.log('💡 创建示例洞察:', insights.length, '个');
  
  // 创建示例反思
  const reflections = await Promise.all([
    prisma.reflection.create({
      data: {
        content: '今天完成了团队会议，感觉沟通很顺畅。项目进展比预期要好，团队协作效率很高。明天要继续推进文档编写工作。',
        mood: 'POSITIVE',
        user_id: user.id,
        metadata: JSON.stringify({
          reflection_type: 'daily',
          key_achievements: ['完成团队会议', '项目进展顺利']
        })
      }
    }),
    prisma.reflection.create({
      data: {
        content: '代码审查工作比预期耗时更长，发现了一些需要改进的地方。虽然进度有些延迟，但质量得到了保证。',
        mood: 'NEUTRAL',
        user_id: user.id,
        metadata: JSON.stringify({
          reflection_type: 'task_focused',
          challenges: ['代码审查耗时较长']
        })
      }
    })
  ]);
  
  console.log('🤔 创建示例反思:', reflections.length, '个');
  
  // 创建示例反馈
  const feedback = await prisma.insightFeedback.create({
    data: {
      insight_id: insights[0].id,
      rating: 4,
      comment: '洞察很有帮助，特别是效率建议部分。',
      user_id: user.id
    }
  });
  
  console.log('⭐ 创建示例反馈:', feedback.id);
  
  console.log('✅ 数据库播种完成！');
  console.log('\n📊 创建的数据统计：');
  console.log(`- 用户: 1个 (${user.email})`);
  console.log(`- 任务: ${tasks.length}个`);
  console.log(`- 洞察: ${insights.length}个`);
  console.log(`- 反思: ${reflections.length}个`);
  console.log(`- 反馈: 1个`);
  console.log('\n🔑 登录信息：');
  console.log(`邮箱: ${user.email}`);
  console.log(`密码: password123`);
}

main()
  .catch((e) => {
    console.error('❌ 播种失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
