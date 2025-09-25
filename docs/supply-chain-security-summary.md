# 供应链安全与运营值守增强总结

## 概述
本次增强为 Aura Flow 系统提供了完整的供应链安全防护和运营值守能力，包括 SBOM 生成、镜像签名、SLSA 证明、依赖管理、事故响应和紧急维护模式。

## 变更清单

### 新增文件（15个）

#### 供应链安全
- `.github/workflows/sbom.yml` - SBOM 生成工作流
- `.github/workflows/sign.yml` - 容器镜像签名工作流
- `.github/workflows/provenance.yml` - SLSA Provenance 生成工作流
- `.github/dependabot.yml` - 依赖自动更新配置
- `.pre-commit-config.yaml` - Pre-commit 钩子配置
- `.github/workflows/gitleaks.yml` - 密钥泄露检测工作流
- `commitlint.config.js` - 提交消息规范配置

#### 运营值守
- `docs/incident-runbook.md` - 事故响应手册
- `docs/postmortem-template.md` - 事故后分析模板
- `scripts/panic-mode.sh` - 紧急维护模式脚本

### 修改文件（3个）
- `README.md` - 添加 CI 通过标准和 Panic Mode 说明
- `package.json` - 添加 lint-staged 和 commitlint 配置
- `scripts/verify-deploy.sh` - 增强前端状态检查
- `scripts/alert-webhook.sh` - 增强告警功能
- `.github/workflows/deploy.yml` - 添加强制化阈值检查

## 运行命令

### 本地验证命令
```bash
# 1. 安装 pre-commit 钩子
pre-commit install

# 2. 运行 pre-commit 检查
pre-commit run --all-files

# 3. 验证提交消息格式
echo "feat: 添加新功能" | npx commitlint

# 4. 运行 Gitleaks 检查
gitleaks detect --source . --verbose

# 5. 生成 SBOM
syft packages . --output spdx-json --file sbom.json

# 6. 验证镜像签名
cosign verify --certificate-identity-regexp ".*" --certificate-oidc-issuer-regexp ".*" ghcr.io/your-org/aura-flow-backend:latest

# 7. 测试 Panic Mode
./scripts/panic-mode.sh --status
./scripts/panic-mode.sh --enable
./scripts/panic-mode.sh --disable

# 8. 测试告警功能
./scripts/alert-webhook.sh system-alert-enhanced "test" "low" "测试告警" "测试详情" "/test"

# 9. 运行发布验证
./scripts/verify-deploy.sh --api-url http://localhost:3001 --frontend-url http://localhost:5173
```

### CI/CD 验证
```bash
# 触发所有安全检查
git push origin main

# 手动触发 SBOM 生成
gh workflow run sbom.yml

# 手动触发镜像签名
gh workflow run sign.yml

# 手动触发 SLSA Provenance
gh workflow run provenance.yml

# 手动触发依赖更新
gh workflow run dependabot.yml

# 手动触发 Gitleaks 检查
gh workflow run gitleaks.yml
```

## 验证方法

### SBOM 下载/查看方法
```bash
# 从 GitHub Actions 下载 SBOM
gh run download <run-id> --dir ./sbom-files

# 查看 SBOM 内容
cat sbom-files/sbom-frontend.spdx.json | jq .

# 验证 SBOM 格式
syft convert sbom-files/sbom-frontend.spdx.json --output table
```

### Cosign 验证示例
```bash
# 安装 Cosign
curl -O -L "https://github.com/sigstore/cosign/releases/download/v2.2.0/cosign-linux-amd64"
chmod +x cosign-linux-amd64
sudo mv cosign-linux-amd64 /usr/local/bin/cosign

# 验证镜像签名
cosign verify \
  --certificate-identity-regexp ".*" \
  --certificate-oidc-issuer-regexp ".*" \
  ghcr.io/your-org/aura-flow-backend:latest

# 验证前端资源签名
cosign verify-blob \
  --certificate-identity-regexp ".*" \
  --certificate-oidc-issuer-regexp ".*" \
  --signature frontend-assets-v1.0.0.tar.gz.sig \
  --certificate frontend-assets-v1.0.0.tar.gz.sig \
  frontend-assets-v1.0.0.tar.gz
```

### SLSA Provenance 文件路径
- **Provenance 文件**: `provenance.json`
- **验证报告**: `verification-report.md`
- **下载位置**: GitHub Actions Artifacts
- **验证命令**: `slsa-verifier verify-image --source-uri github.com/your-org/aura-flow --provenance-file provenance.json ghcr.io/your-org/aura-flow-backend:latest`

### Panic Mode 启停验证命令
```bash
# 检查维护模式状态
./scripts/panic-mode.sh --status

# 启用维护模式
./scripts/panic-mode.sh --enable

# 验证维护模式生效
curl -I http://yourdomain.com
# 应该返回 503 状态码

# 禁用维护模式
./scripts/panic-mode.sh --disable

# 验证系统恢复
curl -I http://yourdomain.com
# 应该返回 200 状态码
```

## On-call 值守排班示例

### 月度排班表
| 周次 | 主值班 | 副值班 | 联系方式 | 职责范围 |
|------|--------|--------|----------|----------|
| 第1周 | 张三 | 李四 | 主: +86-138-0000-0001 | 系统监控、事故响应 |
| 第2周 | 李四 | 王五 | 主: +86-138-0000-0002 | 安全扫描、依赖更新 |
| 第3周 | 王五 | 赵六 | 主: +86-138-0000-0003 | 性能监控、容量规划 |
| 第4周 | 赵六 | 张三 | 主: +86-138-0000-0004 | 备份恢复、灾难恢复 |

### 值班职责
- **主值班**: 7x24 小时响应，处理 P0/P1 事故
- **副值班**: 协助主值班，处理 P2/P3 事故
- **交接时间**: 每周一上午 9:00
- **交接内容**: 事故状态、系统状态、待处理事项

## 回滚要点

### 如果 SBOM 生成失败
```bash
# 检查 Syft 版本
syft version

# 重新生成 SBOM
syft packages . --output spdx-json --file sbom.json

# 验证 SBOM 格式
syft convert sbom.json --output table
```

### 如果镜像签名失败
```bash
# 检查 Cosign 配置
cosign version

# 重新签名镜像
cosign sign --yes --oidc-issuer https://token.actions.githubusercontent.com --oidc-client-id sigstore ghcr.io/your-org/aura-flow-backend:latest

# 验证签名
cosign verify --certificate-identity-regexp ".*" --certificate-oidc-issuer-regexp ".*" ghcr.io/your-org/aura-flow-backend:latest
```

### 如果 SLSA Provenance 失败
```bash
# 检查 SLSA 工具
slsa-provenance --version

# 重新生成 Provenance
slsa-provenance generate --github-token $GITHUB_TOKEN --output-file provenance.json

# 验证 Provenance
jq . provenance.json
```

### 如果 Pre-commit 失败
```bash
# 重新安装钩子
pre-commit uninstall
pre-commit install

# 手动运行检查
pre-commit run --all-files

# 跳过检查（紧急情况）
git commit --no-verify -m "feat: 紧急修复"
```

### 如果 Panic Mode 失败
```bash
# 强制禁用维护模式
sudo rm -f /etc/nginx/sites-enabled/aura-flow-maintenance
sudo systemctl reload nginx

# 恢复原始配置
sudo systemctl restart nginx

# 检查服务状态
docker-compose ps
```

## 关键成果

### 供应链安全
1. **SBOM 生成**: 自动生成软件物料清单，支持前端、后端和 Docker 镜像
2. **镜像签名**: 使用 Cosign 进行 OIDC 无密钥签名
3. **SLSA 证明**: 生成 Level 3 的供应链证明
4. **依赖管理**: 自动更新依赖，高危 CVE 自动 PR
5. **密钥检测**: Gitleaks 检测硬编码密钥和凭证

### 运营值守
1. **事故响应**: 完整的事故响应手册和流程
2. **紧急维护**: Panic Mode 一键进入维护模式
3. **告警增强**: 支持严重程度和路由的告警通知
4. **阈值硬化**: 强制化的性能和质量阈值
5. **前端验证**: 增强的前端状态和监控页面检查

### 开发体验
1. **Pre-commit**: 本地代码质量检查
2. **Commit 规范**: 强制 Conventional Commits
3. **Lint-staged**: 仅对变更文件进行检查
4. **自动化**: 全面的 CI/CD 自动化流程

## 下一步建议

1. **生产部署**: 在 staging 环境充分测试后部署到生产
2. **团队培训**: 对团队进行新功能和流程的培训
3. **监控优化**: 根据实际使用情况调整监控指标
4. **流程完善**: 根据实际使用情况完善相关流程
5. **持续改进**: 建立持续改进机制

---

**文档版本**: v1.0  
**最后更新**: 2024-01-XX  
**负责人**: 供应链安全负责人 + 值班运营负责人
