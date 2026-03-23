-- Allow service role / admin to insert, update, select notifications
-- Run this in Supabase SQL Editor if RLS blocks notification inserts

do $$ begin
  create policy "allow_insert_notifications" on notifications
    for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "allow_update_notifications" on notifications
    for update using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "allow_select_notifications" on notifications
    for select using (true);
exception when duplicate_object then null; end $$;
