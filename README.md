# SaaS de agendamento e cobrança

Aplicação web para ajudar barbearias a organizar serviços, horários, agendamentos e pagamentos em um só lugar.

O produto será desenvolvido inicialmente para o mercado brasileiro (BRL), com foco em uma experiência confiável tanto para quem administra a barbearia quanto para quem agenda um atendimento.

## Problema

Barbearias precisam conciliar agenda, informações de serviços, clientes e pagamentos. O objetivo deste projeto é reduzir o trabalho manual e oferecer um processo de agendamento claro, do horário disponível até o registro do pagamento.

## Público inicial

- **Barbearias e profissionais:** cadastram serviços, organizam a agenda e acompanham agendamentos e pagamentos.
- **Clientes:** consultam serviços e horários disponíveis e solicitam um agendamento.

## Escopo do MVP

A primeira versão deve validar o fluxo principal de agendamento:

- criação da conta da barbearia e acesso ao painel administrativo;
- cadastro da barbearia, profissionais e serviços;
- configuração de horários e disponibilidade;
- página pública para clientes consultarem serviços e horários, com conta obrigatória para confirmar o agendamento;
- criação, confirmação, cancelamento e acompanhamento de agendamentos;
- registro do método e status de pagamento;
- experiência responsiva para celular e desktop.

Os pagamentos online serão integrados depois que as regras de agendamento estiverem definidas. O MVP não deve armazenar dados de cartão: os dados de pagamento devem ser tratados pelo provedor escolhido.

## Contas e autenticação

- A barbearia terá uma conta para acessar o painel e administrar sua operação.
- O cliente precisará de uma conta para confirmar um agendamento e consultar seu histórico e próximos horários.
- Cada profissional terá uma conta para acessar sua própria agenda e consultar os clientes e horários dos atendimentos atribuídos a ele.
- O login com Google é a primeira opção planejada para barbearias e clientes; outros provedores poderão ser avaliados depois.
- O cadastro e o login por e-mail e senha também estão disponíveis; senhas precisam ter entre 8 e 128 caracteres e são confirmadas no cadastro.
- O envio de e-mails de verificação e de recuperação de senha ainda não está configurado.
- No fluxo do cliente, o login será solicitado depois da escolha do serviço e do horário, antes da confirmação.
- O dono ou gerente administrará a barbearia e terá acesso geral ao painel; profissionais terão acesso restrito à própria agenda.
- O fluxo demonstrativo exige login antes de exibir a etapa final, mas ainda não cria nem salva agendamentos.
- A proteção definitiva da confirmação deverá validar a sessão no servidor junto com a gravação do agendamento.

## Fluxo administrativo do MVP

### Primeira configuração da barbearia

1. O dono cria uma conta e acessa o painel.
2. Cadastra os dados da barbearia.
3. Adiciona os profissionais e os serviços oferecidos.
4. Define quais serviços cada profissional atende.
5. Configura os horários de trabalho e as folgas de cada profissional.
6. Cria ou convida as contas dos profissionais para que acessem suas agendas.
7. Revisa a página pública e compartilha o link de agendamento com os clientes.

### Operação diária

- O painel apresenta a agenda por dia e permite filtrar por profissional.
- O dono ou gerente pode criar, consultar, alterar e cancelar agendamentos.
- Cada profissional pode consultar somente os agendamentos da própria agenda, com os dados necessários para realizar o atendimento.
- Cada profissional tem sua própria disponibilidade; o cliente poderá escolher um profissional específico ou pedir o primeiro disponível.
- Depois de selecionar serviço, profissional (ou qualquer disponível), data e horário, o cliente entra com sua conta antes de confirmar.
- A confirmação será imediata quando o horário ainda estiver disponível; o sistema deve validar novamente a disponibilidade ao salvar para evitar reservas duplicadas.
- O painel permite registrar o pagamento do atendimento, inclusive quando recebido presencialmente.

Esse é o fluxo inicial planejado, não uma descrição de funcionalidades já existentes. Regras detalhadas de cancelamento, exceções de horário, notificações e permissões ainda precisam ser definidas.

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

A hipótese atual é oferecer um período de teste gratuito antes de cobrar a barbearia por uma assinatura. Ainda está em aberto se o produto será comercializado por assinatura ou como um site/serviço vendido diretamente. Se a assinatura for mantida, a duração do teste, a exigência e o momento de cadastro do cartão ainda precisam ser definidos. Essa cobrança seria recebida pela empresa responsável pelo SaaS.

### Pagamento dos serviços da barbearia

O cliente poderá pagar online ou presencialmente. A plataforma não cobrará comissão sobre o valor do serviço. Isso não elimina eventuais tarifas cobradas pelo provedor de pagamento ou pela adquirente da barbearia.

Métodos previstos:

- **Online:** Pix e cartão de crédito; cartão de débito poderá ser habilitado se o provedor e o fluxo escolhido oferecerem suporte adequado.
- **Presencial:** dinheiro ou cartão na maquininha da barbearia. O sistema registra o método e o status, mas não processa o cartão presencial no MVP.

**Provedor inicial a avaliar: Mercado Pago.** É a primeira opção a validar para os pagamentos brasileiros, considerando Pix e cartões. Antes de implementar, confirmar os requisitos atuais para pagamentos de terceiros, conexão da conta de cada barbearia, repasses, tarifas, reembolsos, webhooks e cobrança recorrente da assinatura. Se um único provedor não atender bem aos dois fluxos, a cobrança da assinatura e os pagamentos dos serviços poderão usar provedores diferentes.

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

## Tecnologias

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL](https://www.postgresql.org/) e [Prisma ORM](https://www.prisma.io/)

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

### Comandos disponíveis

```bash
npm run dev    # inicia o servidor de desenvolvimento
npm run lint   # verifica problemas de lint
npm run build  # gera a versão de produção
npm run start  # inicia a versão de produção
npm run db:validate  # valida o esquema Prisma
npm run db:studio    # abre a interface local do Prisma Studio
npx auth secret      # gera um segredo para configurar em BETTER_AUTH_SECRET
```

## Princípios do projeto

- Separar a cobrança da assinatura do SaaS dos pagamentos dos serviços.
- Não armazenar dados de cartão; usar páginas ou componentes seguros do provedor.
- Validar pagamentos por notificações assinadas do provedor, sem confiar apenas no retorno do navegador.
- Projetar o processamento de notificações para lidar com reenvios sem duplicar efeitos.
- Manter claras para a barbearia e para o cliente as regras, os valores e o status de cada pagamento.
- Implementar funcionalidades em etapas pequenas, com validação, testes e histórico de alterações no Git.

## Status

O repositório já contém uma interface demonstrativa do fluxo público de agendamento, incluindo seleção de serviço, data e horário. O formulário e a tela de conclusão só aparecem para usuários autenticados; a demonstração ainda não cria nem salva agendamentos.

Foi iniciado o modelo PostgreSQL com Prisma para contas, barbearias, profissionais, serviços, disponibilidade, agendamentos e pagamentos. O cadastro e login com e-mail e senha, o login com Google e a proteção de `/dashboard` estão implementados com Better Auth. Usuários autenticados podem atualizar o nome e telefone e consultar no painel os próprios agendamentos e pagamentos registrados. No fluxo demonstrativo, nome e e-mail são lidos da conta; o telefone brasileiro é solicitado uma vez, validado pelo formato/DDD e salvo no perfil. A validação de formato não confirma que a linha existe ou pertence ao cliente; isso exigirá OTP por SMS ou WhatsApp. A página inicial mostra o nome da conta e oferece atalhos para essas áreas. O provedor Google exige credenciais OAuth configuradas.

Ainda precisam ser implementados: confirmação e gravação de agendamentos pelo fluxo público, disponibilidade em tempo real, autorização por papel e barbearia, onboarding, painel administrativo, proteção contra reservas concorrentes e integrações de pagamento. Até esses fluxos existirem, as seções de agenda, histórico e pagamentos podem estar vazias. As decisões registradas neste README descrevem o produto planejado, não funcionalidades já disponíveis.
