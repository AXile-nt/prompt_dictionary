const CATEGORY_RULES = [
  { category: "UI/前端设计", slug: "ui-frontend", keywords: ["UI", "界面", "React", "Tailwind", "CSS", "组件", "frontend", "响应式", "设计系统"] },
  { category: "Bug修复", slug: "bug-fix", keywords: ["bug", "error", "报错", "debug", "异常", "fix", "修复", "调试", "stack trace", "crash"] },
  { category: "代码优化", slug: "code-optimization", keywords: ["optimize", "优化", "性能", "refactor", "重构", "improve", "提升", "加速", "缓存"] },
  { category: "测试", slug: "testing", keywords: ["test", "测试", "单元测试", "pytest", "jest", "vitest", "integration test", "e2e", "TDD"] },
  { category: "文档", slug: "documentation", keywords: ["README", "文档", "注释", "说明", "documentation", "docs", "API文档"] },
  { category: "架构设计", slug: "architecture", keywords: ["architecture", "架构", "设计模式", "microservice", "微服务", "系统设计"] },
  { category: "DevOps/部署", slug: "devops", keywords: ["deploy", "部署", "CI/CD", "Docker", "Kubernetes", "运维", "pipeline"] },
  { category: "AI Agent/工作流", slug: "ai-agent", keywords: ["AI", "agent", "工作流", "prompt", "LLM", "GPT", "Claude", "自动化"] },
  { category: "代码开发", slug: "code-development", keywords: ["code", "代码", "开发", "function", "API", "编程", "implement", "实现"] },
  { category: "数据处理", slug: "data-processing", keywords: ["data", "数据", "处理", "ETL", "pipeline", "分析", "清洗"] },
  { category: "产品设计", slug: "product-design", keywords: ["product", "产品", "需求", "user story", "PRD", "用户体验"] },
  { category: "学习解释", slug: "learning", keywords: ["learn", "学习", "explain", "解释", "教程", "tutorial", "入门"] },
];

export function classifyByKeywords(content: string): { category: string; slug: string; tags: string[]; description: string } {
  const lower = content.toLowerCase();
  let bestMatch = { category: "其他", slug: "other", score: 0 };

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword.toLowerCase())) score++;
    }
    if (score > bestMatch.score) {
      bestMatch = { category: rule.category, slug: rule.slug, score };
    }
  }

  const tags: string[] = [];
  for (const rule of CATEGORY_RULES) {
    if (tags.length >= 5) break;
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword.toLowerCase()) && !tags.includes(keyword)) {
        tags.push(keyword);
        if (tags.length >= 5) break;
      }
    }
  }

  const description = content.substring(0, 100).replace(/\n/g, " ").trim();

  return { category: bestMatch.category, slug: bestMatch.slug, tags, description };
}
