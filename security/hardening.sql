CREATE OR REPLACE FUNCTION public.camp_items_ok(p jsonb, p_kind text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare e jsonb; allowed text[];
begin
  if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) > 30 then return false; end if;
  if p_kind is null or p_kind not in ('out','in') then return false; end if;
  allowed := case p_kind when 'out' then array['chair','table','campfire','lantern','plant','tree','rug','bear']
                         else array['sleepbag','cushion','rug2','lamp','books','shelf','lowtable'] end;
  for e in select * from jsonb_array_elements(p) loop
    if jsonb_typeof(e) <> 'array' or jsonb_array_length(e) <> 4 then return false; end if;
    if ((e->>0) = any(allowed)) is not true then return false; end if;
    if jsonb_typeof(e->1) <> 'number' or jsonb_typeof(e->2) <> 'number' or jsonb_typeof(e->3) <> 'number' then return false; end if;
    if abs((e->>1)::numeric) > 4 or abs((e->>2)::numeric) > 4 or abs((e->>3)::numeric) > 7 then return false; end if;
  end loop;
  return true;
end $function$;

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
  insert into public.notes(mansion_id, who, text, device)
  values (m.id, coalesce(nullif(left(btrim(coalesce(p_who, '')), 8), ''), '익명'), tx, dv) returning id into nid;
  return nid;
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
  insert into public.sansa_items(kind, color, text, device) values (p_kind, p_color, tx, dv) returning id into nid;
  return nid;
end $function$;

CREATE OR REPLACE FUNCTION public.camp_note_add(p_camp integer, p_body text, p_photo text, p_paper text, p_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); b text := btrim(coalesce(p_body,'')); nm text;
begin
  if uid is null then raise exception 'login: 로그인하고 쪽지를 붙일 수 있어요'; end if;
  if char_length(b) < 1 or char_length(b) > 80 then raise exception 'body: 쪽지는 1~80자로 적어 주세요'; end if;
  if p_camp < 1 or p_camp > 9999 then raise exception 'bad: 없는 캠핑장이에요'; end if;
  perform pg_catalog.pg_advisory_xact_lock(20261110, 2);
  if (select count(*) from public.camp_notes where author = uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'limit: 쪽지는 하루에 5장까지 붙일 수 있어요'; end if;
  if (select count(*) from public.camp_notes where created_at > now() - interval '1 minute') >= 40 then
    raise exception 'busy: 잠시 뒤에 다시 붙여 주세요'; end if;
  nm := coalesce((select name from public.camp_tents where owner_id = uid), left(btrim(coalesce(p_name,'')), 10));
  if nm is null or nm = '' then nm := '캠퍼'; end if;
  insert into public.camp_notes(camp, author, name, body, photo, paper)
    values (p_camp, uid, nm, b, nullif(p_photo,''), coalesce(nullif(p_paper,''),'cream'));
  return public.camp_notes_list(p_camp);
end $function$;

REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON public.gifts, public.reports, public.camp_weather, public.camp_tents, public.camp_notes, public.camp_note_reports, public.camp_world FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.camp_leave(), public.camp_note_add(integer,text,text,text,text), public.camp_note_delete(uuid), public.camp_note_report(uuid), public.camp_pick(integer,integer,text,integer,text), public.camp_save(jsonb,jsonb,text,integer), public.camp_world_save(jsonb) FROM PUBLIC, anon;
ALTER FUNCTION public.delete_my_room() SET search_path = '';
ALTER FUNCTION public.delete_my_mansion() SET search_path = '';