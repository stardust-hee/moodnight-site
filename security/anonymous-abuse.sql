-- Anonymous abuse protection: only database owners/RPCs may spend quota.
CREATE SCHEMA IF NOT EXISTS abuse_guard;
REVOKE ALL ON SCHEMA abuse_guard FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS abuse_guard.buckets (
  bucket text NOT NULL,
  window_seconds integer NOT NULL CHECK (window_seconds > 0),
  used integer NOT NULL CHECK (used > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (bucket, window_seconds)
);
ALTER TABLE abuse_guard.buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON abuse_guard.buckets FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS abuse_buckets_expiry ON abuse_guard.buckets(expires_at);

CREATE OR REPLACE FUNCTION abuse_guard.spend(p_bucket text, p_seconds integer, p_limit integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE t timestamptz := clock_timestamp(); n integer;
BEGIN
  IF p_bucket IS NULL OR length(p_bucket) > 120 OR p_seconds < 1 OR p_limit < 1 THEN
    RAISE EXCEPTION 'bad: 잘못된 요청이에요';
  END IF;
  -- Bounded cleanup; no visitor identifier or IP address is stored here.
  IF p_bucket LIKE 'global:%' THEN
    DELETE FROM abuse_guard.buckets WHERE (bucket,window_seconds) IN (
      SELECT bucket,window_seconds FROM abuse_guard.buckets
      WHERE expires_at < t - interval '2 days'
      ORDER BY expires_at LIMIT 50 FOR UPDATE SKIP LOCKED
    );
  END IF;
  INSERT INTO abuse_guard.buckets AS b(bucket,window_seconds,used,expires_at)
    VALUES(p_bucket,p_seconds,1,t + make_interval(secs => p_seconds))
  ON CONFLICT (bucket,window_seconds) DO UPDATE
    SET used = CASE WHEN b.expires_at <= t THEN 1 ELSE b.used + 1 END,
        expires_at = CASE WHEN b.expires_at <= t THEN t + make_interval(secs => p_seconds) ELSE b.expires_at END
    WHERE b.expires_at <= t OR b.used < p_limit
  RETURNING used INTO n;
  IF n IS NULL THEN
    RAISE EXCEPTION 'rate_limit: 요청이 잠시 몰렸어요. 잠시 후 다시 시도해 주세요';
  END IF;
END $fn$;
REVOKE ALL ON FUNCTION abuse_guard.spend(text,integer,integer) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.sansa_items ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE OR REPLACE FUNCTION public.admin_sansa_reports()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: 관리자만 볼 수 있어요'; END IF;
  RETURN coalesce((
    SELECT jsonb_agg(to_jsonb(q) ORDER BY q.pending DESC, q.last_report DESC) FROM (
      SELECT i.id, i.kind, i.text, i.hidden, i.reviewed_at,
             count(r.id)::integer AS reports, max(r.created_at) AS last_report,
             (i.reviewed_at IS NULL OR max(r.created_at) > i.reviewed_at) AS pending
      FROM public.sansa_items i JOIN public.sansa_reports r ON r.item_id=i.id
      GROUP BY i.id
      ORDER BY (i.reviewed_at IS NULL OR max(r.created_at) > i.reviewed_at) DESC,
               max(r.created_at) DESC LIMIT 100
    ) q
  ),'[]'::jsonb);
END $fn$;
REVOKE ALL ON FUNCTION public.admin_sansa_reports() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_sansa_reports() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_sansa(p_id uuid, p_hidden boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: 관리자만 바꿀 수 있어요'; END IF;
  IF p_hidden IS NULL THEN RAISE EXCEPTION 'bad: 처리 방법을 골라 주세요'; END IF;
  UPDATE public.sansa_items SET hidden=p_hidden, reviewed_at=clock_timestamp() WHERE id=p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found: 글을 찾을 수 없어요'; END IF;
END $fn$;
REVOKE ALL ON FUNCTION public.admin_review_sansa(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_sansa(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_gift(p_slug text, p_wrap text, p_item text, p_message text, p_hints text[], p_sender_name text, p_decoys text[] DEFAULT '{}'::text[], p_real_gift text DEFAULT NULL::text, p_real_for_real boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rid uuid; gid uuid; sname text := btrim(p_sender_name); clean text[]; rg text := nullif(btrim(p_real_gift), '');
begin
  select id into rid from public.rooms where slug = p_slug for update;
  if rid is null then raise exception 'not_found: 선물방을 찾을 수 없어요'; end if;
  if now() >= public.room_unlock(rid) then raise exception 'closed: 선물 보내기가 마감됐어요'; end if;
  if (select count(*) from public.gifts where room_id = rid) >= 300 then
    raise exception 'full: 이 선물방은 선물이 가득 찼어요'; end if;
  perform abuse_guard.spend('global:send_gift', 60, 120);
  perform abuse_guard.spend('global:send_gift', 86400, 3000);
  perform abuse_guard.spend('gift:' || rid::text, 60, 10);
  perform abuse_guard.spend('gift:' || rid::text, 3600, 60);
  select coalesce(array_agg(d), '{}') into clean from (
    select distinct left(btrim(x), 10) d from unnest(coalesce(p_decoys, '{}')) x
    where btrim(x) <> '' and public.norm_name(x) <> public.norm_name(sname) limit 3) s;
  insert into public.gifts(room_id, wrap, item, message, hints, sender_name, decoys, real_gift, real_for_real)
  values (rid, p_wrap, p_item, btrim(p_message),
          array[btrim(p_hints[1]), btrim(p_hints[2]), btrim(p_hints[3])], sname, clean, rg,
          rg is not null and coalesce(p_real_for_real, false))
  returning id into gid;
  return gid;
end $function$;

CREATE OR REPLACE FUNCTION public.post_note(p_slug text, p_who text, p_text text, p_device text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.mansions; nid uuid; dv text := nullif(btrim(coalesce(p_device, '')), ''); tx text := left(btrim(coalesce(p_text, '')), 40);
begin
  select * into m from public.mansions where slug = p_slug for update;
  if not found then raise exception 'not_found: 맨션을 찾을 수 없어요'; end if;
  if tx = '' then raise exception 'text: 한마디를 적어 주세요'; end if;
  if dv is not null and exists (select 1 from public.mansion_bans b where b.mansion_id = m.id and b.device = dv) then
    raise exception 'banned: 집주인이 막아 둔 친구는 벽보를 붙일 수 없어요'; end if;
  if dv is not null and (select count(*) from public.notes n where n.mansion_id = m.id and n.device = dv) >= 5 then
    raise exception 'limit: 벽보는 한 사람당 5장까지 붙일 수 있어요'; end if;
  if (select count(*) from public.notes n where n.mansion_id = m.id) >= 300 then
    raise exception 'full: 벽보판이 꽉 찼어요'; end if;
  perform abuse_guard.spend('global:post_note', 60, 120);
  perform abuse_guard.spend('global:post_note', 86400, 3000);
  perform abuse_guard.spend('note:' || m.id::text, 60, 10);
  perform abuse_guard.spend('note:' || m.id::text, 3600, 60);
  insert into public.notes(mansion_id, who, text, device)
  values (m.id, coalesce(nullif(left(btrim(coalesce(p_who, '')), 8), ''), '익명'), tx, dv) returning id into nid;
  return nid;
end $function$;

CREATE OR REPLACE FUNCTION public.move_in(p_slug text, p_unit text, p_nick text, p_light text, p_sil text, p_item text, p_pose text, p_msg text, p_vis text, p_device text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.mansions; nk text := left(btrim(coalesce(p_nick, '')), 8); dv text := nullif(btrim(coalesce(p_device, '')), '');
begin
  select * into m from public.mansions where slug = p_slug for update;
  if not found then raise exception 'not_found: 맨션을 찾을 수 없어요'; end if;
  if nk = '' then raise exception 'nick: 닉네임을 적어 주세요'; end if;
  if public.norm_name(nk) = public.norm_name(m.display_name) then raise exception 'nick: 맨션 주인과 같은 닉네임은 쓸 수 없어요'; end if;
  if exists (select 1 from public.mansion_bans b where b.mansion_id = m.id and (b.nick_norm = public.norm_name(nk) or (dv is not null and b.device = dv))) then
    raise exception 'banned: 집주인이 퇴거시킨 친구는 다시 입주할 수 없어요'; end if;
  if dv is not null and exists (select 1 from public.residents r where r.mansion_id = m.id and r.device = dv) then
    raise exception 'dup: 이미 이 맨션에 입주했어요. 한 사람당 한 집이에요'; end if;
  if exists (select 1 from public.residents r where r.mansion_id = m.id and public.norm_name(r.nick) = public.norm_name(nk)) then
    raise exception 'nick: 이미 입주한 닉네임이에요. 다른 닉네임을 써 주세요'; end if;
  if exists (select 1 from public.residents r where r.mansion_id = m.id and r.unit = p_unit) then
    raise exception 'taken: 방금 다른 친구가 들어온 집이에요. 다른 호수를 골라 주세요'; end if;
  if (select count(*) from public.residents r where r.mansion_id = m.id) >= 12 then
    raise exception 'full: 맨션이 꽉 찼어요. 벽보에 한마디 남겨 주세요'; end if;
  perform abuse_guard.spend('global:move_in', 60, 120);
  perform abuse_guard.spend('global:move_in', 86400, 3000);
  perform abuse_guard.spend('move:' || m.id::text, 60, 6);
  perform abuse_guard.spend('move:' || m.id::text, 3600, 12);
  insert into public.residents(mansion_id, unit, nick, light, sil, item, pose, msg, vis, device)
  values (m.id, p_unit, nk, p_light, p_sil, p_item, p_pose, left(btrim(coalesce(p_msg, '')), 60), coalesce(p_vis, 'all'), dv);
  return p_unit;
end $function$;

CREATE OR REPLACE FUNCTION public.sansa_add(p_kind text, p_color text, p_text text, p_device text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare dv text := nullif(btrim(coalesce(p_device,'')), ''); tx text := btrim(coalesce(p_text,'')); nid uuid;
begin
  if p_kind = 'lantern' then
    if p_color not in ('red','yellow','green','blue','purple','white') then raise exception 'color: 색을 다시 골라 주세요'; end if;
    if char_length(tx) > 40 then raise exception 'text: 40자까지 쓸 수 있어요'; end if;
  elsif p_kind = 'tile' then
    if p_color not in ('blue','green','brown','slate') then raise exception 'color: 색을 다시 골라 주세요'; end if;
    if char_length(tx) > 20 then raise exception 'text: 20자까지 쓸 수 있어요'; end if;
  else raise exception 'kind'; end if;
  if tx = '' then raise exception 'text: 소원을 적어 주세요'; end if;
  if dv is not null and dv !~ '^[a-z0-9]{16,40}$' then dv := null; end if;
  perform pg_catalog.pg_advisory_xact_lock(20261110, 1);
  if dv is not null and (select count(*) from public.sansa_items i where i.device = dv and i.created_at > now() - interval '1 day') >= 10 then
    raise exception 'limit: 하루에 10개까지 올릴 수 있어요. 내일 또 와 주세요'; end if;
  if (select count(*) from public.sansa_items i where i.created_at > now() - interval '1 minute') >= 60 then
    raise exception 'busy: 지금 사람이 많아요. 잠시 뒤에 다시 해 주세요'; end if;
  perform abuse_guard.spend('global:sansa_add', 60, 30);
  perform abuse_guard.spend('global:sansa_add', 3600, 300);
  perform abuse_guard.spend('global:sansa_add', 86400, 1000);
  insert into public.sansa_items(kind, color, text, device) values (p_kind, p_color, tx, dv) returning id into nid;
  return nid;
end $function$;

CREATE OR REPLACE FUNCTION public.log_event(p_kind text, p_page text, p_detail text DEFAULT NULL::text, p_device text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare dv text := nullif(btrim(coalesce(p_device,'')), ''); dt text := nullif(btrim(coalesce(p_detail,'')), '');
begin
  if p_kind is null or p_page is null or p_kind not in ('visit','share','create','act') or p_page not in ('home','santa','santa_r','mansion','mansion_r','sansa','smash','tray','camp','blog','other') then return; end if;
  if dv is not null and dv !~ '^[a-z0-9]{16,40}$' then dv := null; end if;
  if dt is not null and dt !~ '^[a-z0-9_-]{1,20}$' then dt := null; end if;
  if dv is not null and exists (select 1 from public.admin_devices a where a.device = dv) then return; end if;
  if p_kind = 'visit' and dv is not null and exists (select 1 from public.page_events e where e.device = dv and e.page = p_page and e.kind = 'visit' and e.created_at > now() - interval '10 minutes') then return; end if;
  perform abuse_guard.spend('global:log_event', 60, 600);
  perform abuse_guard.spend('global:log_event', 86400, 20000);
  insert into public.page_events(kind, page, detail, device) values (p_kind, p_page, dt, dv);
end $function$;

CREATE OR REPLACE FUNCTION public.sansa_bonnoe_add()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d date := (now() at time zone 'Asia/Seoul')::date; c integer;
begin
  perform abuse_guard.spend('global:sansa_bonnoe_add', 60, 60);
  perform abuse_guard.spend('global:sansa_bonnoe_add', 86400, 3000);
  insert into public.sansa_bonnoe(day, count) values (d, 1)
  on conflict (day) do update set count = public.sansa_bonnoe.count + 1
  returning count into c;
  return c;
end $function$;

CREATE OR REPLACE FUNCTION public.sansa_report(p_id uuid,p_device text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE dv text := nullif(btrim(coalesce(p_device,'')),'');
BEGIN
  IF dv IS NULL OR dv !~ '^[a-z0-9]{16,40}$' THEN RAISE EXCEPTION 'device: 잠시 뒤 다시 해 주세요'; END IF;
  PERFORM 1 FROM public.sansa_items WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found: 글을 찾을 수 없어요'; END IF;
  IF EXISTS(SELECT 1 FROM public.sansa_reports WHERE item_id=p_id AND device=dv) THEN RETURN; END IF;
  IF (SELECT count(*) FROM public.sansa_reports WHERE device=dv AND created_at > now()-interval '1 day') >= 10 THEN
    RAISE EXCEPTION 'rate_limit: 오늘 신고할 수 있는 횟수를 다 사용했어요';
  END IF;
  PERFORM abuse_guard.spend('global:sansa_report',60,30);
  PERFORM abuse_guard.spend('global:sansa_report',86400,300);
  PERFORM abuse_guard.spend('report:'||p_id::text,86400,10);
  INSERT INTO public.sansa_reports(item_id,device) VALUES(p_id,dv) ON CONFLICT DO NOTHING;
  -- Unverified guest reports never change public visibility.
END $fn$;

