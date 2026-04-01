# AI口播神器 — MVP 产品需求文档 (PRD)

> **文档版本**: v1.0
> **最后更新**: 2026-04-01
> **文档状态**: 初稿

---

## 一、产品概述

### 1.1 产品定位

AI口播神器是一款面向短视频创作者的**智能体应用**，帮助用户从一段简单文案或描述出发，快速生成完整的短视频口播成片。产品核心理念是**降低短视频内容生产门槛**，让不具备专业拍摄和剪辑能力的用户也能批量产出高质量的口播类短视频内容。

### 1.2 目标用户

| 用户类型 | 特征 | 核心诉求 |
|---------|------|---------|
| 自媒体创业者 | 需要高频产出内容，但拍摄能力有限 | 快速批量生产口播视频，提升账号更新频率 |
| 知识博主 | 有专业知识但缺乏出镜表现力 | 用AI生成口播内容，避免反复拍摄 |
| MCN机构运营 | 需要管理多个账号，内容需求量大 | 一人多号批量生产，降低人工成本 |
| 个人IP打造者 | 希望建立个人品牌但缺乏经验 | 小白可用，一站式完成视频制作 |

### 1.3 核心价值主张

> **输入一段文字 → 一键生成完整口播短视频**
>
> 集文案生成、语音合成、对口型、字幕套用于一体，全流程线上完成，无需安装任何本地软件。

---

## 二、功能架构总览

```
┌─────────────────────────────────────────────────────┐
│                   AI口播神器 MVP                      │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│ 文案生成  │ 语音合成  │ 对口型   │ 动态字幕  │ 任务管理  │
│ 与优化   │  (TTS)   │  合成    │  自动生成 │ 与下载   │
├──────────┼──────────┼──────────┼──────────┼─────────┤
│· 文案输入 │· 音色选择 │· 素材上传 │· 字幕样式 │· 任务队列 │
│· AI扩写  │· 语速调节 │· 模板选择 │· 自动对齐 │· 状态追踪 │
│· 文案编辑 │· 预览试听 │· 唇形驱动 │· 样式套用 │· 成片下载 │
│· 历史管理 │· 重新生成 │· 预览确认 │· 位置调整 │· 历史记录 │
└──────────┴──────────┴──────────┴──────────┴─────────┘
```

---

## 三、用户注册与认证

### 3.1 功能描述

基于 Supabase Auth 实现用户注册、登录和身份管理，作为所有功能的前置依赖。

### 3.2 详细需求

#### 3.2.1 注册流程

- **注册方式**: 邮箱 + 密码注册
- **必填字段**:
  - 邮箱地址
  - 密码（最少8位，需包含字母和数字）
  - 昵称（用于个人主页展示）
- **流程**:
  1. 用户填写注册信息
  2. 系统发送邮箱验证链接
  3. 用户点击验证链接完成注册
  4. 自动登录并跳转到工作台

#### 3.2.2 登录流程

- **登录方式**: 邮箱 + 密码登录
- **功能**:
  - 记住登录状态（使用 Supabase JWT，有效期7天）
  - 忘记密码 → 通过邮箱重置
  - 登录失败时显示明确的错误提示

#### 3.2.3 个人信息管理

- 修改昵称
- 修改头像（支持上传图片，最大2MB，裁剪为正方形）
- 修改密码（需验证旧密码）
- 退出登录

### 3.3 数据模型

```sql
-- profiles 表（扩展 Supabase Auth 的 users 表）
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    VARCHAR(50) NOT NULL DEFAULT '',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 四、AI短视频文案生成与优化

### 4.1 功能描述

用户输入一段原始文案或简单描述，系统基于 AI 能力进行智能优化与扩写，生成一篇适合口播的短视频文案。生成的文案需符合短视频平台的传播特性，语言口语化、节奏明快、有吸引力。

### 4.2 详细需求

#### 4.2.1 文案输入

- **输入方式**:
  - 直接输入完整文案（用户自己写的）
  - 输入简单描述/关键词（AI据此扩写）
  - 输入一个话题或主题（AI从头生成）
- **输入限制**:
  - 最少10个字符
  - 最多5000个字符
- **输入辅助**:
  - 提供文案输入提示语（placeholder），引导用户输入
  - 提供几个示例模板供参考（如：产品种草、知识分享、情感故事等）

#### 4.2.2 AI文案生成

- **生成模式**（用户选择）:
  | 模式 | 说明 | 适用场景 |
  |-----|------|---------|
  | 智能优化 | 保持原意，优化语言表达，使其更适合口播 | 用户已有较完整的文案 |
  | 扩写丰富 | 在原文基础上扩展细节、增加论据和案例 | 文案偏短，需要充实内容 |
  | 从零生成 | 根据主题描述，从零开始创作完整口播文案 | 用户只有一个想法或话题 |

- **生成参数**（可选配置）:
  - **目标时长**: 30秒 / 60秒 / 90秒 / 120秒（默认60秒）
  - **文案风格**: 专业严谨 / 轻松幽默 / 激情励志 / 温馨故事（默认轻松幽默）
  - **目标平台**: 抖音 / 小红书 / 视频号 / 通用（默认抖音）
  - **语言**: 中文普通话（MVP阶段仅支持中文）

- **生成规则**:
  - 文案须口语化，适合朗读，避免书面语和长难句
  - 文案须有明确的开头吸引点（Hook），如提问、反常识、数据等
  - 文案须有自然的段落划分，方便后续分段生成语音
  - 根据目标时长控制字数（中文口语约4-5字/秒）
    - 30秒 ≈ 120-150字
    - 60秒 ≈ 240-300字
    - 90秒 ≈ 360-450字
    - 120秒 ≈ 480-600字

#### 4.2.3 文案编辑

- **编辑功能**:
  - 支持在 AI 生成结果基础上手动编辑修改
  - 富文本编辑器（基础版），支持加粗、换行
  - 实时字数统计和预估时长显示
  - 文案分段显示，每段对应后续语音合成的一个片段

- **操作**:
  - **重新生成**: 保留输入，重新调用 AI 生成（消耗积分）
  - **保存草稿**: 保存当前文案状态，可随时继续编辑
  - **确认文案**: 完成编辑，进入下一步（语音合成）

#### 4.2.4 文案历史管理

- 按时间倒序展示用户历史文案
- 支持搜索（按标题/内容关键词）
- 支持对历史文案进行以下操作:
  - 查看详情
  - 复制为新草稿（二次编辑）
  - 删除（软删除，30天后彻底清理）
  - 基于历史文案直接进入语音合成流程

### 4.3 页面交互流程

```
文案工作台页面
├── 左侧：文案输入区
│   ├── 输入模式选择（直接输入 / 描述扩写 / 话题生成）
│   ├── 文本输入框
│   ├── 生成参数配置（折叠面板）
│   │   ├── 目标时长选择
│   │   ├── 文案风格选择
│   │   └── 目标平台选择
│   └── 「AI生成」按钮
├── 右侧：文案编辑区（生成后显示）
│   ├── AI生成的文案（可编辑）
│   ├── 字数统计 & 预估时长
│   ├── 操作按钮栏
│   │   ├── 重新生成
│   │   ├── 保存草稿
│   │   └── 确认文案 → 进入语音合成
│   └── 文案分段预览
└── 底部：历史文案列表（可折叠）
```

### 4.4 数据模型

```sql
-- scripts 表：文案
CREATE TABLE scripts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         VARCHAR(100) NOT NULL DEFAULT '未命名文案',
  input_text    TEXT NOT NULL,              -- 用户原始输入
  generated_text TEXT NOT NULL,             -- AI生成/优化后的文案
  mode          VARCHAR(20) NOT NULL,       -- 生成模式: optimize/expand/generate
  style         VARCHAR(20) NOT NULL DEFAULT 'humorous', -- 文案风格
  platform      VARCHAR(20) NOT NULL DEFAULT 'douyin',   -- 目标平台
  target_duration INTEGER NOT NULL DEFAULT 60,           -- 目标时长(秒)
  estimated_duration NUMERIC(6,1),          -- AI预估实际朗读时长(秒)
  status        VARCHAR(20) NOT NULL DEFAULT 'draft',    -- draft/final/deleted
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scripts_user_id ON scripts(user_id);
CREATE INDEX idx_scripts_status ON scripts(status);
```

### 4.5 API 设计

| 方法 | 路径 | 说明 |
|-----|------|------|
| `POST` | `/api/scripts/generate` | 调用 AI 生成/优化文案 |
| `GET` | `/api/scripts` | 获取用户文案列表（支持分页、搜索） |
| `GET` | `/api/scripts/:id` | 获取单条文案详情 |
| `PUT` | `/api/scripts/:id` | 更新文案内容 |
| `DELETE` | `/api/scripts/:id` | 软删除文案 |

**POST `/api/scripts/generate` 请求体**:
```json
{
  "input_text": "分享一下每天早起的好处",
  "mode": "expand",
  "style": "humorous",
  "platform": "douyin",
  "target_duration": 60
}
```

**POST `/api/scripts/generate` 响应体**:
```json
{
  "id": "uuid",
  "title": "每天早起到底有什么好处？",
  "input_text": "分享一下每天早起的好处",
  "generated_text": "你知道那些成功人士都有一个共同习惯吗？没错，就是早起！\n\n每天早上5点半起床的人，比睡到8点的人，一天多出整整两个半小时...",
  "estimated_duration": 58.5,
  "status": "draft"
}
```

---

## 五、多音色文本转语音 (TTS)

### 5.1 功能描述

用户从已确认的文案出发，选择合适的音色和语速，一键将文案转化为口播语音。系统支持多种预设音色，满足不同内容风格的需求，并提供试听功能方便用户决策。

### 5.2 详细需求

#### 5.2.1 音色选择

- **预设音色库**（MVP阶段提供以下音色）:

  | 音色名称 | 性别 | 风格特征 | 适用场景 |
  |---------|------|---------|---------|
  | 晓晨 | 男 | 阳光活力、亲切自然 | 日常分享、生活Vlog |
  | 晓雅 | 女 | 温柔知性、语调舒缓 | 知识科普、读书分享 |
  | 晓明 | 男 | 专业沉稳、权威感强 | 商业分析、财经解说 |
  | 晓婷 | 女 | 甜美活泼、节奏明快 | 好物推荐、种草带货 |
  | 晓宇 | 男 | 幽默风趣、感染力强 | 搞笑段子、娱乐解说 |
  | 晓雪 | 女 | 端庄大方、新闻播报感 | 资讯播报、时政评论 |

- **音色展示**:
  - 每个音色显示：名称、性别、风格标签、适用场景标签
  - 每个音色提供一段固定示例音频试听（约5秒）
  - 支持用当前文案内容进行试听（取前50字生成试听片段）

#### 5.2.2 语速调节

- **语速选项**:
  - 0.8x 慢速（适合教学、科普类）
  - 1.0x 正常（默认）
  - 1.2x 稍快（适合资讯、快节奏内容）
  - 1.5x 快速（适合短平快的口播风格）
- **自定义语速**: 提供滑块，支持 0.5x ~ 2.0x 范围微调

#### 5.2.3 语音生成

- **生成流程**:
  1. 用户选择音色和语速
  2. 点击「生成语音」按钮
  3. 系统将文案文本发送至 TTS 服务
  4. 生成过程中显示进度提示
  5. 生成完成后自动播放预览

- **生成规则**:
  - 文案按自然段落分段生成语音片段
  - 最终合并为完整音频文件（MP3格式）
  - 返回完整音频的 URL 和时长信息

- **操作**:
  - **重新生成**: 更换音色/语速后重新生成
  - **确认语音**: 满意后进入下一步（对口型合成）
  - **返回修改**: 返回文案编辑步骤

#### 5.2.4 语音预览与下载

- 在线播放生成的语音（带进度条控制）
- 显示实际音频时长
- 支持单独下载语音文件（MP3）

### 5.3 数据模型

```sql
-- voices 表：预设音色
CREATE TABLE voices (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,         -- 音色名称
  gender      VARCHAR(10) NOT NULL,         -- male/female
  description TEXT NOT NULL,                -- 风格描述
  tags        TEXT[] NOT NULL DEFAULT '{}',  -- 适用场景标签
  sample_url  TEXT,                         -- 示例音频URL
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- audio_generations 表：语音生成记录
CREATE TABLE audio_generations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id     UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  voice_id      VARCHAR(50) NOT NULL REFERENCES voices(id),
  speed         NUMERIC(3,1) NOT NULL DEFAULT 1.0,  -- 语速倍率
  audio_url     TEXT,                              -- 生成的音频文件URL
  duration      NUMERIC(8,2),                      -- 实际音频时长(秒)
  status        VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/processing/completed/failed
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_audio_generations_user_id ON audio_generations(user_id);
CREATE INDEX idx_audio_generations_script_id ON audio_generations(script_id);
```

### 5.4 API 设计

| 方法 | 路径 | 说明 |
|-----|------|------|
| `GET` | `/api/voices` | 获取可用音色列表 |
| `GET` | `/api/voices/:id/sample` | 获取音色示例音频 |
| `POST` | `/api/voices/preview` | 用当前文案生成试听片段（前50字） |
| `POST` | `/api/audio/generate` | 提交语音生成任务 |
| `GET` | `/api/audio/:id` | 获取语音生成状态及结果 |
| `GET` | `/api/audio/:id/download` | 下载生成的语音文件 |

**POST `/api/audio/generate` 请求体**:
```json
{
  "script_id": "uuid",
  "voice_id": "xiaocheng",
  "speed": 1.0
}
```

---

## 六、真人视频上传与对口型合成

### 6.1 功能描述

用户上传自己的真人视频素材，或从系统提供的模板人物视频中选取，系统利用 AI 对口型技术，将生成的语音与视频中人物的嘴部动作进行精确同步，使人物看起来像是在自然地说出语音内容。

### 6.2 详细需求

#### 6.2.1 视频素材上传

- **上传要求**:
  - 支持格式: MP4, MOV, WebM
  - 文件大小限制: 最大500MB
  - 视频时长: 10秒 ~ 5分钟
  - 分辨率建议: 720p 或以上
  - 帧率要求: 24fps 或以上

- **上传方式**:
  - 拖拽上传
  - 点击选择文件上传
  - 上传至 Supabase Storage

- **上传后处理**:
  - 自动提取视频关键信息（时长、分辨率、帧率）
  - 生成视频封面缩略图
  - 视频预览播放

- **上传限制**:
  - 视频中需包含清晰可见的人脸正面画面
  - 人脸需占据画面合理比例（过大或过小都会影响效果）
  - 如果系统检测不到人脸，给出明确提示

#### 6.2.2 模板人物视频选择

- **模板视频库**（MVP阶段预设以下模板）:

  | 模板名称 | 人物特征 | 场景 | 适合内容类型 |
  |---------|---------|------|------------|
  | 职场精英 | 男，正装，办公室 | 白板背景、书架 | 商业、职场、知识分享 |
  | 生活达人 | 女，休闲装，居家 | 客厅、厨房 | 生活方式、好物推荐 |
  | 学霸老师 | 男，衬衫，教室 | 黑板背景 | 教育、考试、学习方法 |
  | 时尚博主 | 女，时尚装扮 | 城市街景 | 美妆、穿搭、潮流 |
  | 运动达人 | 男，运动装 | 健身房、户外 | 健身、运动、健康 |

- **模板展示**:
  - 每个模板显示封面图、人物特征描述、适合场景
  - 点击可预览模板视频（循环播放，无声音）
  - 选择后进入对口型流程

#### 6.2.3 对口型合成

- **合成流程**:
  1. 用户选择视频素材（上传或模板）
  2. 系统分析视频中的人脸区域和嘴部位置
  3. 将音频与视频进行时间对齐
  4. AI 驱动人物嘴部动作，使其与语音内容同步
  5. 输出对口型后的视频

- **合成参数**（MVP阶段默认值，高级设置后续迭代）:
  - 视频输出分辨率: 与原视频一致（最高1080p）
  - 输出格式: MP4 (H.264)
  - 帧率: 与原视频一致

- **质量保障**:
  - 自动检测人脸质量，给出效果预估评级（优/良/一般/差）
  - 如果评级为"差"，提示用户更换素材
  - 对口型过程中保持人物其他面部表情和身体动作不变

- **处理时间预估**:
  - 视频时长 30秒 → 预计处理 2-5 分钟
  - 视频时长 60秒 → 预计处理 5-10 分钟
  - 视频时长 120秒 → 预计处理 10-20 分钟

#### 6.2.4 结果预览

- 生成完成后提供在线预览播放
- 支持全屏预览
- 支持下载对口型后的视频

### 6.3 数据模型

```sql
-- video_templates 表：模板人物视频
CREATE TABLE video_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  cover_url   TEXT NOT NULL,              -- 封面图URL
  video_url   TEXT NOT NULL,              -- 模板视频URL
  tags        TEXT[] NOT NULL DEFAULT '{}',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- user_videos 表：用户上传的视频素材
CREATE TABLE user_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_name   VARCHAR(200) NOT NULL,  -- 原始文件名
  video_url       TEXT NOT NULL,          -- 视频文件URL (Supabase Storage)
  cover_url       TEXT,                   -- 封面缩略图URL
  duration        NUMERIC(8,2),           -- 视频时长(秒)
  resolution      VARCHAR(20),            -- 分辨率 如 "1920x1080"
  fps             INTEGER,                -- 帧率
  file_size       BIGINT,                 -- 文件大小(bytes)
  face_detected   BOOLEAN,                -- 是否检测到人脸
  face_quality    VARCHAR(10),            -- 人脸质量: excellent/good/fair/poor
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_videos_user_id ON user_videos(user_id);

-- lip_sync_tasks 表：对口型合成任务
CREATE TABLE lip_sync_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_gen_id    UUID NOT NULL REFERENCES audio_generations(id),
  video_source_type VARCHAR(10) NOT NULL, -- upload/template
  user_video_id   UUID REFERENCES user_videos(id),    -- 用户上传的视频ID
  template_id     UUID REFERENCES video_templates(id), -- 模板视频ID
  result_video_url TEXT,                          -- 合成结果视频URL
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending / processing / completed / failed
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_lip_sync_tasks_user_id ON lip_sync_tasks(user_id);
CREATE INDEX idx_lip_sync_tasks_status ON lip_sync_tasks(status);
```

### 6.4 API 设计

| 方法 | 路径 | 说明 |
|-----|------|------|
| `GET` | `/api/templates` | 获取模板视频列表 |
| `GET` | `/api/templates/:id` | 获取模板视频详情 |
| `POST` | `/api/videos/upload` | 上传用户视频（使用 Supabase Storage 预签名URL） |
| `GET` | `/api/videos` | 获取用户上传的视频列表 |
| `GET` | `/api/videos/:id` | 获取单个视频详情 |
| `DELETE` | `/api/videos/:id` | 删除用户视频 |
| `POST` | `/api/lipsync` | 创建对口型合成任务 |
| `GET` | `/api/lipsync/:id` | 获取对口型任务状态及结果 |
| `GET` | `/api/lipsync/:id/download` | 下载合成视频 |

**POST `/api/lipsync` 请求体**:
```json
{
  "audio_gen_id": "uuid",
  "video_source_type": "upload",
  "user_video_id": "uuid"
}
```

或使用模板:
```json
{
  "audio_gen_id": "uuid",
  "video_source_type": "template",
  "template_id": "uuid"
}
```

---

## 七、动态字幕自动生成与套用

### 7.1 功能描述

系统根据生成的语音音频自动进行语音识别（ASR），生成带时间戳的字幕文本，并支持用户选择多种动态字幕样式进行套用，最终将字幕渲染到对口型视频中。

### 7.2 详细需求

#### 7.2.1 字幕自动生成

- **生成方式**:
  - 基于已生成的语音音频进行 ASR 识别
  - 输出逐字/逐词级别的时间戳
  - 自动断句（基于标点、语义停顿）

- **字幕内容**:
  - 优先使用确认后的文案文本作为字幕内容
  - 时间戳由语音识别结果提供
  - 文本与时间戳自动对齐

#### 7.2.2 字幕样式库

- **预设样式**（MVP阶段提供以下样式）:

  | 样式名称 | 视觉效果 | 特点 |
  |---------|---------|------|
  | 经典白字 | 白色文字 + 黑色描边 | 简洁清晰，适用所有场景 |
  | 霓虹灯 | 荧光色文字 + 发光效果 | 时尚炫酷，适合娱乐内容 |
  | 打字机 | 逐字出现 + 光标闪烁 | 知识科普，引导阅读节奏 |
  | 气泡框 | 彩色背景气泡 + 圆角 | 轻松活泼，适合种草内容 |
  | 新闻播报 | 底部横条 + 滚动字幕 | 专业正式，适合资讯内容 |
  | 卡拉OK | 逐字变色高亮 + 跟读效果 | 互动感强，适合教学口播 |

- **样式通用配置项**:
  - **字幕位置**: 顶部 / 居中 / 底部（默认底部）
  - **字体大小**: 小 / 中 / 大（默认中）
  - **字体颜色**: 提供几个预设色板可选
  - **背景**: 无背景 / 半透明黑底 / 模糊背景（默认无）

#### 7.2.3 字幕预览与编辑

- **预览功能**:
  - 在视频预览中实时叠加字幕效果
  - 可拖动字幕位置
  - 可切换不同样式实时对比

- **编辑功能**:
  - 支持逐句编辑字幕文本
  - 支持微调字幕出现/消失时间
  - 支持删除/新增字幕行
  - 修改后自动保存

#### 7.2.4 字幕渲染合成

- **合成流程**:
  1. 用户确认字幕内容和样式
  2. 系统将字幕渲染到对口型视频中
  3. 输出带字幕的最终视频

- **输出规格**:
  - 格式: MP4 (H.264 + AAC)
  - 分辨率: 与原视频一致（最高1080p）
  - 字幕同时内嵌为 SRT 轨道（可选）

### 7.3 数据模型

```sql
-- subtitle_styles 表：字幕样式
CREATE TABLE subtitle_styles (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  preview_url TEXT,                 -- 样式预览图URL
  config      JSONB NOT NULL DEFAULT '{}', -- 样式配置参数
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- subtitles 表：字幕数据
CREATE TABLE subtitles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lip_sync_id     UUID NOT NULL REFERENCES lip_sync_tasks(id) ON DELETE CASCADE,
  style_id        VARCHAR(50) REFERENCES subtitle_styles(id),
  position        VARCHAR(10) NOT NULL DEFAULT 'bottom', -- top/center/bottom
  font_size       VARCHAR(10) NOT NULL DEFAULT 'medium', -- small/medium/large
  font_color      VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  background_type VARCHAR(20) NOT NULL DEFAULT 'none',   -- none/semi-transparent/blur
  subtitle_data   JSONB NOT NULL DEFAULT '[]',
  -- subtitle_data 格式:
  -- [{"text": "你好", "start": 0.0, "end": 0.5}, ...]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subtitles_lip_sync_id ON subtitles(lip_sync_id);
```

### 7.4 API 设计

| 方法 | 路径 | 说明 |
|-----|------|------|
| `GET` | `/api/subtitle-styles` | 获取字幕样式列表 |
| `POST` | `/api/subtitles/generate` | 基于音频自动生成字幕（ASR） |
| `GET` | `/api/subtitles/:id` | 获取字幕数据 |
| `PUT` | `/api/subtitles/:id` | 更新字幕内容和样式配置 |
| `POST` | `/api/subtitles/:id/render` | 提交字幕渲染合成任务 |
| `GET` | `/api/subtitles/:id/preview` | 获取字幕预览（叠加到视频帧上） |

**PUT `/api/subtitles/:id` 请求体（更新样式配置）**:
```json
{
  "style_id": "karaoke",
  "position": "bottom",
  "font_size": "large",
  "font_color": "#FFD700",
  "background_type": "none",
  "subtitle_data": [
    {"text": "你知道那些成功人士", "start": 0.0, "end": 1.2},
    {"text": "都有一个共同习惯吗？", "start": 1.2, "end": 2.5}
  ]
}
```

---

## 八、合成任务状态追踪与视频下载

### 8.1 功能描述

提供一个统一的任务管理界面，让用户追踪所有合成任务（语音生成、对口型、字幕渲染）的进度状态，并在任务完成后下载最终的视频成片。

### 8.2 详细需求

#### 8.2.1 任务列表

- **展示内容**:
  - 任务标题（取自文案标题）
  - 当前阶段（文案 → 语音 → 对口型 → 字幕 → 完成）
  - 任务状态（排队中 / 处理中 / 已完成 / 失败）
  - 创建时间
  - 缩略图预览

- **筛选与排序**:
  - 按状态筛选：全部 / 处理中 / 已完成 / 失败
  - 按时间排序：最新优先 / 最早优先

- **分页**:
  - 每页20条
  - 支持加载更多

#### 8.2.2 任务状态追踪

- **状态流转**:
  ```
  pending (排队中)
    ↓
  processing (处理中)
    ├── 文案生成中...
    ├── 语音合成中...
    ├── 对口型合成中...
    └── 字幕渲染中...
    ↓
  completed (已完成)
  或
  failed (失败)
  ```

- **状态展示**:
  - 使用进度条或步骤指示器显示当前阶段
  - 处理中显示预计剩余时间（粗略估算）
  - 实时轮询更新状态（每5秒一次）
  - 失败时显示错误原因和「重试」按钮

- **任务详情**:
  - 点击任务可查看详情
  - 展示每个子任务的执行状态
  - 展示各阶段产出的中间产物（文案、音频、对口型视频）

#### 8.2.3 视频下载

- **下载方式**:
  - 单个视频下载（点击下载按钮）
  - 视频预览播放后下载

- **下载规格**（MVP阶段仅提供一种）:
  - 格式: MP4
  - 分辨率: 1080p
  - 带内嵌字幕

- **下载限制**:
  - 下载链接有效期: 24小时
  - 需要登录状态才能下载

#### 8.2.4 我的成片

- 独立的「我的成片」页面
- 展示所有已完成的视频
- 支持以下操作:
  - 在线预览
  - 下载到本地
  - 删除
  - 复制为新任务（修改文案/音色/字幕后重新生成）

### 8.3 数据模型

```sql
-- composite_tasks 表：合成任务（总任务，串联所有子任务）
CREATE TABLE composite_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           VARCHAR(100) NOT NULL DEFAULT '未命名任务',
  script_id       UUID REFERENCES scripts(id),
  audio_gen_id    UUID REFERENCES audio_generations(id),
  lip_sync_id     UUID REFERENCES lip_sync_tasks(id),
  subtitle_id     UUID REFERENCES subtitles(id),
  final_video_url TEXT,                              -- 最终成片视频URL
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending / script_generating / audio_generating /
  -- lipsync_processing / subtitle_rendering / completed / failed
  current_step    VARCHAR(30) NOT NULL DEFAULT 'script', -- 当前步骤
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_composite_tasks_user_id ON composite_tasks(user_id);
CREATE INDEX idx_composite_tasks_status ON composite_tasks(status);
```

### 8.4 API 设计

| 方法 | 路径 | 说明 |
|-----|------|------|
| `GET` | `/api/tasks` | 获取任务列表（支持筛选、分页） |
| `GET` | `/api/tasks/:id` | 获取任务详情及各子任务状态 |
| `POST` | `/api/tasks/:id/retry` | 重试失败的任务 |
| `DELETE` | `/api/tasks/:id` | 删除任务 |
| `GET` | `/api/tasks/:id/download` | 下载最终成片 |

---

## 九、全局工作流

以下是一个完整的生产流程，展示了用户从开始到获得最终成片的全部步骤：

```
[1] 用户输入文案/描述
         │
         ▼
[2] AI 生成/优化口播文案 ──→ (编辑/调整) ──→ 确认文案
         │
         ▼
[3] 选择音色 + 语速
         │
         ▼
[4] TTS 语音合成 ──→ (试听) ──→ 确认语音
         │
         ▼
[5] 上传视频/选择模板
         │
         ▼
[6] AI 对口型合成 ──→ (预览) ──→ 确认视频
         │
         ▼
[7] 自动生成字幕 + 选择样式
         │
         ▼
[8] 字幕渲染合成 ──→ (预览) ──→ 确认成片
         │
         ▼
[9] 下载最终短视频
```

---

## 十、页面结构

### 10.1 页面清单

| 页面 | 路由 | 说明 | 是否需要登录 |
|-----|------|------|------------|
| 首页/Landing | `/` | 产品介绍、功能展示、CTA引导注册 | 否 |
| 注册页 | `/register` | 用户注册 | 否 |
| 登录页 | `/login` | 用户登录 | 否 |
| 工作台 | `/workspace` | 核心创作工作台，串联全部创作流程 | 是 |
| 文案管理 | `/scripts` | 历史文案列表与管理 | 是 |
| 模板库 | `/templates` | 模板人物视频浏览与选择 | 是 |
| 任务中心 | `/tasks` | 合成任务列表与状态追踪 | 是 |
| 我的成片 | `/my-videos` | 已完成的视频成片管理 | 是 |
| 个人设置 | `/settings` | 个人信息、账号管理 | 是 |

### 10.2 核心页面 — 工作台

工作台是产品的核心页面，采用**分步向导**（Step Wizard）模式，引导用户依次完成创作流程：

```
┌──────────────────────────────────────────────────────┐
│  顶部导航栏: Logo | 工作台 | 任务中心 | 我的成片 | 设置 │
├──────────────────────────────────────────────────────┤
│  步骤指示器:                                          │
│  ① 文案 ──→ ② 语音 ──→ ③ 视频 ──→ ④ 字幕 ──→ ⑤ 导出  │
├──────────────────────────────────────────────────────┤
│                                                      │
│   [当前步骤内容区]                                     │
│                                                      │
│                                                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  底部操作栏: [上一步]              [下一步/生成]        │
└──────────────────────────────────────────────────────┘
```

---

## 十一、技术架构

### 11.1 技术栈

| 层级 | 技术 | 说明 |
|-----|------|------|
| **前端框架** | Next.js (App Router) | React 全栈框架，SSR/SSG 支持 |
| **样式方案** | Tailwind CSS | 原子化CSS，快速构建UI |
| **UI组件库** | shadcn/ui | 基于 Radix UI 的高质量组件 |
| **后端API** | Next.js API Routes | 服务端 API 接口 |
| **数据库** | Supabase PostgreSQL | 主数据存储 |
| **认证系统** | Supabase Auth | 用户注册/登录/JWT |
| **文件存储** | Supabase Storage | 视频、音频、图片文件存储 |
| **AI文案生成** | LLM API | 文案生成与优化 |
| **语音合成** | 第三方 TTS API | 文本转语音 |
| **对口型** | 第三方 Lip-sync API | 视频对口型合成 |
| **语音识别** | 第三方 ASR API | 音频转字幕时间戳 |

### 11.2 系统架构图

```
┌─────────────────────────────────────────────────┐
│                   用户浏览器                       │
│              (Next.js Frontend)                   │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────┐
│              Next.js API Routes                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ 文案API   │ │ 语音API  │ │ 合成任务API       │ │
│  │ /scripts │ │ /audio   │ │ /tasks           │ │
│  └────┬─────┘ └────┬─────┘ └───────┬──────────┘ │
│       │             │               │             │
│  ┌────┴─────────────┴───────────────┴──────────┐ │
│  │           Supabase Client SDK               │ │
│  └────┬──────────┬──────────────┬──────────────┘ │
└───────┼──────────┼──────────────┼────────────────┘
        │          │              │
        ▼          ▼              ▼
┌──────────────┐ ┌──────────┐ ┌────────────────┐
│   Supabase   │ │ Supabase │ │   Supabase     │
│  PostgreSQL  │ │  Auth    │ │   Storage      │
│  (数据存储)   │ │ (认证)   │ │  (文件存储)     │
└──────────────┘ └──────────┘ └────────────────┘

        │                        │
        ▼                        ▼
┌──────────────┐      ┌──────────────────┐
│  LLM API     │      │  TTS API         │
│  (文案生成)   │      │  (语音合成)       │
└──────────────┘      └──────────────────┘

                        │
                        ▼
                ┌──────────────────┐
                │  Lip-sync API    │
                │  (对口型合成)     │
                └──────────────────┘
                        │
                        ▼
                ┌──────────────────┐
                │  ASR API         │
                │  (语音识别/字幕)  │
                └──────────────────┘
```

### 11.3 数据库关系图

```
auth.users
    │
    ├── 1:1 ── profiles
    │
    ├── 1:N ── scripts
    │              │
    │              └── 1:N ── audio_generations ── voices
    │                              │
    │                              └── 1:1 ── lip_sync_tasks
    │                                              │
    │                                              ├── N:1 ── user_videos
    │                                              └── N:1 ── video_templates
    │                                                      │
    │                                                      └── 1:N ── subtitles ── subtitle_styles
    │
    ├── 1:N ── user_videos
    │
    └── 1:N ── composite_tasks
```

---

## 十二、非功能性需求

### 12.1 性能要求

| 指标 | 要求 |
|-----|------|
| 页面首屏加载时间 | < 2秒 |
| API 响应时间（非异步任务） | < 500ms |
| 文案生成响应时间 | < 10秒 |
| 文件上传速度 | 支持断点续传，大文件分片上传 |

### 12.2 安全要求

- 所有 API 接口需通过 Supabase Auth 鉴权
- 用户只能访问自己的数据（行级安全策略 RLS）
- 文件上传限制文件类型和大小
- 敏感操作（删除、下载）需验证用户身份
- 使用 HTTPS 传输所有数据

### 12.3 兼容性要求

- 浏览器支持: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- 响应式设计，适配桌面端和平板端（MVP阶段不做移动端适配）

### 12.4 可用性要求

- 系统可用性目标: 99%
- 异步任务失败后提供明确错误信息和重试机制
- 上传中断后支持续传

---

## 十三、MVP 范围边界

### 13.1 MVP 包含的功能（In Scope）

- [x] 用户注册与登录（邮箱+密码）
- [x] AI文案生成与优化（3种模式）
- [x] 多音色TTS语音合成（6种预设音色）
- [x] 用户视频上传（人脸检测）
- [x] 模板人物视频选择（5个预设模板）
- [x] AI对口型合成
- [x] 动态字幕自动生成（6种预设样式）
- [x] 合成任务状态追踪
- [x] 最终成片预览与下载

### 13.2 MVP 不包含的功能（Out of Scope）

- [ ] 社交账号登录（微信、抖音等）
- [ ] 手机号注册/登录
- [ ] 移动端 App / 小程序
- [ ] 视频在线编辑器（裁剪、滤镜等）
- [ ] 自定义音色克隆
- [ ] 批量生产模式（一次生成多个视频）
- [ ] 多语言支持
- [ ] 付费/会员体系
- [ ] 视频数据统计分析
- [ ] 分享到社交平台
- [ ] AI 数字人定制
- [ ] 背景音乐自动匹配

---

## 十四、关键风险与应对

| 风险 | 影响 | 应对策略 |
|-----|------|---------|
| TTS语音质量不达预期 | 用户体验差，口播不自然 | MVP阶段选择成熟的TTS供应商，提供多种音色选择 |
| 对口型效果不自然 | 成片质量差，影响用户信任 | 严格素材质量检测，对质量差的素材给出明确提示 |
| 第三方API不稳定或涨价 | 服务不可用或成本过高 | 设计抽象层，便于切换供应商；设置合理的超时和重试机制 |
| 视频处理耗时长 | 用户等待焦虑 | 清晰展示进度和预估时间，支持后台处理完成后通知 |
| 存储成本高 | 运营成本压力大 | 设置合理的文件保留策略，过期自动清理 |

---

## 十五、后续迭代方向

1. **V1.1**: 增加批量生产模式，支持一次输入多个主题批量生成视频
2. **V1.2**: 增加视频在线编辑功能（裁剪、滤镜、转场）
3. **V1.3**: 增加自定义音色克隆（用户上传自己的声音样本）
4. **V2.0**: 增加AI数字人定制功能，用户可以创建自己的数字分身
5. **V2.1**: 增加数据统计分析面板（视频发布后的表现数据）
6. **V2.2**: 增加多平台一键分发功能
