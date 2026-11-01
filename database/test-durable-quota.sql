-- Synthetic reservations only; all changes rolled back.
BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE p text; caps jsonb; usage_before bigint;
BEGIN
 -- Fail without changing anything if a real budget has already been provisioned.
 IF EXISTS(SELECT 1 FROM bursyar_quota.budgets) THEN RAISE EXCEPTION 'Budget already provisioned; isolated test aborted'; END IF;
 caps:='{"userMinute":1,"userDay":1,"globalDay":2,"lifetimeUnits":25}';
 PERFORM public.bursyar_quota_initialize('meta',caps);
 PERFORM public.bursyar_quota_initialize('meta',caps);
 BEGIN
  PERFORM public.bursyar_quota_initialize('meta',jsonb_set(caps,'{lifetimeUnits}','100'));
  RAISE EXCEPTION 'Budget mutation accepted';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM!='Registered quota limits differ; administrative review required' THEN RAISE; END IF;
 END;
 IF NOT public.bursyar_quota_reserve('meta',repeat('a',64),10) THEN RAISE EXCEPTION 'First reservation failed'; END IF;
 IF public.bursyar_quota_reserve('meta',repeat('a',64),1) THEN RAISE EXCEPTION 'User cap bypassed'; END IF;
 IF NOT public.bursyar_quota_reserve('meta',repeat('b',64),10) THEN RAISE EXCEPTION 'Second user failed'; END IF;
 IF public.bursyar_quota_reserve('meta',repeat('c',64),1) THEN RAISE EXCEPTION 'Global cap bypassed'; END IF;
 SELECT lifetime_used INTO usage_before FROM bursyar_quota.budgets WHERE provider='meta';
 IF usage_before!=20 THEN RAISE EXCEPTION 'Denied reservation changed lifetime usage'; END IF;
 caps:='{"userMinute":10,"userDay":10,"globalDay":10,"lifetimeUnits":10}';
 PERFORM public.bursyar_quota_initialize('gemini',caps);
 IF NOT public.bursyar_quota_reserve('gemini',repeat('d',64),10) THEN RAISE EXCEPTION 'Exact lifetime boundary failed'; END IF;
 IF public.bursyar_quota_reserve('gemini',repeat('e',64),1) THEN RAISE EXCEPTION 'Lifetime cap bypassed'; END IF;
 IF EXISTS(SELECT 1 FROM bursyar_quota.buckets WHERE used<1) THEN RAISE EXCEPTION 'Invalid bucket accounting'; END IF;
END;
$$;
RESET ROLE;
DO $$
BEGIN
 IF has_schema_privilege('anon','bursyar_quota','USAGE') OR has_schema_privilege('authenticated','bursyar_quota','USAGE') OR has_function_privilege('anon','public.bursyar_quota_reserve(text,text,bigint)','EXECUTE') OR has_function_privilege('authenticated','public.bursyar_quota_initialize(text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Quota RPC exposed to clients'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc WHERE oid IN ('public.bursyar_quota_reserve(text,text,bigint)'::regprocedure,'public.bursyar_quota_initialize(text,jsonb)'::regprocedure) AND prosecdef) THEN RAISE EXCEPTION 'Unexpected definer privilege'; END IF;
END;
$$;
ROLLBACK;
SELECT 'durable quota checks passed; no usage retained' AS result;
