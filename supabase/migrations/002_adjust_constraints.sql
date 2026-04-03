-- ============================================================
-- 002: 调整约束以匹配前端实际值
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================================

-- 1. 放宽 scripts.target_duration CHECK 约束
ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_target_duration_check;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_target_duration_check
  CHECK (target_duration IN (10, 20, 30, 60, 90, 120));

-- 2. 更新 voices 种子数据以匹配前端实际使用的 ID
DELETE FROM public.voices;

INSERT INTO public.voices (id, name, gender, description, tags, sort_order) VALUES
  ('Aiden',      'Aiden',      'male',   '沉稳磁性、适合解说',       ARRAY['知识科普', '生活分享'], 1),
  ('Dylan',      'Dylan',      'male',   '年轻活力、节奏明快',       ARRAY['搞笑段子', '娱乐解说'], 2),
  ('Eric',       'Eric',       'male',   '专业严谨、权威感强',       ARRAY['商业分析', '财经解说'], 3),
  ('Ryan',       'Ryan',       'male',   '亲切自然、温暖有力',       ARRAY['日常分享', '生活Vlog'], 4),
  ('Serena',     'Serena',     'female', '温柔知性、语调舒缓',       ARRAY['读书分享', '好物推荐'], 5),
  ('Vivian',     'Vivian',     'female', '甜美活泼、感染力强',       ARRAY['种草带货', '时尚穿搭'], 6),
  ('Sohee',      'Sohee',      'female', '清新甜美、适合叙事',       ARRAY['故事分享', '情感语录'], 7),
  ('Ono_anna',   'Anna',       'female', '端庄大方、新闻播报感',     ARRAY['资讯播报', '时政评论'], 8),
  ('Uncle_fu',   'Uncle Fu',   'male',   '成熟稳重、幽默风趣',       ARRAY['脱口秀', '脱口秀解说'], 9)
ON CONFLICT (id) DO NOTHING;

-- 3. 放宽 lip_sync_tasks 约束
--    前端视频直接上传到 Replicate，不一定有 user_video_id / template_id
ALTER TABLE public.lip_sync_tasks DROP CONSTRAINT IF EXISTS chk_video_source;

-- audio_gen_id 允许为空（以防某些场景下没有 audio_gen 记录）
ALTER TABLE public.lip_sync_tasks ALTER COLUMN audio_gen_id DROP NOT NULL;
