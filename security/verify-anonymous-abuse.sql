-- Run in a transaction. All test users/content/quota changes are rolled back.
BEGIN;
CREATE TEMP TABLE abuse_test_results(name text PRIMARY KEY) ON COMMIT DROP;
CREATE FUNCTION pg_temp.check_ok(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 IF ok IS NOT TRUE THEN RAISE EXCEPTION 'FAILED: %',label; END IF;
 INSERT INTO abuse_test_results VALUES(label);
END $$;
DO $$
DECLARE item uuid; test_user uuid := gen_random_uuid(); guest uuid := gen_random_uuid(); v_room_id uuid; v_mansion_id uuid; slug text := replace(gen_random_uuid()::text,'-',''); before_count bigint;
BEGIN
 PERFORM pg_temp.check_ok(NOT has_schema_privilege('anon','abuse_guard','usage'),'private quota schema denied');
 PERFORM pg_temp.check_ok(NOT has_function_privilege('authenticated','abuse_guard.spend(text,integer,integer)','execute'),'quota reset/spend API inaccessible');
 PERFORM pg_temp.check_ok(NOT has_function_privilege('anon','public.admin_review_sansa(uuid,boolean)','execute'),'anonymous moderation denied');
 PERFORM abuse_guard.spend('test:'||slug,60,2);
 PERFORM abuse_guard.spend('test:'||slug,60,2);
 BEGIN
  PERFORM abuse_guard.spend('test:'||slug,60,2);
  RAISE EXCEPTION 'FAILED: quota allowed third operation';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM NOT LIKE 'rate_limit:%' THEN RAISE; END IF;
 END;
 PERFORM pg_temp.check_ok((SELECT used=2 FROM abuse_guard.buckets WHERE bucket='test:'||slug),'quota stops at limit');
 UPDATE abuse_guard.buckets SET expires_at=clock_timestamp()-interval '1 second' WHERE bucket='test:'||slug;
 PERFORM abuse_guard.spend('test:'||slug,60,2);
 PERFORM pg_temp.check_ok((SELECT used=1 FROM abuse_guard.buckets WHERE bucket='test:'||slug),'quota resets after expiry');
 INSERT INTO public.sansa_items(kind,color,text,device) VALUES('lantern','blue','보안 회귀 테스트',repeat('a',20)) RETURNING id INTO item;
 PERFORM public.sansa_report(item,repeat('b',20));
 PERFORM public.sansa_report(item,repeat('c',20));
 PERFORM pg_temp.check_ok((SELECT NOT hidden FROM public.sansa_items WHERE id=item),'two guest reports do not hide content');
 PERFORM public.sansa_report(item,repeat('b',20));
 PERFORM pg_temp.check_ok((SELECT count(*)=2 FROM public.sansa_reports WHERE item_id=item),'duplicate report is idempotent');
 UPDATE abuse_guard.buckets SET used=10 WHERE bucket='report:'||item::text AND window_seconds=86400;
 BEGIN
  PERFORM public.sansa_report(item,repeat('d',20));
  RAISE EXCEPTION 'FAILED: changed device bypassed report cap';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'rate_limit:%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_ok((SELECT count(*)=2 AND bool_and(device<>repeat('d',20)) FROM public.sansa_reports WHERE item_id=item),'new device cannot bypass item report cap');
 PERFORM set_config('request.jwt.claims',json_build_object('sub',guest,'role','authenticated')::text,true);
 BEGIN
  PERFORM public.admin_review_sansa(item,true);
  RAISE EXCEPTION 'FAILED: non-admin moderated';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'forbidden:%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_ok((SELECT NOT hidden FROM public.sansa_items WHERE id=item),'non-admin moderation blocked');
 INSERT INTO auth.users(id) VALUES(test_user);
 INSERT INTO public.admins(user_id) VALUES(test_user);
 PERFORM set_config('request.jwt.claims',json_build_object('sub',test_user,'role','authenticated')::text,true);
 PERFORM public.admin_review_sansa(item,true);
 PERFORM pg_temp.check_ok((SELECT hidden AND reviewed_at IS NOT NULL FROM public.sansa_items WHERE id=item),'admin hide succeeds');
 PERFORM public.admin_review_sansa(item,false);
 PERFORM pg_temp.check_ok((SELECT NOT hidden AND reviewed_at IS NOT NULL FROM public.sansa_items WHERE id=item),'admin keep/restore succeeds');
 PERFORM pg_temp.check_ok(EXISTS(SELECT 1 FROM jsonb_array_elements(public.admin_sansa_reports()) x WHERE x->>'id'=item::text AND (x->>'pending')::boolean=false),'reviewed report no longer pending');
 INSERT INTO public.rooms(owner_id,display_name,slug,unlock_override) VALUES(test_user,'보안테스트',slug,now()+interval '1 day') RETURNING id INTO v_room_id;
 INSERT INTO public.mansions(owner_id,display_name,slug) VALUES(test_user,'보안테스트',slug) RETURNING id INTO v_mansion_id;
 PERFORM public.send_gift(slug,'red','cocoa','보안 회귀 테스트 메시지',ARRAY['a','b','c'],'테스트');
 PERFORM pg_temp.check_ok((SELECT count(*)=1 FROM public.gifts WHERE public.gifts.room_id=v_room_id),'normal gift write succeeds');
 UPDATE abuse_guard.buckets SET used=10 WHERE bucket='gift:'||v_room_id::text AND window_seconds=60;
 BEGIN
  PERFORM public.send_gift(slug,'red','cocoa','다른 이름으로 요청',ARRAY['a','b','c'],'새이름');
  RAISE EXCEPTION 'FAILED: gift cap bypass';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'rate_limit:%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_ok((SELECT count(*)=1 FROM public.gifts WHERE public.gifts.room_id=v_room_id),'changed sender cannot bypass gift room cap');
 PERFORM public.post_note(slug,'테스트','테스트 벽보',repeat('e',20));
 UPDATE abuse_guard.buckets SET used=10 WHERE bucket='note:'||v_mansion_id::text AND window_seconds=60;
 BEGIN
  PERFORM public.post_note(slug,'다른이름','새 기기 벽보',repeat('f',20));
  RAISE EXCEPTION 'FAILED: note cap bypass';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'rate_limit:%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_ok((SELECT count(*)=1 FROM public.notes WHERE public.notes.mansion_id=v_mansion_id),'changed device cannot bypass mansion note cap');
 PERFORM public.move_in(slug,'101','캠퍼','amber','cat','none','stand','테스트','all',repeat('g',20));
 UPDATE abuse_guard.buckets SET used=6 WHERE bucket='move:'||v_mansion_id::text AND window_seconds=60;
 BEGIN
  PERFORM public.move_in(slug,'102','다른캠퍼','amber','cat','none','stand','테스트','all',repeat('h',20));
  RAISE EXCEPTION 'FAILED: move cap bypass';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'rate_limit:%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_ok((SELECT count(*)=1 FROM public.residents WHERE public.residents.mansion_id=v_mansion_id),'changed device cannot bypass move-in cap');
 INSERT INTO abuse_guard.buckets(bucket,window_seconds,used,expires_at) VALUES('global:sansa_add',60,30,now()+interval '1 minute') ON CONFLICT(bucket,window_seconds) DO UPDATE SET used=30,expires_at=excluded.expires_at;
 BEGIN
  PERFORM public.sansa_add('lantern','blue','테스트',repeat('i',20));
  RAISE EXCEPTION 'FAILED: sansa cap bypass';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'rate_limit:%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_ok(true,'changed device cannot bypass global sansa cap');
 INSERT INTO abuse_guard.buckets(bucket,window_seconds,used,expires_at) VALUES('global:log_event',60,600,now()+interval '1 minute') ON CONFLICT(bucket,window_seconds) DO UPDATE SET used=600,expires_at=excluded.expires_at;
 BEGIN
  PERFORM public.log_event('act','sansa','lantern',repeat('j',20));
  RAISE EXCEPTION 'FAILED: analytics cap bypass';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'rate_limit:%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_ok(true,'analytics global cap enforced');
 INSERT INTO abuse_guard.buckets(bucket,window_seconds,used,expires_at) VALUES('global:sansa_bonnoe_add',60,60,now()+interval '1 minute') ON CONFLICT(bucket,window_seconds) DO UPDATE SET used=60,expires_at=excluded.expires_at;
 BEGIN
  PERFORM public.sansa_bonnoe_add();
  RAISE EXCEPTION 'FAILED: counter cap bypass';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'rate_limit:%' THEN RAISE; END IF; END;
 PERFORM pg_temp.check_ok(true,'public counter cap enforced');
END $$;
SELECT count(*) AS passed,json_agg(name ORDER BY name) AS tests FROM abuse_test_results;
ROLLBACK;
