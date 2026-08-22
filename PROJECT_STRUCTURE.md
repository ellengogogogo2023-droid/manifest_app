# 项目目录结构

---

## MVP 阶段目录结构

> 核心价值验证版本：无认证、无付费、无历史库。
> 技术栈：Expo + Node.js/Express 后端 + 阿里云 DashScope（Qwen 文本生成与 Qwen3-TTS）

```
meditation-app/
├── app/                          # Expo Router 路由目录
│   ├── index.tsx                 # 输入表单页（App 入口）
│   ├── player.tsx                # 音频播放页
│   └── _layout.tsx               # 根布局（Safe Area、状态栏配置）
│
├── src/
│   ├── components/
│   │   ├── common/               # 通用基础组件
│   │   │   ├── Button.tsx              # 支持 loading/disabled 状态
│   │   │   ├── LoadingOverlay.tsx      # 全屏生成进度遮罩
│   │   │   └── ErrorMessage.tsx        # 错误提示条
│   │   └── meditation/
│   │       ├── GoalInputForm.tsx       # 目标输入表单（4 个字段）
│   │       └── AudioPlayer.tsx         # 播放器控件（play/pause/进度条）
│   │
│   ├── hooks/
│   │   ├── useMeditationGenerate.ts    # 封装完整生成流程（文本 + 音频）
│   │   └── useAudioPlayer.ts           # 音频播放状态管理（expo-av）
│   │
│   ├── services/
│   │   └── meditation.service.ts       # 调用 Node.js 后端 API 的封装
│   │
│   ├── stores/
│   │   └── meditationStore.ts          # 当前冥想数据（跨页面传递）
│   │
│   ├── types/
│   │   ├── meditation.types.ts         # 冥想表单、冥想数据类型
│   │   └── api.types.ts                # Edge Function 请求/响应类型
│   │
│   ├── constants/
│   │   ├── config.ts                   # 读取后端 API 地址等配置
│   │   └── theme.ts                    # 配色、字体、间距
│   │
│   └── utils/
│       └── formatDuration.ts           # 格式化音频时长（mm:ss），T-16 播放页使用
│   │
│   └── utils/
│       └── formatDuration.ts           # 格式化音频时长（mm:ss）
│
├── backend/
│   ├── src/routes/generate-meditation.ts # 通过 DashScope 生成冥想文本
│   ├── src/routes/generate-audio.ts      # 通过 Qwen3-TTS 生成 WAV 音频
│   └── uploads/                          # MVP 本地音频文件
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── .env.local                    # 本地环境变量（不提交 Git）
├── .env.example                  # 环境变量模板（提交 Git）
├── app.json
├── tsconfig.json
├── package.json
└── README.md
```

### MVP 各模块职责

| 目录/文件 | 职责 |
|---|---|
| `app/index.tsx` | 表单输入页，提交后触发生成流程，显示进度遮罩 |
| `app/player.tsx` | 接收生成结果，播放音频 |
| `src/hooks/useMeditationGenerate.ts` | 串联文本生成 + 音频生成两步，暴露 isLoading / progress / error 状态 |
| `src/hooks/useAudioPlayer.ts` | 封装 expo-av，暴露 play / pause / seekTo / positionMs 等播放状态 |
| `src/services/meditation.service.ts` | 所有网络请求唯一出口，前端不直接调用 DashScope API |
| `src/stores/meditationStore.ts` | 跨页面共享当前冥想数据（audioUrl、scriptText 等） |
| `backend/src/routes/` | **后端逻辑核心**：DashScope API Key 只在后端环境变量中，前端无法访问 |

### MVP 数据库表

```sql
meditations  →  id, goal, scene, feeling, duration_minutes,
                script_text, audio_url, created_at
-- MVP 阶段无用户关联，匿名写入
```

---

## Phase 2 扩展目录结构

> 验证核心价值后，逐步添加用户体系、历史记录和付费功能。
> 新增技术：Supabase Auth · Supabase RLS · expo-in-app-purchases · ElevenLabs TTS（升级音质）

```
# 新增/修改的目录和文件（在 MVP 基础上叠加）

app/
├── (auth)/                       # 【新增】认证相关页面
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/                       # 【替换 flat 路由为 Tab 导航】
│   ├── _layout.tsx
│   ├── index.tsx                 # 首页（原 app/index.tsx 迁移）
│   ├── library.tsx               # 【新增】我的冥想库（历史记录）
│   └── profile.tsx               # 【新增】个人中心（账户、订阅）
├── meditation/
│   └── [id].tsx                  # 【新增】冥想详情页（从库中打开）
└── paywall.tsx                   # 【新增】付费墙

src/
├── components/
│   ├── meditation/
│   │   └── MeditationCard.tsx    # 【新增】冥想卡片（历史列表用）
│   └── paywall/
│       └── PremiumBadge.tsx      # 【新增】付费标识
├── hooks/
│   ├── useAuth.ts                # 【新增】认证状态
│   └── useSubscription.ts        # 【新增】订阅状态与内购逻辑
├── services/
│   └── iap.service.ts            # 【新增】内购服务封装
├── stores/
│   ├── authStore.ts              # 【新增】用户认证状态
│   └── subscriptionStore.ts      # 【新增】订阅/付费状态
├── types/
│   └── user.types.ts             # 【新增】用户、订阅相关类型
├── constants/
│   └── iap.ts                    # 【新增】内购产品 ID 常量
└── utils/
    └── validation.ts             # 【新增】表单校验工具（如 Phase 2 注册表单）

supabase/
├── functions/
│   └── verify-purchase/
│       └── index.ts              # 【新增】服务端验证内购凭证
└── migrations/
    └── 002_add_users_profiles.sql # 【新增】profiles 表，关联用户与付费状态
```

### Phase 2 新增数据库表

```sql
profiles     →  user_id (FK → auth.users), is_premium, created_at
-- meditations 表新增 user_id 字段，启用 RLS 限制用户只能访问自己的数据
```
