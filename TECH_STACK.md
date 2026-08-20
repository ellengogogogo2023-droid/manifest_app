# 技术栈说明（TECH STACK）

> 本文档说明每个技术选型的选择理由、版本要求及兼容性注意事项。

---

## MVP 阶段技术栈

> 目标：快速验证核心价值，低成本起步。无认证、无付费、无历史库。

### 一、前端

#### React Native + Expo SDK
| 项目 | 值 |
|---|---|
| **版本** | Expo SDK 52（React Native 0.76） |
| **语言** | TypeScript 5.x（严格模式） |

**选择理由：**
- 一套代码同时覆盖 iOS 和 Android，适合独立开发者
- Expo SDK 52 引入新架构（New Architecture）默认启用，性能更好
- EAS Build / EAS Submit 简化了打包上架流程
- Expo Router v4 提供基于文件的路由，与 Next.js 体验一致，心智负担低

**注意事项：**
- MVP 无内购模块，可使用 Expo Go 调试
- TypeScript 必须开启严格模式（`"strict": true`）

---

#### Expo Router v4
| 项目 | 值 |
|---|---|
| **版本** | `expo-router` ^4.0 |
| **依赖** | `react-native-screens`, `react-native-safe-area-context` |

**选择理由：**
- 文件即路由，MVP 只有两个页面（`index.tsx` + `player.tsx`），结构极简
- 内置深链接支持，Phase 2 增加页面时无需重配置导航

---

#### Zustand（状态管理）
| 项目 | 值 |
|---|---|
| **版本** | `zustand` ^5.0 |

**选择理由：**
- MVP 只需一个轻量 store 存储当前冥想数据（跨页面传递 `audioUrl` 等）
- 相比 Redux Toolkit 减少 80% 样板代码
- Phase 2 可直接添加 `authStore`、`subscriptionStore`，无需改动现有代码

---

#### expo-av（音频播放）
| 项目 | 值 |
|---|---|
| **版本** | `expo-av` ^14.0 |

**选择理由：**
- Expo 官方维护，与 Expo 生命周期深度集成
- 支持流式 URL 播放，无需先下载完整音频文件
- play / pause / seek / 进度查询 API 完备，MVP 够用

**注意事项：**
- MVP 不需要后台播放，Phase 2 如需锁屏控件则配置 `Audio.setAudioModeAsync`
- iOS 后台播放需在 `app.json` 配置 `UIBackgroundModes: ["audio"]`
---

#### AsyncStorage（本机数据持久化）
| 项目 | 值 |
|---|---|
| **版本** | `@react-native-async-storage/async-storage` ^3.1.1 |
| **用途** | 保存每日打卡记录和后续本机设置 |

**选择理由：**
- 支持 iOS、Android 和 Web，适合种子用户阶段的本机保存需求
- 不需要账号、数据库或云端同步，符合本阶段数据丢失可接受的约束
- 通过日期键保存记录，便于日历视图按天读取和更新

**注意事项：**
- 数据只保存在当前设备，更换手机或清除 App 数据后可能丢失
- 不用于保存敏感信息，也不替代 Phase 2 的数据库和用户数据隔离

---

#### react-native-calendars（打卡日历）
| 项目 | 值 |
|---|---|
| **版本** | `react-native-calendars` 当前项目安装版本 |
| **用途** | 展示月份、切换月份、点击日期和标记已打卡日期 |

**选择理由：**
- 提供跨平台日历渲染和月份切换能力，避免手写月份天数、闰年和日期布局逻辑
- `markedDates` 可以直接将 P3-01 本机记录映射为已打卡日期标记
- 只负责日历展示和日期交互，不改变现有打卡数据写入格式

**注意事项：**
- 日历详情仍由应用读取本机打卡记录并自行渲染
- 不引入云端同步，也不承担用户数据存储职责

---

#### expo-slider（进度条与时长选择）
| 项目 | 值 |
|---|---|
| **版本** | `expo-slider` ^1.0（Expo SDK 52 官方新增） |

**选择理由：**
- T-06 表单中的 Duration 滑动选择器和 T-16 播放页的可拖拽进度条均依赖此库
- React Native 原生 `Slider` 组件已从核心包移除，`@react-native-community/slider` 与 Expo 构建系统兼容性较差
- `expo-slider` 是 SDK 52 官方引入的替代方案，与 EAS Build 无缝集成

**注意事项：**
- 需要 Development Build（不支持 Expo Go），MVP 初期可先用分段控件（`SegmentedControl`）替代 Duration 选择器，播放进度条用 `expo-slider`
---

### 二、后端

#### Supabase
| 项目 | 值 |
|---|---|
| **版本** | Supabase JS Client `^2.45.0` |
| **MVP 使用的服务** | PostgreSQL · Edge Functions · Storage |
| **MVP 暂不使用** | Auth（无登录）· RLS（匿名写入） |

**选择理由：**
- **Edge Functions**：Deno 运行时，可安全存储并调用 Azure API 密钥，无需独立部署后端服务器
- **Storage**：存储 TTS 生成的音频文件（`.mp3`），前端直接播放公开 URL
- **免费额度**：免费层足够 MVP 阶段使用（500MB DB、1GB Storage、2M Edge Function 调用/月）

**注意事项：**
- Edge Functions 基于 Deno，使用 `Deno.env.get()` 读取 Secrets（不是 `process.env`）
- 免费项目超过 1 周不活跃会被暂停，生产环境需升级 Pro（$25/月）
- MVP Storage bucket 设为公开读取；引入用户体系后改为签名 URL

---

#### Azure OpenAI
| 项目 | 值 |
|---|---|
| **推荐模型** | `gpt-4o-mini`（成本低，适合 MVP） |
| **备选模型** | `gpt-4o`（输出质量更高） |
| **调用方式** | REST API（在 Supabase Edge Function 中直接调用） |

**选择理由：**
- 如果已有 Azure 订阅，可统一在 Azure Portal 管理密钥
- `gpt-4o-mini` 在长文本生成上表现良好，每次冥想生成成本极低（≈$0.0001）

**注意事项：**
- 需要单独申请 Deployment，配置 `AZURE_OPENAI_ENDPOINT`、`AZURE_OPENAI_KEY`、`AZURE_OPENAI_DEPLOYMENT` 三个 Secrets
- 所有 Secrets 只存在 Supabase Edge Function 环境变量中
- 设置 `max_tokens` 上限（建议 2000）防止超长输出产生异常费用

---

#### Azure Cognitive Services Speech（TTS）
| 项目 | 值 |
|---|---|
| **固定音色** | `en-US-JennyNeural`（平静，适合冥想） |
| **音频格式** | MP3（`audio-16khz-128kbitrate-mono-mp3`） |
| **调用方式** | REST API（在 Supabase Edge Function 中调用） |

**选择理由：**
- 与 Azure OpenAI 在同一生态，密钥管理统一，无需额外注册第三方账号
- `JennyNeural` 音色语调自然温和，冥想场景适配性良好
- 免费额度：500,000 字符/月（远超测试需求）

**注意事项：**
- 需要 `AZURE_SPEECH_KEY` 和 `AZURE_SPEECH_REGION` 两个 Secrets
- 单次冥想音频生成约需 3-8 秒，前端需显示生成进度状态
- 生成的音频存入 Supabase Storage，不要每次播放都重新调用 TTS（节省费用）

---

### 三、开发工具

| 工具 | 版本 | 用途 |
|---|---|---|
| Node.js | ≥ 20 LTS | 前端开发运行时 |
| Supabase CLI | latest | 本地开发、数据库迁移、部署 Edge Functions |
| EAS CLI | latest | 构建和发布 App |
| Prettier | ^3.x | 代码格式化 |
| ESLint | ^9.x | 代码规范检查，配合 `@typescript-eslint` |

---

### 四、版本兼容性速查（MVP）

| 依赖 | 要求 |
|---|---|
| iOS | ≥ 16.0（Expo SDK 52 最低要求） |
| Android | API Level ≥ 24（Android 7.0） |
| Node.js（开发环境） | ≥ 20 LTS |
| Expo SDK | 52（不要混用不同 SDK 版本的包） |

---

### 五、成本估算（MVP 阶段）

| 服务 | 免费额度 | 超出费用 |
|---|---|---|
| Supabase | 免费层够用（≤500 活跃用户） | Pro $25/月 |
| Azure OpenAI gpt-4o-mini | 按量计费 | ≈$0.0001/次冥想生成 |
| Azure Speech TTS | 500K 字符/月免费 | $4/100万字符 |
| EAS Build | 30 次/月免费 | $99/月无限制 |

---

## Phase 2 扩展技术栈

> 在验证核心价值后逐步引入。每项均不影响 MVP 已有代码结构。

---

### Supabase Auth + Row Level Security
| 引入时机 | 加入用户体系时 |
|---|---|

**新增代码范围：**
- 新增 `(auth)/` 页面组（登录/注册）
- 新增 `useAuth` hook 和 `authStore`
- `meditations` 表新增 `user_id` 字段，开启 RLS
- 新增 `profiles` 表存储用户付费状态

**选择理由：**
- 内置邮件/OAuth 认证，免去自建 JWT 服务
- RLS 在数据库层面强制用户只能访问自己的数据，付费校验在 DB 层完成

---

### expo-in-app-purchases
| 引入时机 | 加入付费功能时 |
|---|---|
| **版本** | `expo-in-app-purchases` ^14.0 |

**选择理由（相比 react-native-iap）：**
- Expo 官方维护，与 Expo 构建系统兼容性更好
- 无需额外的原生配置步骤

**注意事项：**
- 内购只能在真机上测试，Expo Go 和模拟器均不支持
- 购买凭证（receipt）必须在 Supabase Edge Function 中服务端验证
- 建议产品设计：一次性买断（`non-consumable`）解锁高级功能，比订阅更易获用户信任

---

### ElevenLabs TTS（升级选项）
| 引入时机 | 需要提升音质时 |
|---|---|
| **推荐音色** | `Rachel`（平静）或 `Bella` |
| **音频格式** | `mp3_44100_128` |

**选择理由：**
- 音质是目前市场上最自然的 TTS 之一，冥想场景对声音质量极敏感
- 支持语速、情绪等精细控制（`stability`, `similarity_boost`）

**升级方式：** 只需替换 `generate-audio` Edge Function 的内部实现，**前端零改动**。

**TTS 方案对比：**

| 服务 | 音质 | 价格 | 阶段 |
|---|---|---|---|
| Azure Speech `JennyNeural` | ⭐⭐⭐⭐ | $4/100万字符 | MVP（默认） |
| OpenAI TTS `onyx` | ⭐⭐⭐⭐ | $15/100万字符 | MVP 备选 |
| ElevenLabs `Rachel` | ⭐⭐⭐⭐⭐ | $30/100万字符 | Phase 2 升级 |
