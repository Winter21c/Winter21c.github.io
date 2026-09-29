#!/usr/bin/env bash
# 新建一篇文章
# 用法：
#   ./new-post.sh "文章标题"
#   ./new-post.sh              # 不带参数会提示你输入标题
#
# 会在 posts/ 下生成一个带好 front-matter 的 .md 文件，并尝试用编辑器打开。

set -euo pipefail
cd "$(dirname "$0")"

TITLE="${1:-}"
if [ -z "$TITLE" ]; then
  read -rp "文章标题: " TITLE
fi

if [ -z "${TITLE// /}" ]; then
  echo "❌ 标题不能为空" >&2
  exit 1
fi

# 文件名会直接变成网址，所以去掉路径分隔符等在 URL 里不安全的字符
SLUG="$(printf '%s' "$TITLE" | tr -d '/\\:*?"<>|' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
FILE="posts/${SLUG}.md"

if [ -e "$FILE" ]; then
  echo "❌ 文件已存在：$FILE" >&2
  exit 1
fi

DATE="$(date '+%Y-%m-%d %H:%M:%S')"

cat > "$FILE" <<EOF
---
title: "$TITLE"
date: "$DATE"
description: ""
cover: ""
tags: []
---

在这里写正文，支持标准 Markdown。

## 小标题

- 列表项
- 列表项

\`\`\`bash
echo "代码块带语法高亮"
\`\`\`

数学公式也支持：行内 \$E = mc^2\$，块级：

\$\$
\int_0^1 x^2 \, dx = \frac{1}{3}
\$\$
EOF

echo "✅ 已创建：$FILE"
echo "   网址将是：https://winter21c.github.io/posts/${SLUG}/"
echo
echo "💡 description（摘要）和 cover（封面）留空也能用："
echo "   封面留空会自动用 siteConfig.defaultPostCover"

# 仅在交互式终端里自动打开编辑器（避免在脚本/CI 中卡住）
if [ -t 0 ] && [ -n "${EDITOR:-}" ] && command -v "${EDITOR}" >/dev/null 2>&1; then
  "${EDITOR}" "$FILE" || true
elif [ -t 0 ]; then
  echo
  echo "用你习惯的编辑器打开它："
  echo "  code \"$FILE\"     # VS Code"
  echo "  nano \"$FILE\"     # 终端里编辑"
else
  echo "（非交互环境，未自动打开编辑器）"
fi
