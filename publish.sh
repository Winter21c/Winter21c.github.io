#!/usr/bin/env bash
# 一键发布：提交改动并推送到 GitHub，随后 Actions 会自动部署
# 用法：
#   ./publish.sh                    # 提交信息默认「更新内容」
#   ./publish.sh "新增一篇笔记"      # 自定义提交信息

set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-更新内容}"

if [ -z "$(git status --porcelain)" ]; then
  echo "ℹ️  没有需要提交的改动。"
  exit 0
fi

echo "📦 即将提交以下改动："
git status --short
echo

git add -A
git commit -q -m "$MSG"

echo "🚀 正在推送..."
# 网络不稳时自动重试
for i in $(seq 1 8); do
  if git push origin main 2>&1 | tail -3; then
    echo
    echo "✅ 推送成功！"
    echo "   GitHub Actions 会自动构建，约 1~2 分钟后生效："
    echo "   https://winter21c.github.io"
    echo "   进度查看：https://github.com/Winter21c/Winter21c.github.io/actions"
    exit 0
  fi
  echo "⚠️  第 $i 次推送失败，3 秒后重试..."
  sleep 3
done

echo "❌ 推送多次失败，请检查网络后手动执行：git push origin main" >&2
exit 1
