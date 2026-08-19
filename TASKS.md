# MVP 任务拆解（TASKS）

> 当前目标：只验证核心链路，不做数据库、登录认证、存储与发布能力。
> 核心链路：用户填写表单 -> 生成冥想文本 -> 转为音频 -> 播放。

---

## 执行规则（Copilot 必读）

- 只实现 Phase 1 的任务。
- Phase 2 全部视为延期任务，在当前实现中忽略，不创建相关文件、不改动相关配置。
- 只有当我明确说“开始 Phase 2”时，才允许实现 Phase 2。

---

## Phase 1（当前 MVP 范围）

### P1-01 - 项目初始化（Expo + TypeScript）

- [x] 目标
  - 搭建 React Native + Expo 基础项目，能在 iOS/Android/Web 启动。
- 涉及文件
  - package.json、tsconfig.json、app.json、babel.config.js、app/_layout.tsx
- 验收标准
  - npx expo start 能启动
  - TypeScript 无阻塞报错

### P1-02 - 基础 UI 骨架（输入页 -> 播放页）

- [x] 目标
  - 建立两页导航：app/index.tsx（输入页）、app/player.tsx（播放页）
  - 输入页可跳转到播放页并传递必要参数
- 涉及文件
  - app/_layout.tsx、app/index.tsx、app/player.tsx
- 验收标准
  - 两个页面可渲染
  - 输入页测试按钮可跳转播放页
  - iOS/Android 无明显布局溢出

### P1-03 - 输入表单页面

- [x] 目标
  - 在输入页实现四项输入：Goal、Scene、Feeling、Duration（5/10/15）
  - Goal 和 Scene 必填
- 涉及文件
  - src/components/meditation/GoalInputForm.tsx
  - src/types/meditation.types.ts
  - app/index.tsx
- 验收标准
  - 四项可交互
  - 未填必填项时禁用提交或显示错误提示

### P1-03A - 引导页与视觉升级

- [x] 目标
  - 在表单页之前新增一个吸引力法则（Law of Attraction）说明页
  - 全局页面视觉改为莫兰蒂色系
  - 表单页新增语言选择（English / Chinese）
- 涉及文件
  - app/index.tsx
  - app/form.tsx
  - app/_layout.tsx
  - app/player.tsx
  - src/components/meditation/GoalInputForm.tsx
  - src/types/meditation.types.ts
- 验收标准
  - 首次进入 App 先看到说明页，点击后进入表单页
  - 页面配色为统一莫兰蒂风格
  - 提交表单时包含 language 字段

### P1-04 - 后端 API（生成冥想文本，Claude）

- [x] 目标
  - 提供一个可调用的 API（本地 Node 服务或 Serverless 均可）
  - 接收 goal/scene/feeling/durationMinutes
  - 调用 Claude API，基于既定 Prompt 返回结构化冥想文本
- 涉及文件（建议）
  - backend/src/routes/generate-meditation.ts
  - backend/src/prompts/meditationPrompt.ts
  - src/types/api.types.ts
- 验收标准
  - POST 请求可返回 meditationId 与 scriptText
  - scriptText 包含 Opening / Body / Closing 结构

### P1-04A - 文本预览/检查页（生成音频前）

- [x] 目标
  - 在“生成文本”完成后，不自动进入 TTS，先进入文本检查页
  - 展示完整冥想文本，并可视化高亮结构标记（如 `[SECTION:...]`、`[PAUSE:Xs]`）
  - 提供“重新生成”和“确认，生成音频”两个按钮
  - 允许在检查页临时调整输入并重新生成文本（无需返回表单页）
- 涉及文件（建议）
  - app/script-review.tsx
  - src/hooks/useMeditationGenerate.ts
  - src/stores/meditationStore.ts
  - app/form.tsx
- 验收标准
  - 生成文本后不会自动开始生成音频，而是停在文本检查页
  - 检查页能清楚看到完整文本和结构标记
  - 点击“确认，生成音频”后才继续原有 TTS + 播放流程
  - 点击“重新生成”可重新调用文本生成接口并更新展示内容

### P1-05 - 后端 API（TTS 转音频）

- [x] 目标
  - 提供一个可调用的 TTS API
  - 输入 scriptText，输出可播放的音频地址（先固定一种声音）
- 涉及文件（建议）
  - backend/src/routes/generate-audio.ts
  - src/types/api.types.ts
- 验收标准
  - POST 请求可返回 audioUrl
  - 前端可用该 audioUrl 播放

### P1-06 - 前端调用与播放逻辑

- [x] 目标
  - 提交表单后串联流程：生成文本 -> 文本检查 -> 生成音频
  - 展示生成进度（至少两段文案）
  - 成功后跳转播放页并可播放音频
  - 实现基础播放能力：play/pause/进度条
- 涉及文件
  - src/services/meditation.service.ts
  - src/hooks/useMeditationGenerate.ts
  - src/hooks/useAudioPlayer.ts
  - src/components/common/Button.tsx
  - src/components/common/LoadingOverlay.tsx
  - src/components/common/ErrorMessage.tsx
  - src/components/meditation/AudioPlayer.tsx
  - src/stores/meditationStore.ts
  - src/utils/formatDuration.ts
  - app/index.tsx、app/player.tsx
- 验收标准
  - 可以走通完整链路并听到音频
  - loading、错误提示、播放控制可用

---

## Phase 2（延期，不在当前 MVP 内）

### P2-A - Supabase 与数据库

- [ ] 初始化 Supabase 项目
- [ ] 建立 meditations 表与 migration
- [ ] RLS 策略（匿名读写策略后续收紧）
- [ ] 使用 Supabase Storage 保存音频
- [ ] 将后端 API 切换为 Supabase Edge Functions

### P2-B - 认证与账号体系

- [ ] 用户登录/注册
- [ ] 会话管理
- [ ] 按用户隔离历史数据

### P2-C - 数据持久化与历史记录

- [ ] 保存冥想历史
- [ ] 历史列表与详情页
- [ ] 错误重试与幂等策略

### P2-D - 发布与工程化增强

- [ ] 生产环境配置与密钥管理
- [ ] 监控、日志、告警
- [ ] 自动化测试与 CI/CD

---

## 任务总览

| 编号 | 任务 | 阶段 | 状态 |
|---|---|---|---|
| P1-01 | 项目初始化（Expo + TypeScript） | Phase 1 | ✅ |
| P1-02 | 基础 UI 骨架（输入页 -> 播放页） | Phase 1 | ⬜ |
| P1-03 | 输入表单页面 | Phase 1 | ⬜ |
| P1-03A | 引导页与视觉升级 | Phase 1 | ⬜ |
| P1-04 | 后端 API（Claude 生成冥想文本） | Phase 1 | ⬜ |
| P1-04A | 文本预览/检查页（生成音频前） | Phase 1 | ⬜ |
| P1-05 | 后端 API（TTS 转音频） | Phase 1 | ⬜ |
| P1-06 | 前端调用与播放逻辑 | Phase 1 | ⬜ |
| P2-A | Supabase 与数据库 | Phase 2 | ⏸ |
| P2-B | 认证与账号体系 | Phase 2 | ⏸ |
| P2-C | 数据持久化与历史记录 | Phase 2 | ⏸ |
| P2-D | 发布与工程化增强 | Phase 2 | ⏸ |
