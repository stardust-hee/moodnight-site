select json_build_object(
'null_item_rejected', not public.camp_items_ok('[[null,0,0,0]]','out'),
'valid_out_allowed', public.camp_items_ok('[["chair",0,0,0]]','out'),
'valid_in_allowed', public.camp_items_ok('[["sleepbag",0,0,0]]','in'),
'unknown_rejected', not public.camp_items_ok('[["hacked",0,0,0]]','out'),
'invalid_kind_rejected', not public.camp_items_ok('[]',null),
'oversized_coordinate_rejected', not public.camp_items_ok('[["chair",100,0,0]]','out'),
'anon_write_denied', not has_function_privilege('anon','public.camp_save(jsonb,jsonb,text,integer)','execute'),
'member_write_allowed', has_function_privilege('authenticated','public.camp_save(jsonb,jsonb,text,integer)','execute'),
'public_read_allowed', has_function_privilege('anon','public.camp_get(integer)','execute'),
'gift_direct_read_denied', not has_table_privilege('authenticated','public.gifts','select'),
'room_name_edit_allowed', has_column_privilege('authenticated','public.rooms','display_name','update'),
'unlock_edit_denied', not has_column_privilege('authenticated','public.rooms','unlock_override','update')
) tests;