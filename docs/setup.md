# Setup Básico - Integração do Supabase + Clerk

-   Entrar no Clerk e adicionar um JWT Template do supabase com a devida key gerada.

## Função auxiliar para buscar o user_id pelo token JWT do Clerk

```
create or replace function requesting_user_id()
returns text
language sql stable
as $$
	select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;
```

## Criando uma policy para usuários autenticados poderem editarem seus registros

-   Compara o user_id da requisição com o do registro da tabela para permitir a edição

```
create policy "Authenticated users can update their own tasks"
on public.tasks for update using (
	auth.role() = 'authenticated'::text
) with check (
	requesting_user_id() = user_id
);
```

## Criando uma policy para usuários autenticados poderem excluir seus registros

-   Compara o user_id da requisição com o do registro da tabela para permitir a exclusão

```
create policy "Authenticated users can delete their own tasks"
  on public.tasks
  for delete
  using (
    auth.role() = 'authenticated'::text
    and requesting_user_id() = user_id
  );
```
