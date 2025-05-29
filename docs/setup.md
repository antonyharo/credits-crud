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

```
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  credits INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT
);

-- Índices para melhorar performance
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);

-- Função e trigger para atualizar automaticamente o updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```