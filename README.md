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
- No fluxo do cliente, o login será solicitado depois da escolha do serviço e do horário, antes da confirmação.
- O dono ou gerente administrará a barbearia e terá acesso geral ao painel; profissionais terão acesso restrito à própria agenda.
- Essas regras estão definidas para o produto, mas autenticação, contas e persistência ainda não foram implementadas.

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

### Comandos disponíveis

```bash
npm run dev    # inicia o servidor de desenvolvimento
npm run lint   # verifica problemas de lint
npm run build  # gera a versão de produção
npm run start  # inicia a versão de produção
```

## Princípios do projeto

- Separar a cobrança da assinatura do SaaS dos pagamentos dos serviços.
- Não armazenar dados de cartão; usar páginas ou componentes seguros do provedor.
- Validar pagamentos por notificações assinadas do provedor, sem confiar apenas no retorno do navegador.
- Projetar o processamento de notificações para lidar com reenvios sem duplicar efeitos.
- Manter claras para a barbearia e para o cliente as regras, os valores e o status de cada pagamento.
- Implementar funcionalidades em etapas pequenas, com validação, testes e histórico de alterações no Git.

## Status

O repositório já contém uma interface demonstrativa do fluxo público de agendamento, incluindo seleção de serviço, data e horário, formulário de dados do cliente e tela de conclusão. Essa demonstração não cria nem salva agendamentos.

Ainda precisam ser implementados: autenticação e contas, painel administrativo, banco de dados, disponibilidade real, persistência de agendamentos e integrações de pagamento. As decisões registradas neste README descrevem o produto planejado, não funcionalidades já disponíveis.
