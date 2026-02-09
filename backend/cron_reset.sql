-- Function to reset monthly quotas
-- Call this via RPC: supabase.rpc('reset_monthly_quotas')

create or replace function public.reset_monthly_quotas()
returns json as $$
declare
  updated_count int;
begin
  -- Update rows where period_end is in the past
  with updated_rows as (
    update public.users_plans
    set 
      ai_calls_used = 0,
      -- Advance by 1 month safely
      period_end = period_end + interval '1 month',
      updated_at = now()
    where 
      period_end < now()
    returning user_id
  )
  select count(*) into updated_count from updated_rows;

  return json_build_object(
    'status', 'success', 
    'updated_count', updated_count
  );
end;
$$ language plpgsql security definer;
