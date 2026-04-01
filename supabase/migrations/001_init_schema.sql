-- ============================================================
-- AI口播神器 — 完整数据库初始化脚本
-- 执行方式: 在 Supabase SQL Editor 中运行此脚本
-- 特性: 幂等，可安全重复执行
-- ============================================================

-- ============================
-- 1. 用户资料表 (扩展 auth.users)
-- ============================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    VARCHAR(50) NOT NULL DEFAULT '',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS 策略
DROP POLICY IF EXISTS "用户只能查看自己的资料" ON public.profiles;
CREATE POLICY "用户只能查看自己的资料"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "用户只能更新自己的资料" ON public.profiles;
CREATE POLICY "用户只能更新自己的资料"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "用户只能插入自己的资料" ON public.profiles;
CREATE POLICY "用户只能插入自己的资料"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ============================
-- 2. 文案表 (scripts)
-- ============================
CREATE TABLE IF NOT EXISTS public.scripts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             VARCHAR(100) NOT NULL DEFAULT '未命名文案',
  input_text        TEXT NOT NULL,
  generated_text    TEXT NOT NULL,
  mode              VARCHAR(20) NOT NULL CHECK (mode IN ('optimize', 'expand', 'generate')),
  style             VARCHAR(20) NOT NULL DEFAULT 'humorous'
                    CHECK (style IN ('humorous', 'professional', 'inspirational', 'warm')),
  platform          VARCHAR(20) NOT NULL DEFAULT 'douyin'
                    CHECK (platform IN ('douyin', 'xiaohongshu', 'shipinhao', 'general')),
  target_duration   INTEGER NOT NULL DEFAULT 60 CHECK (target_duration IN (30, 60, 90, 120)),
  estimated_duration NUMERIC(6,1),
  status            VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'final', 'deleted')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON public.scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_user_status ON public.scripts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON public.scripts(created_at DESC);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_scripts_updated_at ON public.scripts;
CREATE TRIGGER set_scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS 策略
DROP POLICY IF EXISTS "用户只能查看自己的文案" ON public.scripts;
CREATE POLICY "用户只能查看自己的文案"
  ON public.scripts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能插入自己的文案" ON public.scripts;
CREATE POLICY "用户只能插入自己的文案"
  ON public.scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能更新自己的文案" ON public.scripts;
CREATE POLICY "用户只能更新自己的文案"
  ON public.scripts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能删除自己的文案" ON public.scripts;
CREATE POLICY "用户只能删除自己的文案"
  ON public.scripts FOR DELETE
  USING (auth.uid() = user_id);


-- ============================
-- 3. 预设音色表 (voices)
-- ============================
CREATE TABLE IF NOT EXISTS public.voices (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  gender      VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  description TEXT NOT NULL,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  sample_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- voices 是公共只读表，不需要 RLS（所有用户共享）
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可查看音色列表" ON public.voices;
CREATE POLICY "所有人可查看音色列表"
  ON public.voices FOR SELECT
  USING (true);


-- ============================
-- 4. 语音生成记录表 (audio_generations)
-- ============================
CREATE TABLE IF NOT EXISTS public.audio_generations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id     UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  voice_id      VARCHAR(50) NOT NULL REFERENCES public.voices(id),
  speed         NUMERIC(3,1) NOT NULL DEFAULT 1.0 CHECK (speed >= 0.5 AND speed <= 2.0),
  audio_url     TEXT,
  duration      NUMERIC(8,2),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

ALTER TABLE public.audio_generations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audio_gen_user_id ON public.audio_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_gen_script_id ON public.audio_generations(script_id);
CREATE INDEX IF NOT EXISTS idx_audio_gen_status ON public.audio_generations(status);

-- RLS 策略
DROP POLICY IF EXISTS "用户只能查看自己的语音记录" ON public.audio_generations;
CREATE POLICY "用户只能查看自己的语音记录"
  ON public.audio_generations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能插入自己的语音记录" ON public.audio_generations;
CREATE POLICY "用户只能插入自己的语音记录"
  ON public.audio_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能更新自己的语音记录" ON public.audio_generations;
CREATE POLICY "用户只能更新自己的语音记录"
  ON public.audio_generations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================
-- 5. 模板人物视频表 (video_templates)
-- ============================
CREATE TABLE IF NOT EXISTS public.video_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  cover_url   TEXT NOT NULL,
  video_url   TEXT NOT NULL,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可查看模板视频" ON public.video_templates;
CREATE POLICY "所有人可查看模板视频"
  ON public.video_templates FOR SELECT
  USING (true);


-- ============================
-- 6. 用户上传视频表 (user_videos)
-- ============================
CREATE TABLE IF NOT EXISTS public.user_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_name   VARCHAR(200) NOT NULL,
  video_url       TEXT NOT NULL,
  cover_url       TEXT,
  duration        NUMERIC(8,2),
  resolution      VARCHAR(20),
  fps             INTEGER,
  file_size       BIGINT,
  face_detected   BOOLEAN,
  face_quality    VARCHAR(10) CHECK (face_quality IN ('excellent', 'good', 'fair', 'poor')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_videos_user_id ON public.user_videos(user_id);

-- RLS 策略
DROP POLICY IF EXISTS "用户只能查看自己的视频" ON public.user_videos;
CREATE POLICY "用户只能查看自己的视频"
  ON public.user_videos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能插入自己的视频" ON public.user_videos;
CREATE POLICY "用户只能插入自己的视频"
  ON public.user_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能更新自己的视频" ON public.user_videos;
CREATE POLICY "用户只能更新自己的视频"
  ON public.user_videos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能删除自己的视频" ON public.user_videos;
CREATE POLICY "用户只能删除自己的视频"
  ON public.user_videos FOR DELETE
  USING (auth.uid() = user_id);


-- ============================
-- 7. 对口型合成任务表 (lip_sync_tasks)
-- ============================
CREATE TABLE IF NOT EXISTS public.lip_sync_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_gen_id      UUID NOT NULL REFERENCES public.audio_generations(id),
  video_source_type VARCHAR(10) NOT NULL CHECK (video_source_type IN ('upload', 'template')),
  user_video_id     UUID REFERENCES public.user_videos(id) ON DELETE SET NULL,
  template_id       UUID REFERENCES public.video_templates(id) ON DELETE SET NULL,
  result_video_url  TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,

  CONSTRAINT chk_video_source
    CHECK (
      (video_source_type = 'upload' AND user_video_id IS NOT NULL) OR
      (video_source_type = 'template' AND template_id IS NOT NULL)
    )
);

ALTER TABLE public.lip_sync_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lip_sync_user_id ON public.lip_sync_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_lip_sync_status ON public.lip_sync_tasks(status);
CREATE INDEX IF NOT EXISTS idx_lip_sync_audio_gen_id ON public.lip_sync_tasks(audio_gen_id);

-- RLS 策略
DROP POLICY IF EXISTS "用户只能查看自己的对口型任务" ON public.lip_sync_tasks;
CREATE POLICY "用户只能查看自己的对口型任务"
  ON public.lip_sync_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能插入自己的对口型任务" ON public.lip_sync_tasks;
CREATE POLICY "用户只能插入自己的对口型任务"
  ON public.lip_sync_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能更新自己的对口型任务" ON public.lip_sync_tasks;
CREATE POLICY "用户只能更新自己的对口型任务"
  ON public.lip_sync_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================
-- 8. 字幕样式表 (subtitle_styles)
-- ============================
CREATE TABLE IF NOT EXISTS public.subtitle_styles (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  preview_url TEXT,
  config      JSONB NOT NULL DEFAULT '{}',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.subtitle_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可查看字幕样式" ON public.subtitle_styles;
CREATE POLICY "所有人可查看字幕样式"
  ON public.subtitle_styles FOR SELECT
  USING (true);


-- ============================
-- 9. 字幕数据表 (subtitles)
-- ============================
CREATE TABLE IF NOT EXISTS public.subtitles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lip_sync_id     UUID NOT NULL REFERENCES public.lip_sync_tasks(id) ON DELETE CASCADE,
  style_id        VARCHAR(50) REFERENCES public.subtitle_styles(id),
  position        VARCHAR(10) NOT NULL DEFAULT 'bottom'
                  CHECK (position IN ('top', 'center', 'bottom')),
  font_size       VARCHAR(10) NOT NULL DEFAULT 'medium'
                  CHECK (font_size IN ('small', 'medium', 'large')),
  font_color      VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  background_type VARCHAR(20) NOT NULL DEFAULT 'none'
                  CHECK (background_type IN ('none', 'semi-transparent', 'blur')),
  subtitle_data   JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subtitles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_subtitles_lip_sync_id ON public.subtitles(lip_sync_id);

DROP TRIGGER IF EXISTS set_subtitles_updated_at ON public.subtitles;
CREATE TRIGGER set_subtitles_updated_at
  BEFORE UPDATE ON public.subtitles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS 策略
DROP POLICY IF EXISTS "用户只能查看自己的字幕" ON public.subtitles;
CREATE POLICY "用户只能查看自己的字幕"
  ON public.subtitles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lip_sync_tasks
      WHERE id = subtitles.lip_sync_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "用户只能插入自己的字幕" ON public.subtitles;
CREATE POLICY "用户只能插入自己的字幕"
  ON public.subtitles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lip_sync_tasks
      WHERE id = subtitles.lip_sync_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "用户只能更新自己的字幕" ON public.subtitles;
CREATE POLICY "用户只能更新自己的字幕"
  ON public.subtitles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lip_sync_tasks
      WHERE id = subtitles.lip_sync_id AND user_id = auth.uid()
    )
  );


-- ============================
-- 10. 合成总任务表 (composite_tasks)
-- ============================
CREATE TABLE IF NOT EXISTS public.composite_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           VARCHAR(100) NOT NULL DEFAULT '未命名任务',
  script_id       UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  audio_gen_id    UUID REFERENCES public.audio_generations(id) ON DELETE SET NULL,
  lip_sync_id     UUID REFERENCES public.lip_sync_tasks(id) ON DELETE SET NULL,
  subtitle_id     UUID REFERENCES public.subtitles(id) ON DELETE SET NULL,
  final_video_url TEXT,
  status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                  CHECK (status IN (
                    'pending', 'script_generating', 'audio_generating',
                    'lipsync_processing', 'subtitle_rendering',
                    'completed', 'failed'
                  )),
  current_step    VARCHAR(30) NOT NULL DEFAULT 'script'
                  CHECK (current_step IN ('script', 'audio', 'lipsync', 'subtitle', 'completed')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

ALTER TABLE public.composite_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_composite_tasks_user_id ON public.composite_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_composite_tasks_status ON public.composite_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_composite_tasks_created_at ON public.composite_tasks(created_at DESC);

-- RLS 策略
DROP POLICY IF EXISTS "用户只能查看自己的任务" ON public.composite_tasks;
CREATE POLICY "用户只能查看自己的任务"
  ON public.composite_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能插入自己的任务" ON public.composite_tasks;
CREATE POLICY "用户只能插入自己的任务"
  ON public.composite_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能更新自己的任务" ON public.composite_tasks;
CREATE POLICY "用户只能更新自己的任务"
  ON public.composite_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能删除自己的任务" ON public.composite_tasks;
CREATE POLICY "用户只能删除自己的任务"
  ON public.composite_tasks FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 11. 存储桶 (Storage Buckets)
-- ============================================================
-- 视频文件存储桶（用户上传的视频）
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-videos', 'user-videos', false)
ON CONFLICT (id) DO NOTHING;

-- 音频文件存储桶（TTS 生成的音频）
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', false)
ON CONFLICT (id) DO NOTHING;

-- 成片视频存储桶（最终输出视频）
INSERT INTO storage.buckets (id, name, public)
VALUES ('output-videos', 'output-videos', false)
ON CONFLICT (id) DO NOTHING;

-- 用户头像存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 策略
DROP POLICY IF EXISTS "用户只能管理自己的视频文件" ON storage.objects;
CREATE POLICY "用户只能管理自己的视频文件"
  ON storage.objects FOR ALL
  USING (
    bucket_id IN ('user-videos', 'audio-files', 'output-videos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "用户可以上传视频文件" ON storage.objects;
CREATE POLICY "用户可以上传视频文件"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('user-videos', 'audio-files', 'output-videos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 头像公开可读
DROP POLICY IF EXISTS "头像公开可读" ON storage.objects;
CREATE POLICY "头像公开可读"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "用户可以上传自己的头像" ON storage.objects;
CREATE POLICY "用户可以上传自己的头像"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- 12. 种子数据 (Seed Data)
-- ============================================================

-- 预设音色
INSERT INTO public.voices (id, name, gender, description, tags, sort_order) VALUES
  ('xiaocheng', '晓晨', 'male', '阳光活力、亲切自然', ARRAY['日常分享', '生活Vlog', '轻松'], 1),
  ('xiaoya',   '晓雅', 'female', '温柔知性、语调舒缓', ARRAY['知识科普', '读书分享', '教育'], 2),
  ('xiaoming', '晓明', 'male', '专业沉稳、权威感强', ARRAY['商业分析', '财经解说', '专业'], 3),
  ('xiaoting', '晓婷', 'female', '甜美活泼、节奏明快', ARRAY['好物推荐', '种草带货', '时尚'], 4),
  ('xiaoyu',   '晓宇', 'male', '幽默风趣、感染力强', ARRAY['搞笑段子', '娱乐解说', '趣味'], 5),
  ('xiaoxue',  '晓雪', 'female', '端庄大方、新闻播报感', ARRAY['资讯播报', '时政评论', '正式'], 6)
ON CONFLICT (id) DO NOTHING;

-- 预设字幕样式
INSERT INTO public.subtitle_styles (id, name, description, config, sort_order) VALUES
  ('classic',    '经典白字', '白色文字 + 黑色描边，简洁清晰',
   '{"color": "#FFFFFF", "strokeColor": "#000000", "strokeWidth": 2, "effect": "none"}', 1),
  ('neon',       '霓虹灯', '荧光色文字 + 发光效果',
   '{"color": "#00FF88", "glowColor": "#00FF88", "glowIntensity": 10, "effect": "glow"}', 2),
  ('typewriter', '打字机', '逐字出现 + 光标闪烁',
   '{"color": "#FFFFFF", "cursorColor": "#FF4444", "effect": "typewriter"}', 3),
  ('bubble',     '气泡框', '彩色背景气泡 + 圆角',
   '{"color": "#FFFFFF", "bgColor": "#FF6B9D", "borderRadius": 12, "padding": "8px 16px", "effect": "bubble"}', 4),
  ('news',       '新闻播报', '底部横条 + 滚动字幕',
   '{"color": "#FFFFFF", "bgColor": "#CC0000", "position": "bottom", "effect": "news"}', 5),
  ('karaoke',    '卡拉OK', '逐字变色高亮 + 跟读效果',
   '{"color": "#CCCCCC", "highlightColor": "#FFD700", "effect": "karaoke"}', 6)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 13. 常用数据库函数
-- ============================================================

-- 获取用户任务列表（含关联数据概要）
CREATE OR REPLACE FUNCTION public.get_user_tasks(p_user_id UUID, p_status VARCHAR DEFAULT NULL, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  status VARCHAR,
  current_step VARCHAR,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  final_video_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.id, ct.title, ct.status, ct.current_step,
    ct.error_message, ct.created_at, ct.completed_at, ct.final_video_url
  FROM public.composite_tasks ct
  WHERE ct.user_id = p_user_id
    AND (p_status IS NULL OR ct.status = p_status)
  ORDER BY ct.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 获取用户文案列表（支持搜索、分页）
CREATE OR REPLACE FUNCTION public.get_user_scripts(
  p_user_id UUID,
  p_search VARCHAR DEFAULT NULL,
  p_status VARCHAR DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  input_text TEXT,
  generated_text TEXT,
  mode VARCHAR,
  style VARCHAR,
  status VARCHAR,
  estimated_duration NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.title, s.input_text, s.generated_text,
    s.mode, s.style, s.status, s.estimated_duration,
    s.created_at, s.updated_at
  FROM public.scripts s
  WHERE s.user_id = p_user_id
    AND s.status != 'deleted'
    AND (p_search IS NULL
         OR s.title ILIKE '%' || p_search || '%'
         OR s.generated_text ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR s.status = p_status)
  ORDER BY s.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 软删除文案（设为 deleted 状态）
CREATE OR REPLACE FUNCTION public.soft_delete_script(p_script_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.scripts
  SET status = 'deleted'
  WHERE id = p_script_id
    AND user_id = auth.uid()
    AND status != 'deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取任务完整详情（含所有子阶段产物）
CREATE OR REPLACE FUNCTION public.get_task_detail(p_task_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'task', to_jsonb(ct.*),
    'script', (SELECT to_jsonb(s.*) FROM public.scripts s WHERE s.id = ct.script_id),
    'audio', (SELECT to_jsonb(ag.*) FROM public.audio_generations ag WHERE ag.id = ct.audio_gen_id),
    'lipsync', (SELECT to_jsonb(lst.*) FROM public.lip_sync_tasks lst WHERE lst.id = ct.lip_sync_id),
    'subtitle', (SELECT to_jsonb(sub.*) FROM public.subtitles sub WHERE sub.id = ct.subtitle_id)
  ) INTO result
  FROM public.composite_tasks ct
  WHERE ct.id = p_task_id AND ct.user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 清理过期软删除文案（超过30天的 deleted 状态文案）
-- 建议用 cron job 调用
CREATE OR REPLACE FUNCTION public.cleanup_deleted_scripts()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.scripts
  WHERE status = 'deleted'
    AND updated_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
