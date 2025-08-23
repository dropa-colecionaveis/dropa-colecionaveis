-- RLS Policies for NextAuth (não integrado com Supabase Auth)
-- Execute este script no Supabase SQL Editor

-- Primeiro, desabilite RLS temporariamente para permitir acesso da aplicação
-- Suas políticas serão controladas pela aplicação NextJS, não pelo Supabase Auth

-- OPÇÃO 1: Desabilitar RLS e controlar segurança via aplicação (Mais simples)
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE auto_sell_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE auto_sell_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE free_pack_grants DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE limited_editions DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE pack_openings DISABLE ROW LEVEL SECURITY;
ALTER TABLE pack_probabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_item_protections DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- NOTA: Com RLS desabilitado, sua aplicação NextJS/Prisma 
-- controlará toda a segurança de acesso aos dados.
-- Certifique-se de que suas rotas API estão bem protegidas.

-- OPÇÃO 2: Se você quiser manter RLS ativo (mais complexo)
-- Você precisaria criar policies baseadas em um campo customizado
-- Como um session token ou user ID passado via RPC.
-- Isso requer modificações mais significativas na sua aplicação.