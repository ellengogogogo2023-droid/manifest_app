# 项目开发规范（RULES）

> 所有参与本项目的开发者（包括 AI 编码助手）必须遵守以下规范。

---

## 一、代码风格规范

### 命名规则

| 类型 | 规则 | 示例 |
|---|---|---|
| 组件 | PascalCase | `AudioPlayer`, `GoalInputForm` |
| 函数/变量 | camelCase | `handleSubmit`, `isLoading` |
| 常量（模块级） | SCREAMING_SNAKE_CASE | `MAX_FREE_MEDITATIONS` |
| 类型/接口 | PascalCase，接口不加 `I` 前缀 | `MeditationType`, `UserProfile` |
| 文件名（组件） | PascalCase + `.tsx` | `AudioPlayer.tsx` |
| 文件名（非组件） | camelCase + `.ts` | `meditation.service.ts`, `authStore.ts` |
| 目录名 | kebab-case 或 camelCase（保持一致） | `components/`, `hooks/` |

### 文件组织约定

- 每个文件只导出一个主要模块（一个组件、一个 hook、一个 service）
- 组件文件结构顺序：`imports → types → component → styles（如用 StyleSheet）→ export`
- 不超过 300 行的单文件原则；超出时拆分子组件或提取 hook
- `index.ts` 仅用于 barrel export，不包含业务逻辑

### 组件写法约定

```typescript
// ✅ 正确：函数组件 + 显式 Props 类型
type AudioPlayerProps = {
  audioUrl: string;
  durationSeconds: number;
  onComplete?: () => void;
};

export function AudioPlayer({ audioUrl, durationSeconds, onComplete }: AudioPlayerProps) {
  // ...
}

// ❌ 禁止：React.FC 泛型写法（不必要的复杂性）
const AudioPlayer: React.FC<AudioPlayerProps> = (props) => { ... }

// ❌ 禁止：默认导出组件（除非 Expo Router 要求页面文件使用默认导出）
export default function AudioPlayer() { ... }  // 仅页面文件允许
```

---

## 二、TypeScript 使用规范

### 严格模式

`tsconfig.json` 必须启用严格模式：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 类型定义规则

- **共享类型**放在 `src/types/` 目录，按领域拆分文件
- **组件私有类型**（仅当前文件用）定义在文件顶部，不放入 `src/types/`
- **禁止使用 `any`**；确实无法确定类型时用 `unknown` 并做类型守卫
- **禁止使用类型断言 `as`** 绕过类型检查；仅在有充分理由且加注释的情况下使用
- API 响应类型必须在 `src/types/api.types.ts` 中明确定义，不允许推断为 `any`

```typescript
// ✅ 正确：明确定义 API 响应类型
type GenerateMeditationResponse = {
  meditationId: string;
  scriptText: string;
  audioUrl: string;
};

// ❌ 禁止：隐式 any
const response = await fetch('/api/generate'); // response.json() 返回 any，必须断言或定义类型
```

---

## 三、安全禁止事项（必须严格遵守）

### MVP 阶段 — 🔴 绝对禁止

1. **禁止在前端代码中硬编码任何 API 密钥**
   - Azure OpenAI Key、Azure Speech Key 等只能存在于 Supabase Edge Functions 的 Secrets 中
   - 前端代码中不得出现任何密钥字符串

2. **禁止从前端直接调用 Azure OpenAI 或 TTS API**
   - 所有对 Azure API 的调用必须通过 Supabase Edge Functions 中转
   - 前端只能调用自己的 Supabase Edge Function 端点

3. **禁止将 `.env.local` 提交到 Git**
   - `.env.local` 必须在 `.gitignore` 中
   - 敏感变量通过 `.env.example`（只含键名，不含值）告知团队

### Phase 2 新增 — 🔴 绝对禁止

4. **禁止在前端绕过付费校验**
   - 付费状态（`is_premium`）的最终判断必须在服务端（Supabase RLS 或 Edge Function）完成
   - 前端的付费判断仅用于 UI 展示，不作为安全边界

5. **禁止在 Edge Functions 中信任前端传入的用户 ID**
   - 用户身份必须通过 Supabase Auth 的 JWT token 在服务端验证

### 🟡 强烈不推荐

- 不要使用 `console.log` 打印敏感数据（直接删除或用结构化日志）
- Phase 2：不要在组件中直接调用 `supabase.auth`，统一走 `useAuth` hook

---

## 四、API 调用规范

### 错误重试策略

- **Edge Function 调用 Azure API 时**：对网络错误和 5xx 服务端错误，最多自动重试 **2 次**，每次间隔 **1 秒**；对 4xx 客户端错误（参数错误、认证失败）**不重试**，直接返回明确错误信息
- **前端调用 Edge Function 时**：不做自动重试，由用户手动点击重试；错误信息需对用户友好（如 "Generation failed, please try again" 而非原始报错）

### 超时处理

- Edge Function 内调用 Azure OpenAI 时设置显式超时：**120 秒**（避免 Supabase Edge Function 默认超时截断）
- Edge Function 内调用 Azure TTS 时设置显式超时：**90 秒**
- 超时时返回明确错误码（建议 HTTP 504），前端展示 "Generation timed out, please try again"

### 状态管理边界

- **放 Zustand store 的数据**：跨页面共享的数据，如当前冥想的 `audioUrl`、`scriptText`、`meditationId`
- **放组件本地 `useState` 的数据**：单页面 UI 状态，如 `isLoading`、`error`、表单字段值、播放器 UI 状态
- **禁止**将 `isLoading`、`error` 等临时 UI 状态放入全局 store

---

## 四、Git Commit 规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[可选 body]
[可选 footer]
```

### 类型（type）

| type | 用途 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `chore` | 构建、依赖、配置变更（不影响业务代码） |
| `refactor` | 重构（不新增功能，不修复 bug） |
| `style` | 仅格式、空白等代码风格修改 |
| `test` | 测试相关 |
| `docs` | 文档修改 |

### 示例

```
feat(meditation): add goal input form with validation
fix(audio): resolve playback not resuming after background
chore(deps): upgrade expo-av to 14.1.0
feat(iap): implement premium unlock flow for iOS
```

### 规则

- subject 用英文、祈使句、首字母小写、不加句号
- 单次 commit 只做一件事，不要把多个功能堆在一个 commit
- 禁止 `git commit -m "fix"` 这类无意义 message

---

## 五、每次生成代码后的自查清单

完成任何一个代码文件后，必须逐项确认：

### 类型安全
- [ ] 没有 `any` 类型（除非有注释说明原因）
- [ ] 没有未处理的 `undefined` / `null`（用可选链或类型守卫处理）
- [ ] 所有函数参数和返回值有明确类型

### 状态处理
- [ ] 有 `isLoading` 状态，加载中有对应 UI（骨架屏或 spinner）
- [ ] 有 `error` 状态，错误时有对应提示 UI（不能静默失败）
- [ ] 异步操作有 try/catch，错误信息被捕获并展示

### 安全检查
- [ ] 没有硬编码的 API 密钥或敏感字符串
- [ ] 没有直接从前端调用 Azure OpenAI / Azure TTS API
- [ ] Phase 2：付费功能的访问控制在服务端有对应保护

### 代码质量
- [ ] 组件职责单一，没有把业务逻辑写在 JSX 里
- [ ] 没有魔法数字，常量已提取到 `src/constants/`
- [ ] 没有注释掉的死代码

### 用户体验
- [ ] 按钮在请求进行中有 `disabled` 状态，防止重复提交
- [ ] 长文本有截断或滚动处理，不会溢出布局
- [ ] Phase 2：关键操作（删除、购买）有二次确认
