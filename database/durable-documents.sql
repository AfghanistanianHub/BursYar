-- Additive provisioning for the existing BursYar project only.
-- No changes to existing community tables, Auth settings or API schema exposure.
BEGIN;
CREATE SCHEMA bursyar_documents;
REVOKE ALL ON SCHEMA bursyar_documents FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA bursyar_documents TO service_role;
CREATE TABLE bursyar_documents.owner_state (
 owner_hash text PRIMARY KEY CHECK (owner_hash ~ '^[a-f0-9]{64}$'),
 revision bigint NOT NULL CHECK (revision BETWEEN 1 AND 9007199254740990),
 state jsonb NOT NULL CHECK (
  jsonb_typeof(state) = 'object' AND
  jsonb_typeof(state->'documents') = 'array' AND
  jsonb_array_length(state->'documents') <= 10 AND
  jsonb_typeof(state->'history') = 'array' AND
  jsonb_array_length(state->'history') <= 20 AND
  jsonb_typeof(state->'profile') IN ('string','null') AND
  state ?& ARRAY['documents','history','profile'] AND
  octet_length(state::text) <= 1048576
 )
);
ALTER TABLE bursyar_documents.owner_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bursyar_documents.owner_state FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON bursyar_documents.owner_state TO service_role;

CREATE FUNCTION public.bursyar_document_read(p_owner text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE result jsonb;
BEGIN
 IF p_owner IS NULL OR p_owner !~ '^[a-f0-9]{64}$' THEN
  RAISE EXCEPTION 'Invalid document storage request';
 END IF;
 SELECT jsonb_build_object('revision',s.revision,'state',s.state) INTO result
 FROM bursyar_documents.owner_state s WHERE s.owner_hash=p_owner;
 RETURN coalesce(result,jsonb_build_object('revision',0,'state',NULL));
END;
$$;
CREATE FUNCTION public.bursyar_document_compare(p_owner text,p_revision bigint,p_state jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE affected bigint;
BEGIN
 IF p_owner IS NULL OR p_owner !~ '^[a-f0-9]{64}$' OR p_revision IS NULL OR p_revision<0 OR p_revision>=9007199254740990 OR p_state IS NULL THEN
  RAISE EXCEPTION 'Invalid document storage request';
 END IF;
 IF p_revision=0 THEN
  INSERT INTO bursyar_documents.owner_state(owner_hash,revision,state)
   VALUES(p_owner,1,p_state) ON CONFLICT(owner_hash) DO NOTHING;
 ELSE
  UPDATE bursyar_documents.owner_state SET revision=revision+1,state=p_state
   WHERE owner_hash=p_owner AND revision=p_revision;
 END IF;
 GET DIAGNOSTICS affected = ROW_COUNT;
 RETURN affected=1;
END;
$$;
REVOKE ALL ON FUNCTION public.bursyar_document_read(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bursyar_document_compare(text,bigint,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bursyar_document_read(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.bursyar_document_compare(text,bigint,jsonb) TO service_role;
COMMIT;
