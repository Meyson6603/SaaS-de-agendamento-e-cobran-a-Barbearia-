# Navalha — SaaS de agendamento e cobrança

Aplicação web full-stack para barbearias organizarem serviços, horários, agendamentos, clientes e pagamentos em um só lugar.

O projeto foi desenvolvido para o mercado brasileiro, com valores em BRL e foco em uma experiência confiável para gestores, profissionais e clientes.

## Visão geral

O Navalha conecta a página pública de agendamento aos painéis internos da barbearia. O cliente escolhe um serviço, profissional, data e horário; o servidor revalida a disponibilidade, confirma o agendamento e cria o registro de pagamento. Gestores acompanham a operação, enquanto profissionais consultam apenas a própria agenda.

### Principais funcionalidades

- Autenticação por e-mail/senha e Google com Better Auth.
- Perfis de cliente, proprietário, gerente, profissional e administrador da plataforma.
- Cadastro de barbearias, profissionais, serviços e associações de serviço.
- Disponibilidade semanal, blocos de horários e exceções pontuais.
- Página pública de agendamento com disponibilidade real.
- Proteção contra reservas duplicadas com transação serializável.
- Cancelamento e remarcação de agendamentos futuros.
- Notificações internas para eventos de agenda e pagamentos.
- Registro de pagamentos presenciais em PIX, dinheiro e cartão.
- Checkout online com Mercado Pago e webhook assinado.
- Verificação OTP por e-mail com Resend e modo local para desenvolvimento.
- Endpoint de health check e headers HTTP de segurança.

## Problema

Barbearias precisam conciliar agenda, informações de serviços, clientes e pagamentos. O objetivo deste projeto é reduzir o trabalho manual e oferecer um processo de agendamento claro, do horário disponível até o registro do pagamento.

## Público inicial

- **Barbearias e profissionais:** cadastram serviços, organizam a agenda e acompanham agendamentos e pagamentos.
- **Clientes:** consultam serviços e horários disponíveis e solicitam um agendamento.

## Fluxos principais

### Cliente

1. Acessa a página pública da barbearia.
2. Seleciona serviço, profissional, data e horário.
3. Entra ou cria uma conta.
4. Informa o telefone de contato e confirma o e-mail com OTP.
5. Confirma o agendamento.
6. Consulta o agendamento, cancela/remarca ou inicia o pagamento online no dashboard.

### Gestão da barbearia

1. O administrador da plataforma cria a barbearia e vincula o proprietário.
2. O proprietário adiciona gerentes e profissionais verificados.
3. A equipe cadastra serviços, associa profissionais e configura horários.
4. O painel acompanha agenda, pagamentos, notificações e bloqueios pontuais.

## Escopo implementado

O MVP implementado contempla:

- cadastro administrativo da barbearia e atribuição de acesso ao proprietário;
- cadastro da barbearia, profissionais e serviços;
- configuração de horários e disponibilidade;
- página pública para clientes consultarem serviços e horários, com conta obrigatória para confirmar o agendamento;
- criação, confirmação, cancelamento e acompanhamento de agendamentos;
- registro do método e status de pagamento;
- experiência responsiva para celular e desktop.

Os dados de cartão nunca são armazenados pela aplicação; o checkout é processado pelo provedor de pagamento.

## Contas e autenticação

- A barbearia usa uma conta para acessar o painel e administrar sua operação.
- O cliente precisa de uma conta para confirmar um agendamento e consultar seu histórico e próximos horários.
- Cada profissional usa uma conta para acessar sua própria agenda e consultar os clientes e horários dos atendimentos atribuídos a ele.
- O login com Google está disponível para barbearias e clientes; outros provedores poderão ser avaliados depois.
- O cadastro e o login por e-mail e senha também estão disponíveis; senhas precisam ter entre 8 e 128 caracteres e são confirmadas no cadastro.
- O envio de e-mails de verificação e de recuperação de senha ainda não está configurado.
- Profissionais vinculados a uma conta podem consultar em `/profissional` os próprios agendamentos confirmados e os dados de contato necessários dos clientes.
- No fluxo do cliente, o login é solicitado depois da escolha do serviço e do horário, antes da confirmação.
- O dono ou gerente administrará a barbearia e terá acesso geral ao painel; profissionais terão acesso restrito à própria agenda.
- Clientes autenticados podem confirmar agendamentos em `/{slug}`; a confirmação valida a sessão, a disponibilidade e os dados do serviço no servidor.
- O telefone do cliente é salvo no perfil antes da confirmação. A posse da conta é confirmada por OTP enviado ao e-mail cadastrado.

## Fluxo administrativo do MVP

### Primeira configuração da barbearia

1. O proprietário cria e verifica sua conta.
2. O administrador da plataforma cadastra a barbearia e vincula a conta do proprietário.
3. O proprietário pode adicionar outros usuários já cadastrados como gerentes.
4. O proprietário e os gerentes vinculam profissionais que já tenham uma conta verificada.
5. Cadastram os serviços, associam cada serviço aos profissionais que o oferecem e definem a disponibilidade semanal.
6. Compartilham o link público `/{slug}` para os clientes consultarem serviços e horários.
7. Proprietários, gerentes e administradores podem cadastrar e remover bloqueios pontuais por profissional, com data, intervalo e motivo opcional.

### Operação diária

- O painel apresenta a agenda por dia e permite filtrar por profissional.
- O cliente agenda a partir dos serviços e horários publicados; proprietários, gerentes e profissionais consultam os agendamentos de acordo com seus acessos.
- Cada profissional pode consultar somente os agendamentos da própria agenda, com os dados necessários para realizar o atendimento.
- Cada profissional tem sua própria disponibilidade semanal; o cliente escolhe o profissional, data e horário.
- Depois de selecionar serviço, profissional, data e horário, o cliente entra com sua conta antes de confirmar.
- A confirmação valida novamente a disponibilidade dentro de uma transação serializável para evitar reservas duplicadas.
- O painel permite registrar o pagamento do atendimento, inclusive quando recebido presencialmente.
- O proprietário, gerente ou profissional responsável pode registrar pagamentos presenciais como PIX, dinheiro ou cartão; o valor usa o snapshot do serviço no momento do agendamento.
- Clientes, proprietários, gerentes e administradores podem cancelar ou remarcar agendamentos futuros até o início do atendimento.
- Cancelamentos e remarcações revalidam a disponibilidade no servidor e registram eventos no histórico do agendamento.
- O sistema registra notificações internas para confirmações, cancelamentos, remarcações e pagamentos recebidos.
- O checkout online usa o Mercado Pago para Pix e cartão; o pagamento é confirmado por webhook e permanece pendente até a confirmação do provedor.
- A confirmação do primeiro agendamento exige OTP por e-mail; códigos expiram em 10 minutos e têm limite de tentativas. O envio usa Resend, com uma opção explícita de modo local para testes sem provedor.

As regras de cancelamento, exceções de horário, notificações e pagamentos estão representadas no fluxo atual e devem ser revisadas juridicamente antes de um lançamento comercial.

### Conceitos de dados previstos

O modelo inicial deverá representar pelo menos:

- **Conta de usuário:** identidade de quem acessa, como dono/gerente ou cliente.
- **Barbearia:** negócio, dados públicos e configurações.
- **Profissional:** integrante da equipe, associado a uma conta de usuário com acesso restrito à própria agenda.
- **Serviço:** nome, duração, preço e estado ativo.
- **Serviço do profissional:** quais serviços cada profissional pode executar.
- **Disponibilidade:** horários regulares e exceções, como folgas e bloqueios.
- **Agendamento:** cliente, barbearia, profissional, serviço, início, fim e situação.
- **Pagamento do atendimento:** método, valor e estado, separado da assinatura da plataforma.
- **Assinatura da plataforma:** plano e situação comercial da conta da barbearia, caso o modelo por assinatura seja mantido.

Esses conceitos orientam a discussão; ainda não são um esquema de banco de dados definitivo.

## Pagamentos

Existem dois fluxos financeiros independentes:

### Assinatura do SaaS

A assinatura do SaaS permanece fora do MVP implementado. O modelo comercial, o período de teste e a cobrança recorrente ainda precisam ser definidos antes de uma versão comercial.

### Pagamento dos serviços da barbearia

O cliente poderá pagar online ou presencialmente. A plataforma não cobrará comissão sobre o valor do serviço. Isso não elimina eventuais tarifas cobradas pelo provedor de pagamento ou pela adquirente da barbearia.

Métodos previstos:

- **Online:** Pix e cartão de crédito; cartão de débito poderá ser habilitado se o provedor e o fluxo escolhido oferecerem suporte adequado.
- **Presencial:** dinheiro ou cartão na maquininha da barbearia. O sistema registra o método e o status, mas não processa o cartão presencial no MVP.

**Provedor integrado: Mercado Pago.** A integração atual cria o checkout para Pix e cartões, usa `external_reference` para vincular o pagamento ao agendamento e confirma o estado por webhook assinado. Repasses, tarifas, reembolsos e pagamentos em nome de terceiros devem ser confirmados com o provedor antes do lançamento.

Para pagamentos online dos serviços, a direção preferida é que o dinheiro seja recebido diretamente na conta conectada da barbearia, sem retenção pela plataforma e sem comissão do SaaS. Essa possibilidade e suas condições precisam ser confirmadas com o provedor antes de virar uma decisão técnica definitiva.

## Cancelamentos e reembolsos

As regras de agendamento, cancelamento e reembolso devem respeitar a legislação de defesa do consumidor aplicável no Brasil, incluindo o Código de Defesa do Consumidor. Antes do lançamento, os termos e os prazos deverão passar por revisão jurídica. O sistema deve deixar as regras visíveis ao cliente e registrar alterações e eventos relevantes do agendamento.

## Planos propostos

Valores e limites abaixo são hipóteses iniciais para discussão e validação com barbearias; não são preços finais.

| Plano | Preço sugerido | Para quem | Escopo inicial |
| --- | --- | --- | --- |
| **Solo** | R$ 39/mês | Profissional autônomo | 1 profissional, agenda, serviços, página pública e registro de pagamentos |
| **Barbearia** | R$ 89/mês | Barbearia pequena | Até 5 profissionais, gestão de equipe, agenda compartilhada e relatórios básicos |
| **Equipe** | R$ 159/mês | Barbearia em crescimento | Até 15 profissionais, permissões por perfil e relatórios avançados |

Os planos não incluem comissão sobre os serviços. Tarifas do provedor de pagamento, quando houver, são separadas da assinatura. Os limites, preços, duração do período de teste e recursos de cada plano devem ser validados antes de implementar a cobrança recorrente.

## Arquitetura

- **Interface:** componentes React no App Router do Next.js.
- **Servidor:** Server Actions para operações autenticadas e rotas de API para webhooks e health check.
- **Autorização:** Better Auth combinado com validações de papel e vínculo à barbearia no servidor.
- **Persistência:** PostgreSQL com Prisma ORM e migrations versionadas.
- **Integrações:** Resend para OTP por e-mail e Mercado Pago para checkout e confirmação de pagamentos.
- **Qualidade:** ESLint, TypeScript, Vitest e build Webpack do Next.js.

As regras de negócio ficam concentradas em `app/actions` e `lib`, enquanto as páginas e componentes cuidam da composição da experiência. O webhook do Mercado Pago consulta o pagamento diretamente no provedor, atualiza o registro local de forma idempotente e dispara a notificação interna apenas uma vez.

## Tecnologias

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL](https://www.postgresql.org/) e [Prisma ORM](https://www.prisma.io/)
- [Better Auth](https://www.better-auth.com/)
- [Resend](https://resend.com/)
- [Mercado Pago](https://www.mercadopago.com.br/)
- [Vitest](https://vitest.dev/)

## Começando

### Pré-requisitos

- Node.js compatível com a versão do Next.js usada pelo projeto;
- npm.

### Instalação e execução

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Banco de dados

O projeto usa PostgreSQL hospedado no Neon com Prisma. Para configurar o banco:

1. Crie um projeto PostgreSQL no Neon.
2. Copie `.env.example` para `.env` e configure `DATABASE_URL` com a conexão pooled do Neon e `DIRECT_URL` com a conexão direta. A aplicação usa `DATABASE_URL`; migrações usam `DIRECT_URL`.
3. Nunca compartilhe nem versione o arquivo `.env`.
4. Gere o cliente e aplique as migrações:

```bash
npm run db:generate
npm run db:migrate
```

O esquema inicial fica em `prisma/schema.prisma`. `npm run db:migrate` precisa de uma instância Neon acessível e de uma `DIRECT_URL` válida.

### Login com Google

1. Gere um segredo local com `npx auth secret` e salve o valor como `BETTER_AUTH_SECRET` no `.env`.
2. Crie credenciais OAuth no Google Cloud Console e configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`.
3. Configure como URI de redirecionamento autorizada `http://localhost:3000/api/auth/callback/google`.
4. Mantenha `BETTER_AUTH_URL=http://localhost:3000` no desenvolvimento. Em produção, use o domínio HTTPS publicado e cadastre a URI de retorno correspondente no Google.

O arquivo `.env.example` lista todas as variáveis esperadas. Nunca compartilhe nem versione segredos ou credenciais OAuth.

### Administração da plataforma

O painel global fica em `/admin` e exige uma sessão autenticada com e-mail verificado listado em `PLATFORM_ADMIN_EMAILS`. Configure um ou mais endereços no `.env`, separados por vírgula. Administradores da plataforma também podem acessar `/gerencia` e selecionar qualquer barbearia, sem que isso altere seus papéis de proprietário ou gerente.

O painel apresenta indicadores agregados e listas de barbearias e usuários. Na área de barbearias, o administrador pode cadastrar uma barbearia e atribuir o primeiro proprietário a uma conta existente e verificada. Edição, suspensão ou exclusão ainda não estão disponíveis. A tela de configurações exibe apenas o estado de configuração, nunca valores secretos.

### Painel da barbearia

O painel de gestão fica em `/gerencia` e exige uma sessão autenticada. Proprietários e gerentes veem apenas barbearias às quais estão vinculados. Administradores da plataforma podem selecionar e acompanhar todas as barbearias. O administrador cadastra a barbearia e atribui o primeiro vínculo `OWNER` a uma conta existente e verificada; proprietários ou administradores podem adicionar contas existentes e verificadas como `MANAGER`. Convites por e-mail ainda não estão configurados.

O painel mostra indicadores, próximos atendimentos e permite consultar/adicionar gerentes, profissionais, serviços e horários semanais. Profissionais precisam ter uma conta verificada preexistente. Os horários são recorrentes, e as opções públicas são geradas em intervalos de 15 minutos para os próximos 14 dias. Proprietários, gerentes e administradores podem editar e ativar ou desativar profissionais e serviços; horários semanais podem ser editados ou removidos. Bloqueios pontuais podem ser cadastrados por profissional com data, intervalo e motivo opcional; eles impedem novas reservas que tenham conflito. Usuários sem vínculo de gestão veem uma mensagem informando que devem solicitar acesso ao administrador.

O link público usa o identificador da barbearia, por exemplo `/{slug}`. O endereço `/` redireciona para a única barbearia cadastrada ou mostra a lista quando há várias. Ao confirmar, o sistema salva o agendamento e um registro de pagamento pendente; nenhum pagamento é processado.

Profissionais com vínculo `PROFESSIONAL` e perfil associado podem acessar `/profissional` para consultar, com paginação, os agendamentos confirmados em andamento ou futuros dos próprios perfis profissionais e os dados de contato dos clientes. Administradores da plataforma também podem acessar a página e selecionar qualquer perfil profissional. O acesso é validado no servidor; usuários sem perfil profissional associado recebem uma orientação para solicitar o vínculo ao proprietário ou gerente.

### Comandos disponíveis

```bash
npm run dev    # inicia o servidor de desenvolvimento
npm run lint   # verifica problemas de lint
npm test       # executa os testes automatizados
npm run test:watch  # executa os testes em modo observação
npm run build  # gera a versão de produção
npm run start  # inicia a versão de produção
npm run db:validate  # valida o esquema Prisma
npm run db:studio    # abre a interface local do Prisma Studio
npx auth secret      # gera um segredo para configurar em BETTER_AUTH_SECRET
```

### Deploy e operação

Antes de publicar:

1. Configure as variáveis de `.env.example` no ambiente de produção, usando um `BETTER_AUTH_URL` e `APP_URL` HTTPS.
2. Use `OTP_DEV_MODE=false` e configure `RESEND_API_KEY` e `EMAIL_FROM`.
3. Configure `MERCADOPAGO_WEBHOOK_SECRET` e registre `/api/payments/mercadopago/webhook` no provedor.
4. Execute `npx prisma migrate deploy` no banco de produção.
5. Valide `GET /api/health`, que retorna `200` somente quando o banco está acessível.
6. Confirme o fluxo de login, agendamento, OTP e retorno do checkout antes de liberar o link público.

O endpoint de saúde não expõe credenciais nem dados da aplicação. Em caso de indisponibilidade do banco, responde `503` para que plataformas de deploy e monitores possam detectar a falha.

Os testes automatizados também cobrem os estados saudável e indisponível desse endpoint, sem depender de uma conexão real com o banco.

## Princípios do projeto

- Separar a cobrança da assinatura do SaaS dos pagamentos dos serviços.
- Não armazenar dados de cartão; usar páginas ou componentes seguros do provedor.
- Validar pagamentos por notificações assinadas do provedor, sem confiar apenas no retorno do navegador.
- Projetar o processamento de notificações para lidar com reenvios sem duplicar efeitos.
- Manter claras para a barbearia e para o cliente as regras, os valores e o status de cada pagamento.
- Implementar funcionalidades em etapas pequenas, com validação, testes e histórico de alterações no Git.

## Rotas principais

| Rota | Finalidade |
| --- | --- |
| `/` | Lista ou redireciona para a barbearia disponível |
| `/{slug}` | Página pública de agendamento |
| `/dashboard` | Agenda, pagamentos e notificações do cliente |
| `/gerencia` | Gestão da equipe, serviços, horários e operação |
| `/profissional` | Agenda restrita do profissional |
| `/admin` | Administração global da plataforma |
| `/api/health` | Health check da aplicação e do banco |
| `/api/payments/mercadopago/webhook` | Recebimento de atualizações de pagamento |

## Qualidade e validação

Os testes automatizados cobrem validação de telefone brasileiro, redirecionamentos seguros, mapeamento de status do Mercado Pago e os estados do health check. A aplicação também é validada com lint, verificação do schema Prisma e build de produção.

```bash
npm test
npm run lint
npm run db:validate
npx next build --webpack
```

## Status do projeto

O fluxo principal está implementado e validado localmente: o agendamento consulta disponibilidade real, exige autenticação e OTP por e-mail, grava o registro no PostgreSQL e cria o pagamento pendente. O gerenciamento da equipe, serviços, horários, cancelamentos, remarcações, notificações e pagamentos está disponível nos painéis correspondentes.

Para um ambiente público, ainda é necessário configurar credenciais reais, domínio HTTPS, entrega de e-mail e contas compatíveis de teste/produção do Mercado Pago. O projeto não realiza cobrança da assinatura do SaaS e não automatiza reembolsos; essas regras dependem da definição comercial e jurídica do produto.

## Próximos passos

- Publicar uma instância de demonstração com domínio HTTPS.
- Configurar contas de teste compatíveis do Mercado Pago.
- Adicionar recuperação de senha e e-mails transacionais adicionais.
- Definir planos, assinatura do SaaS e política de reembolso.
- Expandir testes de integração para Server Actions e webhooks.
