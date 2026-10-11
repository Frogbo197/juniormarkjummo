-- JuniorMark consolidated Supabase schema for a clean cloud project.
-- Apply once in the Supabase SQL Editor. Supabase manages auth.users and storage schemas.
-- Local Kotlin auth tables and local-bootstrap.sql are intentionally excluded.

begin;
create extension if not exists pgcrypto;

create domain public.asset_url as text
  check (value ~ '^/[^/]' or value ~ '^https://[^[:space:]]+$');
create domain public.publish_state as text
  check (value in ('draft', 'published', 'archived'));

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table private.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'moderator'))
);
revoke all on private.staff from public, anon, authenticated;

create function private.has_role(required_role text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.staff
    where user_id = (select auth.uid())
      and role in ('admin', required_role)
  );
$$;
revoke all on function private.has_role(text) from public;
grant execute on function private.has_role(text) to anon, authenticated;
-- CHẠY 1 LẦN trong SQL Editor của dự án Supabase mới.
-- Mật khẩu/session do Supabase Auth quản lý trong auth.users, không sao chép ra public.

create table public.fan_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 50),
  created_at timestamptz not null default now()
);

-- Tạo hồ sơ cùng transaction đăng ký, tránh tài khoản thiếu hồ sơ do trình duyệt đóng sớm.


revoke all on function public.handle_new_fan() from public, anon, authenticated;
-- Backfill nếu đã có tài khoản trước khi chạy migration.
-- Bắt buộc bảo vệ dữ liệu ở database, không dựa vào việc ẩn nút trong React.
alter table public.fan_profiles enable row level security;
revoke all on public.fan_profiles from anon, authenticated;
grant select on public.fan_profiles to authenticated;
grant update (display_name) on public.fan_profiles to authenticated;

create policy "Fan chỉ xem hồ sơ của mình"
on public.fan_profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Fan chỉ sửa tên của mình"
on public.fan_profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);



create table public.artists (
 id text primary key check(id ~ '^[a-z][a-z0-9-]{0,59}$'), name text not null,
 kind text not null check(kind in ('artist','mascot')), birthday date,
 stage_image public.asset_url not null, portrait_image public.asset_url not null,
 label text not null, color_label text not null, role_label text not null,
 bio text not null default '', stage_description text not null default '', skills text[] not null default '{}',
 source_url public.asset_url, sort_order int not null default 0,
 status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);
create table public.works (
 id text primary key, title text not null, era_label text not null, year_label text not null,
 kind text not null check(kind in ('series','film','fancon','other')),
 description text not null default '', image public.asset_url not null,
 source_url public.asset_url, sort_order int not null default 0,
 status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);
create table public.work_roles (
 work_id text references public.works(id) on delete cascade,
 artist_id text references public.artists(id) on delete cascade, role_name text not null,
 primary key(work_id,artist_id)
);
create table public.media_items (
 id text primary key, title text not null, alt text not null, kind text not null default 'photo' check(kind in ('photo','video')),
 url public.asset_url not null, thumbnail_url public.asset_url, file_name text not null,
 credit text not null, source_url public.asset_url, topic text not null default 'cozy', tag text not null default '',
 captured_at date, position text not null default 'center', downloadable boolean not null default false,
 sort_order int not null default 0, status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);
create table public.media_artists (
 media_id text references public.media_items(id) on delete cascade,
 artist_id text references public.artists(id) on delete cascade, primary key(media_id,artist_id)
);
create table public.tracks (
 id text primary key, title text not null, subtitle text not null default '',
 audio_url public.asset_url, artist_id text references public.artists(id), work_id text references public.works(id),
 kind text not null default 'playlist' check(kind in ('playlist','ost','voice_memo')),
 source_url public.asset_url, sort_order int not null default 0,
 status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);
create table public.events (
 id text primary key, title text not null, description text not null default '',
 starts_at timestamptz not null, ends_at timestamptz, timezone text not null default 'Asia/Bangkok',
 all_day boolean not null default false, category text not null check(category in ('fancon','press','brand','live','other')),
 venue text, image public.asset_url not null, source_url public.asset_url, action_url public.asset_url,
 is_demo boolean not null default false, event_status text not null default 'scheduled' check(event_status in ('scheduled','cancelled','postponed')),
 sort_order int not null default 0, status public.publish_state not null default 'draft', updated_at timestamptz not null default now(),
 check(ends_at is null or ends_at>starts_at), check(is_demo or status <> 'published' or source_url is not null)
);
create table public.projects (
 id text primary key, title text not null, description text not null default '', image public.asset_url not null,
 goal_amount bigint not null check(goal_amount>0), currency text not null default 'VND' check(currency='VND'),
 source_url public.asset_url, is_demo boolean not null default false,
 sort_order int not null default 0, status public.publish_state not null default 'draft', updated_at timestamptz not null default now(),
 check(is_demo or status<>'published' or source_url is not null)
);
-- Bút toán công khai tổng hợp, không lưu tên/ngân hàng nhà tài trợ trong bảng public.
create table public.project_entries (
 id uuid primary key default gen_random_uuid(), project_id text not null references public.projects(id) on delete cascade,
 amount bigint not null check(amount<>0), entry_date date not null default current_date,
 note text not null, evidence_url public.asset_url,
 status public.publish_state not null default 'draft', updated_at timestamptz not null default now(), sort_order int not null default 0
);
create table public.editorial_entries (
 id text primary key, section text not null check(section in ('highlight','mood','letter','fact','hero')),
 title text not null, body text not null, image public.asset_url, subtitle text not null default '',
 detail text not null default '', tag text not null default '',
 sort_order int not null default 0, status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);
create table public.glossary (
 id text primary key, title text not null, body text not null,
 sort_order int not null default 0, status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);
create table public.checklist_items (
 id text primary key, label text not null,
 sort_order int not null default 0, status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);
create table public.quiz_questions (
 id text primary key, prompt text not null, solar_choice text not null, lunar_choice text not null, jummo_choice text not null,
 sort_order int not null default 0, status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);
create table public.downloads (
 id text primary key, title text not null, description text not null, url public.asset_url,
 kind text not null check(kind in ('mascot','sticker','wallpaper','journal','fanpack')), credit text not null,
 sort_order int not null default 0, status public.publish_state not null default 'draft', updated_at timestamptz not null default now()
);

create table private.audit_log (
 id bigint generated always as identity primary key, actor_id uuid, table_name text not null,
 action text not null, record_id text, occurred_at timestamptz not null default now(),
 before_data jsonb, after_data jsonb
);
revoke all on private.audit_log from public,anon,authenticated;
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.audit_log(actor_id,table_name,action,record_id,before_data,after_data)
 values(auth.uid(),tg_table_name,tg_op,coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id'),to_jsonb(old),to_jsonb(new));
 return coalesce(new,old);
end; $$;
revoke all on function private.touch_updated_at(),private.audit_change() from public,anon,authenticated;

-- Cùng quy tắc xuất bản, nhưng bảng vẫn tách riêng theo nghiệp vụ để có FK/constraints.
do $$ declare t text; begin
 foreach t in array array['artists','works','media_items','tracks','events','projects','project_entries','editorial_entries','glossary','checklist_items','quiz_questions','downloads'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant select on public.%I to anon, authenticated',t);
  execute format('grant insert,update,delete on public.%I to authenticated',t);
  execute format('create policy published_read on public.%I for select using (status=''published'' or (select private.has_role(''editor'')))',t);
  execute format('create policy editor_write on public.%I for all to authenticated using ((select private.has_role(''editor''))) with check ((select private.has_role(''editor'')))',t);
  execute format('create trigger stamp before update on public.%I for each row execute function private.touch_updated_at()',t);
  execute format('create trigger audit after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
  execute format('create index on public.%I(status,sort_order)',t);
 end loop;
end; $$;
-- Một bút toán published vẫn phải có dự án published để xuất hiện công khai.
create policy parent_visible on public.project_entries as restrictive for select
 using(exists(select 1 from public.projects p where p.id=project_id));
alter table public.work_roles enable row level security;
alter table public.media_artists enable row level security;
grant select on public.work_roles,public.media_artists to anon,authenticated;
grant insert,update,delete on public.work_roles,public.media_artists to authenticated;
create policy role_read on public.work_roles for select using(exists(select 1 from public.works w where w.id=work_id) and exists(select 1 from public.artists a where a.id=artist_id));
create policy role_write on public.work_roles for all to authenticated using((select private.has_role('editor'))) with check((select private.has_role('editor')));
create policy media_people_read on public.media_artists for select using(exists(select 1 from public.media_items m where m.id=media_id) and exists(select 1 from public.artists a where a.id=artist_id));
create policy media_people_write on public.media_artists for all to authenticated using((select private.has_role('editor'))) with check((select private.has_role('editor')));
create index on public.work_roles(artist_id);
create index on public.media_artists(artist_id);
create index on public.events(starts_at) where status='published';
create index on public.project_entries(project_id);

-- Hàm đọc giữ SECURITY INVOKER: RLS vẫn áp dụng cho tất cả bảng.
create function public.get_catalog() returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb='{}'; t text; rows jsonb; begin
 foreach t in array array['artists','works','work_roles','media_items','media_artists','tracks','events','projects','project_entries','editorial_entries','glossary','checklist_items','quiz_questions','downloads'] loop
  if t in ('work_roles','media_artists') then
   execute format('select coalesce(jsonb_agg(to_jsonb(x)),''[]''::jsonb) from public.%I x',t) into rows;
  else
   -- Catalog website không đưa bản nháp vào UI kể cả khi người đọc là editor.
   execute format('select coalesce(jsonb_agg(to_jsonb(x) order by sort_order,id),''[]''::jsonb) from public.%I x where status=''published''',t) into rows;
  end if;
  result=result||jsonb_build_object(t,rows);
 end loop;
 return result;
end; $$;
revoke all on function public.get_catalog() from public;
grant execute on function public.get_catalog() to anon,authenticated;


-- Chạy sau 001. Bài mới chờ duyệt; quản trị duyệt trong Supabase Dashboard.
create table public.fan_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('star','note')),
  name text not null check (char_length(btrim(name)) between 2 and 50),
  country text not null check (char_length(btrim(country)) between 1 and 60),
  body text not null check (char_length(btrim(body)) between 1 and 200),
  spectrum text not null check (spectrum in ('junior','mark','jummo')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.fan_messages enable row level security;
revoke all on public.fan_messages from anon, authenticated;
grant select (id,kind,name,country,body,spectrum,created_at,status) on public.fan_messages to anon, authenticated;
grant insert (user_id,kind,name,country,body,spectrum) on public.fan_messages to authenticated;
create policy "Read approved messages" on public.fan_messages for select to anon, authenticated using (status='approved');
create policy "Submit own pending message" on public.fan_messages for insert to authenticated with check ((select auth.uid())=user_id and status='pending');
create index fan_messages_public_feed on public.fan_messages (kind,created_at desc) where status='approved';


-- Suggested migration, reviewed against 001/002. Apply once after both.
-- No change to public message columns or anonymous write permissions.
create table public.archive_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('memory','event','favorite','progress')),
  item_id text not null check (char_length(item_id) between 1 and 200),
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 8192),
  primary key (user_id,kind,item_id)
);
alter table public.archive_items enable row level security;
revoke all on public.archive_items from anon, authenticated;
grant select, insert, update, delete on public.archive_items to authenticated;
create policy "Read own archive" on public.archive_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own archive" on public.archive_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own archive" on public.archive_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own archive" on public.archive_items for delete to authenticated using ((select auth.uid()) = user_id);
-- Owner status is returned by a constrained authenticated function; sender UUID stays private.
create policy "Read own submitted messages" on public.fan_messages for select to authenticated using ((select auth.uid()) = user_id);
create function public.my_archive_messages()
returns table (id uuid, kind text, name text, country text, body text, spectrum text, status text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.id,m.kind,m.name,m.country,m.body,m.spectrum,m.status,m.created_at
  from public.fan_messages m where m.user_id = (select auth.uid())
  order by m.created_at desc limit 100;
$$;
revoke all on function public.my_archive_messages() from public, anon;
grant execute on function public.my_archive_messages() to authenticated;



revoke all on public.work_roles,public.media_artists from anon,authenticated;
grant select on public.work_roles,public.media_artists to anon,authenticated;
grant insert,update,delete on public.work_roles,public.media_artists to authenticated;

create table public.message_likes (
 user_id uuid references auth.users(id) on delete cascade,
 message_id uuid references public.fan_messages(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,message_id)
);
create table public.media_bookmarks (
 user_id uuid references auth.users(id) on delete cascade,
 media_id text references public.media_items(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,media_id)
);
create table public.user_checklist (
 user_id uuid references auth.users(id) on delete cascade,
 item_id text references public.checklist_items(id) on delete cascade,
 completed_at timestamptz not null default now(), primary key(user_id,item_id)
);
-- Kỷ niệm riêng, không phải quyền truy cập hay chứng chỉ có giá trị xác thực.
create table public.fan_progress (
 user_id uuid references auth.users(id) on delete cascade,
 kind text check(kind in ('quiz','baby_fan_certificate')),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=4096),
 updated_at timestamptz not null default now(), primary key(user_id,kind)
);
do $$ declare t text; begin
 foreach t in array array['message_likes','media_bookmarks','user_checklist','fan_progress'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select,insert,delete on public.%I to authenticated',t);
  execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
  execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
end; $$;
create policy like_approved on public.message_likes for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.fan_messages m where m.id=message_id and m.status='approved'));
create policy bookmark_published on public.media_bookmarks for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.media_items m where m.id=media_id and m.status='published'));
create policy checklist_published on public.user_checklist for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.checklist_items c where c.id=item_id and c.status='published'));
create policy progress_own on public.fan_progress for insert to authenticated with check((select auth.uid())=user_id);
grant update(data,updated_at) on public.fan_progress to authenticated;
create policy progress_update on public.fan_progress for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create index on public.message_likes(message_id);
create index on public.media_bookmarks(media_id);
create index on public.user_checklist(item_id);

-- Trigger chạy trong cùng transaction, khóa theo người gửi để không lách bằng request song song.
-- Nhật ký riêng giữ lượt gửi khi fan xóa bài; không thể xóa rồi gửi lại để vượt giới hạn.
create table private.message_submissions (
 user_id uuid not null references auth.users(id) on delete cascade,
 submitted_at timestamptz not null default now()
);
revoke all on private.message_submissions from public,anon,authenticated;
create index on private.message_submissions(user_id,submitted_at);
create function private.limit_messages() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text,0));
 delete from private.message_submissions where user_id=new.user_id and submitted_at<=now()-interval '10 minutes';
 if (select count(*) from private.message_submissions where user_id=new.user_id)>=5 then
  raise exception 'Gửi tối đa 5 lời nhắn trong 10 phút.' using errcode='P0001';
 end if;
 insert into private.message_submissions(user_id) values(new.user_id);
 return new;
end; $$;
revoke all on function private.limit_messages() from public,anon,authenticated;
create trigger message_rate_limit before insert on public.fan_messages for each row execute function private.limit_messages();
create index on public.fan_messages(user_id,created_at desc);
create trigger message_audit after update or delete on public.fan_messages for each row execute function private.audit_change();
grant delete on public.fan_messages to authenticated;
create policy own_message_delete on public.fan_messages for delete to authenticated using((select auth.uid())=user_id);
-- Cho phép chủ bài nhìn trạng thái pending, nhưng không lộ user_id qua column grants hiện có.
create policy own_message_read on public.fan_messages for select to authenticated using((select auth.uid())=user_id or (select private.has_role('moderator')));

create function public.moderate_message(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.has_role('moderator') then raise exception 'Không có quyền duyệt bài.' using errcode='42501'; end if;
 if p_status not in ('approved','rejected','pending') or p_status is null then raise exception 'Trạng thái không hợp lệ.'; end if;
 update public.fan_messages set status=p_status where id=p_id;
 if not found then raise exception 'Không tìm thấy lời nhắn.'; end if;
end; $$;
revoke all on function public.moderate_message(uuid,text) from public;
grant execute on function public.moderate_message(uuid,text) to authenticated;

-- Chỉ trả cột công khai và bài đã duyệt; cursor kép tránh mất bản ghi cùng timestamp.
create function public.get_message_feed(p_kind text,p_before timestamptz default null,p_before_id uuid default null,p_limit int default 20)
returns table(id uuid,name text,country text,body text,spectrum text,created_at timestamptz,like_count bigint)
language sql stable security definer set search_path='' as $$
 select m.id,m.name,m.country,m.body,m.spectrum,m.created_at,(select count(*) from public.message_likes l where l.message_id=m.id)
 from public.fan_messages m where m.kind=p_kind and m.status='approved'
 and (p_before is null or (m.created_at,m.id)<(p_before,p_before_id))
 order by m.created_at desc,m.id desc limit least(greatest(coalesce(p_limit,20),1),50);
$$;
create function public.get_community_stats(p_kind text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('messages',count(*),'locations',count(distinct lower(btrim(country))),
 'likes',(select count(*) from public.message_likes l join public.fan_messages m2 on m2.id=l.message_id where m2.kind=p_kind and m2.status='approved'))
 from public.fan_messages where kind=p_kind and status='approved';
$$;
revoke all on function public.get_message_feed(text,timestamptz,uuid,int),public.get_community_stats(text) from public;
grant execute on function public.get_message_feed(text,timestamptz,uuid,int),public.get_community_stats(text) to anon,authenticated;

-- Public bucket chỉ chứa file đã sẵn sàng công khai. Bản nháp để ở bucket private.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('site-media','site-media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/ogg','video/mp4','application/pdf','application/zip']),
 ('editorial-drafts','editorial-drafts',false,52428800,array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/ogg','video/mp4','application/pdf','application/zip'])
 on conflict(id) do nothing;
create policy editorial_storage_read on storage.objects for select to authenticated using(bucket_id in ('site-media','editorial-drafts') and (select private.has_role('editor')));
create policy editorial_storage_insert on storage.objects for insert to authenticated with check(bucket_id in ('site-media','editorial-drafts') and (select private.has_role('editor')));
create policy editorial_storage_update on storage.objects for update to authenticated using(bucket_id in ('site-media','editorial-drafts') and (select private.has_role('editor'))) with check(bucket_id in ('site-media','editorial-drafts') and (select private.has_role('editor')));
create policy editorial_storage_delete on storage.objects for delete to authenticated using(bucket_id in ('site-media','editorial-drafts') and (select private.has_role('editor')));


-- Bổ sung các trường và chức năng tại mục IV.2 của tài liệu Word.
-- Giữ tên bảng hiện có để đăng nhập/lời nhắn không bị gãy khi nâng cấp.

alter table public.fan_profiles add column avatar_url public.asset_url;
grant update(avatar_url) on public.fan_profiles to authenticated;

alter table public.artists
 add column full_name_english text,
 add column full_name_thai text,
 add column nickname text;
-- Link mạng xã hội tách thành bản ghi, chỉ chấp nhận HTTPS hoặc asset nội bộ.
create table public.artist_social_links (
 artist_id text not null references public.artists(id) on delete cascade,
 platform text not null check(platform in ('instagram','twitter','tiktok','youtube','facebook','website')),
 url public.asset_url not null check(url::text like 'https://%'),
 primary key(artist_id,platform)
);
alter table public.artist_social_links enable row level security;
revoke all on public.artist_social_links from public,anon,authenticated;
grant select on public.artist_social_links to anon,authenticated;
grant insert,update,delete on public.artist_social_links to authenticated;
create policy social_read on public.artist_social_links for select using(exists(select 1 from public.artists a where a.id=artist_id));
create policy social_edit on public.artist_social_links for all to authenticated using((select private.has_role('editor'))) with check((select private.has_role('editor')));

alter table public.media_items
 add column tags text[] not null default '{}',
 add column view_count bigint not null default 0 check(view_count>=0),
 add column created_at timestamptz not null default now();
alter table public.events
 add column map_url public.asset_url,
 add column stream_url public.asset_url,
 add column hashtags text[] not null default '{}',
 add column created_at timestamptz not null default now();

-- Tọa độ lưu một lần: ngôi sao không đổi chỗ mỗi lần tải trang.
alter table public.fan_messages
 add column country_code text not null default 'GLOBAL' check(country_code='GLOBAL' or country_code ~ '^[A-Z]{2}$'),
 add column position_x numeric(5,2) not null default (random()*100)::numeric(5,2) check(position_x between 0 and 100),
 add column position_y numeric(5,2) not null default (random()*100)::numeric(5,2) check(position_y between 0 and 100);
grant select(country_code,position_x,position_y) on public.fan_messages to anon,authenticated;
grant insert(country_code) on public.fan_messages to authenticated;

create table public.jummo_fortunes (
 id uuid primary key default gen_random_uuid(),
 quote_text text not null check(char_length(btrim(quote_text)) between 1 and 1000),
 author_type text not null default 'jummo' check(author_type in ('junior','mark','jummo')),
 background_url public.asset_url,
 status public.publish_state not null default 'draft',
 sort_order int not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.jummo_daily_logs (
 user_id uuid not null references auth.users(id) on delete cascade,
 fortune_id uuid not null references public.jummo_fortunes(id),
 claimed_date date not null,
 created_at timestamptz not null default now(),
 primary key(user_id,claimed_date)
);
create index on public.jummo_daily_logs(fortune_id);
create table public.jummo_secret_rewards (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 reward_type text not null check(reward_type in ('letter','video','wallpaper','sticker')),
 body text not null default '',
 content_url public.asset_url,
 status public.publish_state not null default 'draft',
 sort_order int not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(char_length(btrim(body))>0 or content_url is not null)
);
-- "Bí mật" là Easter Egg giao diện, không phải tài liệu riêng cần bảo mật.
do $$ declare t text; begin
 foreach t in array array['jummo_fortunes','jummo_secret_rewards'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to anon,authenticated',t);
  execute format('grant insert,update,delete on public.%I to authenticated',t);
  execute format('create policy published_read on public.%I for select using(status=''published'' or (select private.has_role(''editor'')))',t);
  execute format('create policy editor_write on public.%I for all to authenticated using((select private.has_role(''editor''))) with check((select private.has_role(''editor'')))',t);
  execute format('create trigger stamp before update on public.%I for each row execute function private.touch_updated_at()',t);
  execute format('create trigger audit after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
  execute format('create index on public.%I(status,sort_order)',t);
 end loop;
end; $$;
alter table public.jummo_daily_logs enable row level security;
revoke all on public.jummo_daily_logs from public,anon,authenticated;
grant select on public.jummo_daily_logs to authenticated;
create policy own_claims on public.jummo_daily_logs for select to authenticated using((select auth.uid())=user_id);

-- Database quyết định ngày theo giờ Việt Nam; không tin đồng hồ trình duyệt.
-- Khóa theo tài khoản tránh hai request đồng thời nhận hai quẻ khác nhau.
create function public.claim_daily_fortune() returns public.jummo_fortunes
language plpgsql security definer set search_path='' as $$
declare fan_id uuid=auth.uid(); today date=(now() at time zone 'Asia/Ho_Chi_Minh')::date;
 chosen public.jummo_fortunes;
begin
 if fan_id is null then raise exception 'Đăng nhập để nhận quẻ.' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fortune:'||fan_id::text,0));
 select f.* into chosen from public.jummo_daily_logs l join public.jummo_fortunes f on f.id=l.fortune_id
 where l.user_id=fan_id and l.claimed_date=today;
 if found then
  -- Quẻ bị thu hồi không tiếp tục lộ nội dung qua RPC.
  if chosen.status<>'published' then raise exception 'Quẻ hôm nay đã được thu hồi.' using errcode='P0001'; end if;
  return chosen;
 end if;
 select * into chosen from public.jummo_fortunes where status='published' order by random() limit 1;
 if not found then raise exception 'Chưa có quẻ được xuất bản.' using errcode='P0001'; end if;
 insert into public.jummo_daily_logs(user_id,fortune_id,claimed_date) values(fan_id,chosen.id,today);
 return chosen;
end; $$;
revoke all on function public.claim_daily_fortune() from public,anon;
grant execute on function public.claim_daily_fortune() to authenticated;

-- Catalog cho giao diện; chỉ trả bản ghi published và liên kết của bản ghi published.
create or replace function public.get_catalog() returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb='{}'; t text; rows jsonb; begin
 foreach t in array array['artists','works','media_items','tracks','events','projects','project_entries','editorial_entries','glossary','checklist_items','quiz_questions','downloads','jummo_fortunes','jummo_secret_rewards'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(x) order by sort_order,id),''[]''::jsonb) from public.%I x where status=''published''',t) into rows;
  result=result||jsonb_build_object(t,rows);
 end loop;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into rows from public.work_roles r
 join public.artists a on a.id=r.artist_id and a.status='published' join public.works w on w.id=r.work_id and w.status='published';
 result=result||jsonb_build_object('work_roles',rows);
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into rows from public.media_artists r
 join public.artists a on a.id=r.artist_id and a.status='published' join public.media_items m on m.id=r.media_id and m.status='published';
 result=result||jsonb_build_object('media_artists',rows);
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into rows from public.artist_social_links r
 join public.artists a on a.id=r.artist_id and a.status='published';
 return result||jsonb_build_object('artist_social_links',rows);
end; $$;

comment on table public.artists is 'Hồ sơ Junior, Mark và Jummo; tương ứng profiles trong tài liệu.';
comment on table public.fan_profiles is 'Hồ sơ fan; email/mật khẩu ở auth.users, quyền nhân sự ở private.staff.';
comment on table public.events is 'Lịch trình; tương ứng schedules trong tài liệu. Sinh nhật tính từ artists.birthday.';
comment on table public.fan_messages is 'Sao hoặc nốt nhạc: kind=star/note. Chỉ approved được công khai.';
comment on table public.jummo_daily_logs is 'Mỗi tài khoản nhận tối đa một quẻ mỗi ngày theo giờ Việt Nam, ghi qua claim_daily_fortune.';
comment on column public.media_items.view_count is 'Lượt xem được server/editor xác nhận. Chưa nối bộ đếm từ UI; không tự tăng từ client.';
comment on column public.fan_messages.country_code is 'Mã ISO hai chữ hoặc GLOBAL; không lưu địa chỉ nhà/IP của fan.';
comment on column public.artists.full_name_english is 'Họ tên đầy đủ bằng tiếng Anh.';
comment on column public.artists.full_name_thai is 'Họ tên đầy đủ bằng tiếng Thái; để trống cho đến khi xác minh nguồn.';


-- Chạy sau 003_archive_items và 005_document_features. Không lưu mật khẩu trong public.
alter table public.fan_profiles add column bio text not null default '' check(char_length(bio)<=500);
grant update(bio) on public.fan_profiles to authenticated;
alter table public.archive_items drop constraint archive_items_kind_check;
alter table public.archive_items add constraint archive_items_kind_check check(kind in ('memory','event','favorite','progress','photo','page'));

create table public.user_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 show_country boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.user_notes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(btrim(title)) between 1 and 120),
 body text not null default '' check(char_length(body)<=10000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index user_notes_owner_date on public.user_notes(user_id,updated_at desc);
do $$ declare t text; begin
 foreach t in array array['user_settings','user_notes'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select,insert,delete on public.%I to authenticated',t);
  execute format('create policy own_read on public.%I for select to authenticated using((select auth.uid())=user_id)',t);
  execute format('create policy own_insert on public.%I for insert to authenticated with check((select auth.uid())=user_id)',t);
  execute format('create policy own_update on public.%I for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id)',t);
  execute format('create policy own_delete on public.%I for delete to authenticated using((select auth.uid())=user_id)',t);
  execute format('create trigger stamp before update on public.%I for each row execute function private.touch_updated_at()',t);
 end loop;
end; $$;
-- Upsert gửi cả user_id; RLS vẫn ngăn đổi chủ sở hữu.
grant update(user_id,show_country) on public.user_settings to authenticated;
grant update(title,body) on public.user_notes to authenticated;

-- Lựa chọn áp dụng cho lời nhắn mới, không sửa lại bài cũ hay xác định vị trí người dùng.
create function private.apply_message_privacy() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not coalesce((select show_country from public.user_settings where user_id=new.user_id),false) then
  new.country='GLOBAL'; new.country_code='GLOBAL';
 end if;
 return new;
end; $$;
revoke all on function private.apply_message_privacy() from public,anon,authenticated;
create trigger message_privacy before insert on public.fan_messages for each row execute function private.apply_message_privacy();

-- Mọi truy vấn ràng buộc auth.uid(), danh sách bảng cố định. Không xuất session/mật khẩu/quyền nội bộ.
-- SECURITY DEFINER chỉ để đọc lời nhắn theo user_id (cột này không cấp trực tiếp cho trình duyệt).
create function public.export_my_data() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb='{}'; t text; rows jsonb; begin
 if auth.uid() is null then raise exception 'Đăng nhập để xuất dữ liệu.' using errcode='42501'; end if;
 select to_jsonb(p) into rows from public.fan_profiles p where id=auth.uid();
 result=jsonb_build_object('profile',rows);
 foreach t in array array['user_settings','user_notes','archive_items','message_likes','media_bookmarks','user_checklist','fan_progress','jummo_daily_logs'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(x)),''[]''::jsonb) from public.%I x where user_id=auth.uid()',t) into rows;
  result=result||jsonb_build_object(t,rows);
 end loop;
 select coalesce(jsonb_agg(to_jsonb(m)-'user_id'),'[]'::jsonb) into rows from public.fan_messages m where user_id=auth.uid();
 return result||jsonb_build_object('messages',rows);
end; $$;
revoke all on function public.export_my_data() from public,anon;
grant execute on function public.export_my_data() to authenticated;
comment on table public.user_notes is 'Ghi chú cá nhân dạng chữ thuần; chỉ chủ tài khoản đọc/sửa/xóa.';
comment on column public.user_settings.show_country is 'Cho phép hiển thị quốc gia trên lời nhắn mới. Mặc định ẩn.';

-- Ensure every application table in public has RLS enabled.
alter table public.fan_profiles enable row level security;
alter table public.fan_messages enable row level security;
alter table public.archive_items enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_notes enable row level security;
alter table public.artists enable row level security;
alter table public.works enable row level security;
alter table public.work_roles enable row level security;
alter table public.media_items enable row level security;
alter table public.media_artists enable row level security;
alter table public.tracks enable row level security;
alter table public.events enable row level security;
alter table public.projects enable row level security;
alter table public.project_entries enable row level security;
alter table public.editorial_entries enable row level security;
alter table public.glossary enable row level security;
alter table public.checklist_items enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.downloads enable row level security;
alter table public.artist_social_links enable row level security;
alter table public.message_likes enable row level security;
alter table public.media_bookmarks enable row level security;
alter table public.user_checklist enable row level security;
alter table public.fan_progress enable row level security;
alter table public.jummo_fortunes enable row level security;
alter table public.jummo_daily_logs enable row level security;
alter table public.jummo_secret_rewards enable row level security;
create function public.handle_new_fan()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  fan_name text;
begin
  fan_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 50);
  if char_length(fan_name) < 2 then fan_name := 'Jummo Fan'; end if;
  insert into public.fan_profiles (id, display_name) values (new.id, fan_name);
  return new;
end;
$$;

-- Create a profile for new Supabase Auth users and backfill any existing accounts.
create trigger on_auth_user_created_fan
after insert on auth.users
for each row execute procedure public.handle_new_fan();

insert into public.fan_profiles (id, display_name)
select id,
  case when char_length(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) >= 2
    then left(btrim(raw_user_meta_data ->> 'display_name'), 50)
    else 'Jummo Fan'
  end
from auth.users
on conflict (id) do nothing;

-- Initial catalog/content seed data (original INSERT statements; conflict-safe).
set local standard_conforming_strings = on;
insert into public."artists" ("sort_order","status","id","name","kind","birthday","stage_image","portrait_image","label","color_label","role_label","bio","stage_description","skills") values (0,'published','jummo','Jummo Mascot','mascot',NULL,'/images/jummo-mascot.png','/images/jummo-mascot.png','CELESTIAL GUARDIAN','Sun Gold & Cosmic Blue','Sun & Moon Companion','Linh vật hướng dương kết nối hai sắc màu của JuniorMark.','Người bạn nhỏ kết nối Ánh Dương & Ánh Nguyệt. Ghé gác xép của Jummo để khám phá lời nhắn và những món quà.',ARRAY[]::text[]) on conflict do nothing;
insert into public."artists" ("sort_order","status","id","name","kind","birthday","stage_image","portrait_image","label","color_label","role_label","bio","stage_description","skills") values (1,'published','junior','Junior Panachai','artist','1996-10-23','/images/junior-stage.png','/images/fan-photos/HNr2eA_aUAAAesn.jpg','SOLAR EMBER','Sun Flare Gold','Ánh Dương • Sun','Góc hồ sơ Junior: diễn xuất, sân khấu và những câu chuyện trong hành trình JuniorMark.','Khám phá hồ sơ Ánh Dương Panachai và những cột mốc trong hành trình JuniorMark.',ARRAY['Diễn xuất','Host / MC','Sân khấu']::text[]) on conflict do nothing;
insert into public."artists" ("sort_order","status","id","name","kind","birthday","stage_image","portrait_image","label","color_label","role_label","bio","stage_description","skills") values (2,'published','mark','Mark Jiruntanin','artist','1997-06-15','/images/mark-stage.png','/images/fan-photos/HLt1Jy5bcAAdFxD.jpg','LUNAR MELODY','Cosmic Blue','Ánh Nguyệt • Moon','Góc hồ sơ Mark: vai diễn, giai điệu và những dấu mốc được fandom lưu giữ.','Khám phá hồ sơ Ánh Nguyệt Jiruntanin, góc âm nhạc và những khoảnh khắc được lưu giữ.',ARRAY['Diễn xuất','Âm nhạc','Acoustic']::text[]) on conflict do nothing;
insert into public."works" ("sort_order","status","id","title","era_label","year_label","kind","description","image") values (0,'published','cherry','Cherry Magic','Star Alpha','2023–2024','series','Chương mở đầu trong góc lưu trữ những vai diễn và khoảnh khắc JuniorMark.','/images/fan-photos/HNoYWmeaIAAtCbj.jpg') on conflict do nothing;
insert into public."works" ("sort_order","status","id","title","era_label","year_label","kind","description","image") values (1,'published','liners','Perfect 10 Liners','Star Beta','2024–2025','series','Một chương mới với Faifa & Wine, cùng những nụ cười và dấu mốc được fandom lưu lại.','/images/fan-photos/HNwgVKGbsAA2z-b.jpg') on conflict do nothing;
insert into public."works" ("sort_order","status","id","title","era_label","year_label","kind","description","image") values (2,'published','fancon','Sunnymoon & ShineRise','Star Zenith','Fancon memories','fancon','Âm nhạc, ánh đèn và bé Jummo trong bộ sưu tập kỷ niệm sân khấu.','/images/fan-photos/HPWCyKybkAAHKUm.jpg') on conflict do nothing;
insert into public."works" ("sort_order","status","id","title","era_label","year_label","kind","description","image") values (3,'published','romance','My Romance Scammer','Star Horizon','Next chapter','series','Tiếp nối hành trình kể chuyện của JuniorMark. Theo dõi thông báo phát hành tại GMMTV.','/images/fan-photos/HNwNJ4GbsAE5PwW.jpg') on conflict do nothing;
insert into public."work_roles" ("work_id","artist_id","role_name") values ('cherry','junior','Jinta') on conflict do nothing;
insert into public."work_roles" ("work_id","artist_id","role_name") values ('cherry','mark','Min') on conflict do nothing;
insert into public."work_roles" ("work_id","artist_id","role_name") values ('liners','junior','Faifa') on conflict do nothing;
insert into public."work_roles" ("work_id","artist_id","role_name") values ('liners','mark','Wine') on conflict do nothing;
insert into public."work_roles" ("work_id","artist_id","role_name") values ('romance','junior','Tim') on conflict do nothing;
insert into public."work_roles" ("work_id","artist_id","role_name") values ('romance','mark','Pai') on conflict do nothing;
insert into public."work_roles" ("work_id","artist_id","role_name") values ('fancon','junior','Performer') on conflict do nothing;
insert into public."work_roles" ("work_id","artist_id","role_name") values ('fancon','mark','Performer') on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (0,'published','photo-01','A Little Promise','Hai người móc tay và mỉm cười trên sân khấu','photo','/images/fan-photos/HNwgVKGbsAA2z-b.jpg','HNwgVKGbsAA2z-b.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'stage','TOGETHER ON STAGE','center 30%',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (1,'published','photo-02','By Your Side','Hai người trong trang phục trắng bên cửa sổ','photo','/images/fan-photos/HNpnaOZbsAAGFbv.jpg','HNpnaOZbsAAGFbv.jpg','CITER • Ảnh do người dùng cung cấp.',NULL,'cozy','COZY DAYS','center 30%',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (2,'published','photo-03','Soft Starlight','Chân dung trong áo khoác trắng viền đen','photo','/images/fan-photos/HLt1Jy5bcAAdFxD.jpg','HLt1Jy5bcAAdFxD.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'portrait','PORTRAIT DIARY','center 25%',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (3,'published','photo-04','Our Little Sunshine','Jummo với chiếc mũ hướng dương giữa những mảnh confetti','photo','/images/fan-photos/HPWCyKybkAAHKUm.jpg','HPWCyKybkAAHKUm.jpg','BRACIB • Ảnh do người dùng cung cấp.',NULL,'stage','JUMMO MOMENTS','28% center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (4,'published','photo-05','Golden Hour','Hai người đứng trong căn phòng ánh đèn vàng ấm','photo','/images/fan-photos/HNwNJ4GbsAE5PwW.jpg','HNwNJ4GbsAE5PwW.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'cozy','JUNIORMARK','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (5,'published','photo-06','A Quiet Moment','Chân dung nhìn nghiêng với ánh sáng dịu','photo','/images/fan-photos/731417546_18122842150657853_5326659436814355590_n.jpg','731417546_18122842150657853_5326659436814355590_n.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'portrait','SOFT LIGHT','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (6,'published','photo-07','Red & Green','Chân dung áo len sọc đỏ đen bên tán lá','photo','/images/fan-photos/bac532af2edaf92f15cd0d49fe41c8e1.jpg','bac532af2edaf92f15cd0d49fe41c8e1.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'portrait','PORTRAIT DIARY','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (7,'published','photo-08','Little Everyday Things','Khoảnh khắc sinh hoạt, chuẩn bị một chiếc áo trắng','photo','/images/fan-photos/HK_3D4bbsAAFcSk.jpg','HK_3D4bbsAAFcSk.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'cozy','DAILY MOMENTS','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (8,'published','photo-09','Pages of Us','Ảnh ghép những món ăn, quà tặng và kỷ niệm đời thường','photo','/images/fan-photos/HLlKtNeaUAA42uM.jpg','HLlKtNeaUAA42uM.jpg','@junniours (watermark trên ảnh) • Ảnh do người dùng cung cấp.',NULL,'cozy','PHOTO DIARY','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (9,'published','photo-10','Midnight Portrait','Chân dung nghiêng trong trang phục đen','photo','/images/fan-photos/HMUIpvfa0AE-yvv.jpg','HMUIpvfa0AE-yvv.jpg','MarkJrtn’s Trends TH • Ảnh do người dùng cung cấp.',NULL,'portrait','IN THE SPOTLIGHT','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (10,'published','photo-11','A Tender Moment','Khoảnh khắc hôn trán dịu dàng','photo','/images/fan-photos/HNoYWmeaIAAtCbj.jpg','HNoYWmeaIAAtCbj.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'cozy','JUNIORMARK','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (11,'published','photo-12','Blue Notes','Ảnh ghép hai dáng chụp với trang phục denim','photo','/images/fan-photos/HNr2eA_aUAAAesn.jpg','HNr2eA_aUAAAesn.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'portrait','PORTRAIT DIARY','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (12,'published','photo-13','Under Stage Lights','Hai người tựa sát bên nhau dưới ánh đèn sân khấu','photo','/images/fan-photos/HPSkkI9bIAEmbku.jpg','HPSkkI9bIAEmbku.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'stage','STAGE MEMORY','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (13,'published','photo-14','Slow Morning','Khoảnh khắc ngồi bên giường nhìn về phía ánh sáng','photo','/images/fan-photos/HQZjqeoaIAApm0L.jpg','HQZjqeoaIAApm0L.jpg','Bộ ảnh do người dùng cung cấp • Giữ nguyên watermark trên ảnh gốc.',NULL,'portrait','COZY DAYS','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (14,'published','photo-15','JuMarkMo','Ảnh đôi trong trang phục tối màu từ bài đăng GMMTV','photo','/images/fan-photos/gmmtv-jumarkmo.jpg','gmmtv-jumarkmo.jpg','GMMTV','https://x.com/GMMTV/status/2047943286078484622','cozy','GMMTV ARCHIVE','center',true) on conflict do nothing;
insert into public."media_items" ("sort_order","status","id","title","alt","kind","url","file_name","credit","source_url","topic","tag","position","downloadable") values (15,'published','photo-16','ShineRise','Ảnh đôi trong suit đen trắng tại hậu trường từ GMMTV','photo','/images/fan-photos/gmmtv-shinerise.jpg','gmmtv-shinerise.jpg','GMMTV','https://x.com/GMMTV/status/1955203882625458213','stage','GMMTV ARCHIVE','center',true) on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-01','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-01','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-02','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-02','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-03','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-04','jummo') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-05','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-05','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-06','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-07','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-08','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-09','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-10','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-11','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-11','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-12','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-13','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-13','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-14','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-15','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-15','mark') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-16','junior') on conflict do nothing;
insert into public."media_artists" ("media_id","artist_id") values ('photo-16','mark') on conflict do nothing;
insert into public."tracks" ("id","title","subtitle","audio_url","kind","status","sort_order") values ('playlist-1','อย่าน่ารักเกิน (Cutie Overload)','Junior Panachai, Mark Jiruntanin','/audio/ytmp3free.cc_cutie-overload-junior-panachai-mark-jiruntanin-youtubemp3free.org.mp3','playlist','published',0) on conflict do nothing;
insert into public."tracks" ("id","title","subtitle","audio_url","kind","status","sort_order") values ('playlist-2','วางใจ (Trust Me)','Junior Panachai, Mark Jiruntanin','/audio/ytmp3free.cc_trust-me-ostmy-romance-scammer-junior-panachai-mark-jiruntanin-youtubemp3free.org.mp3','playlist','published',1) on conflict do nothing;
insert into public."tracks" ("id","title","subtitle","audio_url","kind","status","sort_order") values ('playlist-3','ให้ได้รัก (Let Me Love You)','Junior Panachai','/audio/ytmp3free.cc_let-me-love-you-ostmy-romance-scammer-junior-panachai-youtubemp3free.org.mp3','playlist','published',2) on conflict do nothing;
insert into public."tracks" ("id","title","subtitle","audio_url","kind","status","sort_order") values ('playlist-4','No One Else','Perth Tanapon, Santa Pongsapak','/audio/ytmp3free.cc_no-one-else-ost-perfect-10-liners-perth-tanapon-santa-pongsapak-youtubemp3free.org.mp3','playlist','published',3) on conflict do nothing;
insert into public."events" ("sort_order","status","id","title","description","starts_at","all_day","category","is_demo","image") values (0,'published','acoustic','Birthday Acoustic Night • Starlit Echoes','Sự kiện minh họa từ bản thiết kế, chưa xác nhận.','2026-06-15T00:00:00+07:00',true,'fancon',true,'/images/fan-photos/HLt1Jy5bcAAdFxD.jpg') on conflict do nothing;
insert into public."events" ("sort_order","status","id","title","description","starts_at","all_day","category","is_demo","image") values (1,'published','press','My Romance Scammer • Press Conference','Sự kiện minh họa từ bản thiết kế, chưa xác nhận.','2026-09-15T00:00:00+07:00',true,'press',true,'/images/fan-photos/HNwNJ4GbsAE5PwW.jpg') on conflict do nothing;
insert into public."events" ("sort_order","status","id","title","description","starts_at","all_day","category","is_demo","image") values (2,'published','gathering','Sunflowers for You • Birthday Gathering','Sự kiện minh họa từ bản thiết kế, chưa xác nhận.','2026-10-23T00:00:00+07:00',true,'fancon',true,'/images/fan-photos/HNr2eA_aUAAAesn.jpg') on conflict do nothing;
insert into public."projects" ("sort_order","status","id","title","goal_amount","image","is_demo","description") values (0,'published','junior-led','LED mừng sinh nhật Junior',50000000,'/images/fan-photos/HNr2eA_aUAAAesn.jpg',true,'Dự án mẫu, chưa mở quyên góp hoặc nhận tiền.') on conflict do nothing;
insert into public."projects" ("sort_order","status","id","title","goal_amount","image","is_demo","description") values (1,'published','food-truck','Food Truck tiếp sức đoàn phim',35000000,'/images/fan-photos/HNwNJ4GbsAE5PwW.jpg',true,'Dự án mẫu, chưa mở quyên góp hoặc nhận tiền.') on conflict do nothing;
insert into public."projects" ("sort_order","status","id","title","goal_amount","image","is_demo","description") values (2,'published','jummo-charity','Mang nụ cười cùng bé Jummo',30000000,'/images/fan-photos/HPWCyKybkAAHKUm.jpg',true,'Dự án mẫu, chưa mở quyên góp hoặc nhận tiền.') on conflict do nothing;
insert into public."project_entries" ("sort_order","status","id","project_id","amount","note","entry_date") values (0,'published','00000000-0000-4000-8000-000000000001','junior-led',42500000,'Bút toán minh họa, không phải giao dịch thật.','2026-09-14') on conflict do nothing;
insert into public."project_entries" ("sort_order","status","id","project_id","amount","note","entry_date") values (1,'published','00000000-0000-4000-8000-000000000002','food-truck',35000000,'Bút toán minh họa, không phải giao dịch thật.','2026-09-14') on conflict do nothing;
insert into public."project_entries" ("sort_order","status","id","project_id","amount","note","entry_date") values (2,'published','00000000-0000-4000-8000-000000000003','jummo-charity',18600000,'Bút toán minh họa, không phải giao dịch thật.','2026-09-14') on conflict do nothing;
insert into public."editorial_entries" ("sort_order","status","id","section","title","body","image","subtitle","detail","tag") values (0,'published','highlight-1','highlight','Một bầu trời mang tên Jummo','Giữa những mảnh confetti, có một mặt trời nhỏ luôn ở cạnh chúng mình.','/images/fan-photos/HPWCyKybkAAHKUm.jpg','JUMMO MOMENTS','Ảnh Jummo tại sự kiện được người dùng cung cấp. Một khoảnh khắc để lưu lại trong góc nhỏ của cộng đồng. Credit trên ảnh: BRACIB.','OUR LITTLE SUNSHINE') on conflict do nothing;
insert into public."editorial_entries" ("sort_order","status","id","section","title","body","image","subtitle","detail","tag") values (1,'published','highlight-2','highlight','Một lời hứa, hai nụ cười','Những cái móc tay và ánh nhìn dịu dàng làm nên ký ức của JuniorMark.','/images/fan-photos/HNwgVKGbsAA2z-b.jpg','TOGETHER ON STAGE','Ảnh JuniorMark móc tay trên sân khấu từ bộ ảnh người dùng cung cấp. Giữ nguyên ảnh gốc và watermark khi xem ảnh lớn trong gallery.','JUNIORMARK MEMORY') on conflict do nothing;
insert into public."editorial_entries" ("sort_order","status","id","section","title","body","image","subtitle","detail","tag") values (2,'published','highlight-3','highlight','Nắng ghé qua khung cửa','Một buổi sáng thật chậm, một khoảng trời ấm áp, và hai người bên nhau.','/images/fan-photos/HNpnaOZbsAAGFbv.jpg','COZY DAYS','Ảnh trong bộ trang phục trắng từ người dùng, có logo CITER trên ảnh. Bản gốc được giữ nguyên trong thư viện.','PHOTO DIARY') on conflict do nothing;
insert into public."editorial_entries" ("sort_order","status","id","section","title","body","image","subtitle") values (0,'published','music','mood','Jummo Headphone','Đắm chìm trong tiếng guitar và một giai điệu ấm áp.','/jummo_dance.gif','Đang nghe nhạc (Lo-Fi Acoustic)') on conflict do nothing;
insert into public."editorial_entries" ("sort_order","status","id","section","title","body","image","subtitle") values (1,'published','book','mood','Jummo Storybook','Một góc yên tĩnh để đọc sách và lưu lại câu chuyện.','/reading.gif','Đang đọc kịch bản & sách') on conflict do nothing;
insert into public."editorial_entries" ("sort_order","status","id","section","title","body","image","subtitle") values (2,'published','heart','mood','Sunflower Heart','Gửi thật nhiều yêu thương tới JuniorMark và bạn.','/hugging.gif','Gửi ngàn tim yêu (Fandom Vibe)') on conflict do nothing;
insert into public."editorial_entries" ("sort_order","status","id","section","title","body") values (0,'published','attic-letter','letter','Gửi các vì sao thân yêu','Gửi các vì sao thân yêu,
Một ngày dù bận rộn đến đâu, mong bạn vẫn giữ cho mình một khoảng bình yên. Cảm ơn bạn đã mang âm nhạc và nụ cười đến góc nhỏ này.
— Lời nhắn biên tập của fansite, không phải thư thật của nghệ sĩ.') on conflict do nothing;
insert into public."editorial_entries" ("id","title","body","image","subtitle","tag","section","sort_order","status") values ('hero-duo','Junior & Mark','Ánh Dương & Ánh Nguyệt • Voice of Destiny','/images/fan-photos/HNwNJ4GbsAE5PwW.jpg','IN OUR WARM LITTLE WORLD','THE CELESTIAL DUO','hero',0,'published') on conflict do nothing;
insert into public."editorial_entries" ("id","title","body","image","subtitle","tag","section","sort_order","status") values ('hero-studio','Panachai & Jiruntanin','Một chút bình yên, một khoảng trời chung','/images/fan-photos/HNpnaOZbsAAGFbv.jpg','COZY MOMENTS & SUNLIGHT','STUDIO BACKSTAGE LIFE','hero',1,'published') on conflict do nothing;
insert into public."glossary" ("sort_order","status","id","title","body") values (0,'published','term-1','Junior / Juju','Tên gọi thân mật dành cho Junior trong góc lưu trữ fansite.') on conflict do nothing;
insert into public."glossary" ("sort_order","status","id","title","body") values (1,'published','term-2','Mark / Markji','Tên gọi thân mật dành cho Mark trong góc lưu trữ fansite.') on conflict do nothing;
insert into public."glossary" ("sort_order","status","id","title","body") values (2,'published','term-3','Bé Mõ Jummo','Linh vật kết nối Sun & Moon của JuniorMark.') on conflict do nothing;
insert into public."glossary" ("sort_order","status","id","title","body") values (3,'published','term-4','Sun & Moon','Hình tượng Ánh Dương và Ánh Nguyệt dùng trong thiết kế.') on conflict do nothing;
insert into public."glossary" ("sort_order","status","id","title","body") values (4,'published','term-5','Fancon','Sự kiện kết hợp giao lưu fan và biểu diễn.') on conflict do nothing;
insert into public."glossary" ("sort_order","status","id","title","body") values (5,'published','term-6','OST','Nhạc gắn với phim hoặc chương trình.') on conflict do nothing;
insert into public."checklist_items" ("sort_order","status","id","label") values (0,'published','check-1','Đọc nguồn chính thức của chiến dịch') on conflict do nothing;
insert into public."checklist_items" ("sort_order","status","id","label") values (1,'published','check-2','Kiểm tra hạn và điều kiện bình chọn') on conflict do nothing;
insert into public."checklist_items" ("sort_order","status","id","label") values (2,'published','check-3','Giữ thông tin tài khoản riêng tư') on conflict do nothing;
insert into public."checklist_items" ("sort_order","status","id","label") values (3,'published','check-4','Tôn trọng bản quyền và người sáng tạo') on conflict do nothing;
insert into public."checklist_items" ("sort_order","status","id","label") values (4,'published','check-5','Cổ vũ bằng nội dung của chính mình') on conflict do nothing;
insert into public."quiz_questions" ("sort_order","status","id","prompt","solar_choice","lunar_choice","jummo_choice") values (0,'published','question-1','Một ngày mệt mỏi khép lại, bạn muốn điều gì?','Một buổi jam tràn năng lượng','Một giai điệu thật dịu','Một cái ôm của Jummo') on conflict do nothing;
insert into public."quiz_questions" ("sort_order","status","id","prompt","solar_choice","lunar_choice","jummo_choice") values (1,'published','question-2','Bạn sẽ mang gì đến tiệm đĩa?','Hoa hướng dương','Một chiếc đĩa yêu thích','Một lá thư nhỏ') on conflict do nothing;
insert into public."quiz_questions" ("sort_order","status","id","prompt","solar_choice","lunar_choice","jummo_choice") values (2,'published','question-3','Điều bạn muốn gửi tới JuniorMark?','Nụ cười và sức mạnh','Bình yên và cảm hứng','Tình yêu của cả fandom') on conflict do nothing;
insert into public."downloads" ("sort_order","status","id","title","description","url","kind","credit") values (0,'published','mascot','Jummo Mascot','Ảnh mascot đang dùng trong giao diện.','/images/jummo-mascot.png','mascot','Ảnh từ thiết kế người dùng cung cấp') on conflict do nothing;
insert into public."downloads" ("sort_order","status","id","title","description","url","kind","credit") values (1,'published','stickers','Bộ Sticker & Hình Nền','File gốc chưa được cung cấp.',NULL,'sticker','') on conflict do nothing;
insert into public."downloads" ("sort_order","status","id","title","description","url","kind","credit") values (2,'published','journal','Hộ Chiếu & Nhật Ký','Nhật ký chòm sao sẽ được bổ sung khi có file.',NULL,'journal','') on conflict do nothing;
insert into public."jummo_fortunes" ("id","quote_text","author_type","background_url","status","sort_order") values ('10000000-0000-4000-8000-000000000001','Đắm chìm trong tiếng guitar và một giai điệu ấm áp.','jummo','/jummo_dance.gif','published',0) on conflict do nothing;
insert into public."jummo_fortunes" ("id","quote_text","author_type","background_url","status","sort_order") values ('10000000-0000-4000-8000-000000000002','Một góc yên tĩnh để đọc sách và lưu lại câu chuyện.','jummo','/reading.gif','published',1) on conflict do nothing;
insert into public."jummo_fortunes" ("id","quote_text","author_type","background_url","status","sort_order") values ('10000000-0000-4000-8000-000000000003','Gửi thật nhiều yêu thương tới JuniorMark và bạn.','jummo','/hugging.gif','published',2) on conflict do nothing;
insert into public."jummo_secret_rewards" ("id","title","reward_type","body","status","sort_order") values ('20000000-0000-4000-8000-000000000001','Gửi các vì sao thân yêu','letter','Gửi các vì sao thân yêu,
Một ngày dù bận rộn đến đâu, mong bạn vẫn giữ cho mình một khoảng bình yên. Cảm ơn bạn đã mang âm nhạc và nụ cười đến góc nhỏ này.
— Lời nhắn biên tập của fansite, không phải thư thật của nghệ sĩ.','published',0) on conflict do nothing;
commit;
