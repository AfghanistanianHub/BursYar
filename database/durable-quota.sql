BEGIN;
CREATE SCHEMA bursyar_quota;
REVOKE ALL ON SCHEMA bursyar_quota FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA bursyar_quota TO service_role;
CREATE TABLE bursyar_quota.budgets(
 provider text PRIMARY KEY CHECK(provider IN ('meta','gemini','self_hosted')),
 limits jsonb NOT NULL,
 lifetime_used bigint NOT NULL DEFAULT 0 CHECK(lifetime_used BETWEEN 0 AND 9007199254740991)
);
CREATE TABLE bursyar_quota.buckets(
 provider text NOT NULL REFERENCES bursyar_quota.budgets(provider),
 bucket text NOT NULL,
 used bigint NOT NULL CHECK(used BETWEEN 0 AND 9007199254740991),
 expires_epoch bigint NOT NULL,
 PRIMARY KEY(provider,bucket)
);
ALTER TABLE bursyar_quota.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bursyar_quota.buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY server_only ON bursyar_quota.budgets TO service_role USING(true) WITH CHECK(true);
CREATE POLICY server_only ON bursyar_quota.buckets TO service_role USING(true) WITH CHECK(true);
REVOKE ALL ON ALL TABLES IN SCHEMA bursyar_quota FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON bursyar_quota.budgets TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON bursyar_quota.buckets TO service_role;
CREATE FUNCTION public.bursyar_quota_initialize(p_provider text,p_limits jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE k text; registered jsonb;
BEGIN
 IF p_provider IS NULL OR p_provider NOT IN ('meta','gemini','self_hosted') OR p_limits IS NULL OR jsonb_typeof(p_limits)!='object' THEN RAISE EXCEPTION 'Invalid quota configuration'; END IF;
 FOREACH k IN ARRAY ARRAY['userMinute','userDay','globalDay','lifetimeUnits'] LOOP
  IF NOT p_limits ? k OR jsonb_typeof(p_limits->k)!='number' OR (p_limits->>k)::numeric < 1 OR (p_limits->>k)::numeric > 9007199254740991 OR trunc((p_limits->>k)::numeric)!=(p_limits->>k)::numeric THEN RAISE EXCEPTION 'Invalid quota limits'; END IF;
 END LOOP;
 INSERT INTO bursyar_quota.budgets(provider,limits) VALUES(p_provider,p_limits) ON CONFLICT(provider) DO NOTHING;
 SELECT limits INTO registered FROM bursyar_quota.budgets WHERE provider=p_provider;
 IF registered!=p_limits THEN RAISE EXCEPTION 'Registered quota limits differ; administrative review required'; END IF;
 RETURN true;
END;
$$;
CREATE FUNCTION public.bursyar_quota_reserve(p_provider text,p_subject text,p_units bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE budget bursyar_quota.budgets%ROWTYPE; current_epoch bigint; current_day bigint; current_minute bigint;
 keys text[]; caps bigint[]; expiries bigint[]; i integer; consumed bigint;
BEGIN
 IF p_provider IS NULL OR p_subject IS NULL OR p_subject !~ '^[a-f0-9]{64}$' OR p_units IS NULL OR p_units<1 OR p_units>9007199254740991 THEN RAISE EXCEPTION 'Invalid quota reservation'; END IF;
 -- Serialize user/global/lifetime checks and writes across all server instances.
 SELECT * INTO budget FROM bursyar_quota.budgets WHERE provider=p_provider FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Quota not initialized'; END IF;
 IF p_units>(budget.limits->>'lifetimeUnits')::bigint-budget.lifetime_used THEN RETURN false; END IF;
 current_epoch:=floor(extract(epoch FROM clock_timestamp()))::bigint;
 current_day:=current_epoch/86400; current_minute:=current_epoch/60;
 keys:=ARRAY['u:'||p_subject||':m:'||current_minute,'u:'||p_subject||':d:'||current_day,'g:d:'||current_day];
 caps:=ARRAY[(budget.limits->>'userMinute')::bigint,(budget.limits->>'userDay')::bigint,(budget.limits->>'globalDay')::bigint];
 expiries:=ARRAY[(current_minute+1)*60,(current_day+1)*86400,(current_day+1)*86400];
 FOR i IN 1..3 LOOP
  SELECT used INTO consumed FROM bursyar_quota.buckets WHERE provider=p_provider AND bucket=keys[i];
  IF coalesce(consumed,0)>=caps[i] THEN RETURN false; END IF;
 END LOOP;
 UPDATE bursyar_quota.budgets SET lifetime_used=lifetime_used+p_units WHERE provider=p_provider;
 FOR i IN 1..3 LOOP
  INSERT INTO bursyar_quota.buckets(provider,bucket,used,expires_epoch) VALUES(p_provider,keys[i],1,expiries[i])
   ON CONFLICT(provider,bucket) DO UPDATE SET used=bursyar_quota.buckets.used+1;
 END LOOP;
 DELETE FROM bursyar_quota.buckets WHERE provider=p_provider AND expires_epoch<=current_epoch;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.bursyar_quota_initialize(text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.bursyar_quota_reserve(text,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bursyar_quota_initialize(text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.bursyar_quota_reserve(text,text,bigint) TO service_role;
COMMIT;
