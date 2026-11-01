-- Synthetic-only rollback test. Never selects or modifies an existing owner.
BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE owner text := repeat('e',64);
 empty_state jsonb := '{"documents":[],"profile":null,"history":[]}';
 result jsonb;
BEGIN
 result := public.bursyar_document_read(owner);
 IF result != '{"revision":0,"state":null}'::jsonb THEN RAISE EXCEPTION 'Synthetic owner already exists; test aborted'; END IF;
 IF NOT public.bursyar_document_compare(owner,0,empty_state) THEN RAISE EXCEPTION 'First insert failed'; END IF;
 IF public.bursyar_document_compare(owner,0,empty_state) THEN RAISE EXCEPTION 'Duplicate first insert accepted'; END IF;
 IF public.bursyar_document_compare(owner,9,empty_state) THEN RAISE EXCEPTION 'Stale revision accepted'; END IF;
 IF NOT public.bursyar_document_compare(owner,1,empty_state) THEN RAISE EXCEPTION 'Expected revision failed'; END IF;
 result := public.bursyar_document_read(owner);
 IF result->>'revision' != '2' OR result->'state' != empty_state THEN RAISE EXCEPTION 'Persistence mismatch'; END IF;
 BEGIN
  PERFORM public.bursyar_document_compare(owner,2,'{}');
  RAISE EXCEPTION 'Malformed state accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END;
$$;
RESET ROLE;
DO $$
BEGIN
 IF has_schema_privilege('anon','bursyar_documents','USAGE') OR
    has_schema_privilege('authenticated','bursyar_documents','USAGE') OR
    has_table_privilege('anon','bursyar_documents.owner_state','SELECT') OR
    has_table_privilege('authenticated','bursyar_documents.owner_state','UPDATE') OR
    has_function_privilege('anon','public.bursyar_document_read(text)','EXECUTE') OR
    has_function_privilege('authenticated','public.bursyar_document_compare(text,bigint,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'Private storage client privilege exposed';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_proc WHERE oid IN ('public.bursyar_document_read(text)'::regprocedure,'public.bursyar_document_compare(text,bigint,jsonb)'::regprocedure) AND prosecdef) THEN RAISE EXCEPTION 'Definer privilege unexpectedly enabled'; END IF;
END;
$$;
ROLLBACK;
SELECT 'durable document storage synthetic checks passed; no data retained' AS result;
