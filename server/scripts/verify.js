/**
 * 数据库健康检查脚本
 * 验证数据库连接和基本读写操作
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 开始数据库健康检查...');
  
  try {
    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 2. 测试基本查询
    console.log('2. 测试基本查询...');
    const userCount = await prisma.user.count();
    console.log(`✅ 用户表查询成功，当前用户数: ${userCount}`);
    
    // 3. 测试写入操作
    console.log('3. 测试写入操作...');
    const testUser = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@example.com`,
        name: 'Test User',
        password_hash: 'test_hash'
      }
    });
    console.log(`✅ 写入操作成功，创建测试用户: ${testUser.id}`);
    
    // 4. 测试更新操作
    console.log('4. 测试更新操作...');
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { name: 'Updated Test User' }
    });
    console.log(`✅ 更新操作成功，用户名称: ${updatedUser.name}`);
    
    // 5. 测试删除操作
    console.log('5. 测试删除操作...');
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ 删除操作成功');
    
    // 6. 测试关联查询
    console.log('6. 测试关联查询...');
    const usersWithTasks = await prisma.user.findMany({
      include: {
        tasks: true,
        insights: true,
        reflections: true
      },
      take: 5
    });
    console.log(`✅ 关联查询成功，查询到 ${usersWithTasks.length} 个用户`);
    
    // 7. 测试事务操作
    console.log('7. 测试事务操作...');
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: `transaction_test_${Date.now()}@example.com`,
          name: 'Transaction Test User',
          password_hash: 'test_hash'
        }
      });
      
      await tx.task.create({
        data: {
          title: 'Test Task',
          description: 'Created in transaction',
          user_id: user.id
        }
      });
      
      // 回滚事务（删除测试数据）
      await tx.user.delete({
        where: { id: user.id }
      });
    });
    console.log('✅ 事务操作成功');
    
    // 8. 检查数据库性能
    console.log('8. 检查数据库性能...');
    const startTime = Date.now();
    await prisma.user.findMany({
      take: 100,
      orderBy: { created_at: 'desc' }
    });
    const queryTime = Date.now() - startTime;
    console.log(`✅ 性能测试完成，查询时间: ${queryTime}ms`);
    
    if (queryTime > 1000) {
      console.log('⚠️  警告: 查询时间超过1秒，可能需要优化');
    }
    
    console.log('\n🎉 数据库健康检查全部通过！');
    
  } catch (error) {
    console.error('❌ 数据库健康检查失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行健康检查
verifyDatabase().catch((error) => {
  console.error('健康检查脚本执行失败:', error);
  process.exit(1);
});
