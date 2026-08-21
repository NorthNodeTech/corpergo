-- Add "Other" care category for booking when none of the listed focuses apply.
insert into public.physiotherapy_categories (name, slug, description, sort_order, is_active)
values ('Other', 'other', 'Something else or not sure yet', 9, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  deleted_at = null;
