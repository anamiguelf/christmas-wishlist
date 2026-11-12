# Christmas Wishlist

Projeto inicial de uma lista de Natal com:
- lista pública de presentes;
- reserva através da função `reserve_product`;
- nome do convidado opcional, visível apenas na área de administração;
- login de administrador por Supabase Auth;
- adicionar, editar e apagar presentes.

## 1. Configurar as credenciais

1. Copia `.env.example` para um ficheiro chamado `.env`.
2. Preenche `VITE_SUPABASE_URL` com o URL do teu projeto Supabase.
3. Preenche `VITE_SUPABASE_ANON_KEY` com a chave publicável (`sb_publishable_...`) do projeto.
4. Não coloques aqui uma `service_role` key nem uma chave secreta.

## 2. Instalar e executar

É necessário ter Node.js instalado.

```bash
npm install
npm run dev
```

Abre o endereço local apresentado pelo terminal.

## 3. Criar uma versão para publicação

```bash
npm run build
```

A pasta `dist` contém a versão pronta para alojar num serviço como Vercel ou Netlify.

## 4. Notas importantes

- O código pressupõe que as tabelas `products`, `admin_users` e `reservations` e a função `reserve_product(uuid,text)` já existem no Supabase.
- O painel usa a função `is_admin()` para verificar a conta autenticada.
- As imagens são adicionadas através de um URL público no campo `image_url`; o upload direto para Storage ainda não está incluído.
- A publicação online não está feita por este ZIP. É necessário configurar as variáveis de ambiente no serviço de alojamento.
- Antes de partilhar o link público, testar uma reserva real e confirmar as políticas de segurança.

## Nota sobre o visual

O hero está com um fundo quente em tons de castanho/bordô como base. A fotografia de lareira pode ser adicionada depois, substituindo o fundo no ficheiro `src/style.css`.
