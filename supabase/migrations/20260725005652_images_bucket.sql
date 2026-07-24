-- Create images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true, -- images are public
  10485760, -- 10MB limit (adjust as needed)
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
) on conflict (id) do nothing;

-- Set up RLS policies for images
create policy "Images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Users can upload their own images."
  on storage.objects for insert
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own images."
  on storage.objects for update
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own images."
  on storage.objects for delete
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
