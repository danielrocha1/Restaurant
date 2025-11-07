Relatório Técnico — Backend Go (Restaurant)
===========================================

Data: 2025-11-06
Repositório: Restaurant
Branch: main

Objetivo
--------
Relatório focado exclusivamente no backend Go do projeto: análise de arquitetura, rotas, modelos, handlers, segurança, operações e recomendações de correção.

Sumário
-------
1. Visão geral do backend
2. Lista de endpoints Go
3. Principais modelos e relações (GORM)
4. Achados críticos (segurança e bugs)
5. Problemas funcionais e inconsistências
6. Boas práticas e melhorias recomendadas
7. Checklist de correções imediatas
8. Como validar localmente
9. Arquivos relevantes

1) Visão geral do backend
-------------------------
- Linguagem: Go
- Framework HTTP: Fiber v2
- ORM: GORM (Postgres driver)
- WebSocket: Gorilla WebSocket adaptado para Fasthttp
- Estrutura: código em `go/src/` (main.go, handlers/, models/, database/, broadcast/)

2) Endpoints (método + caminho)
--------------------------------
- GET /
- ALL /ws  (WebSocket)

Produtos
- GET /produtos
- GET /produtos/:id
- POST /produtos
- PUT /produtos/:id
- DELETE /produtos/:id
- GET /produtos-lists
- GET /produtos-list
- GET /produtos-list/admin

Categorias
- GET /categorias
- GET /categoriassub
- GET /categorias/:id
- POST /categorias
- PUT /categorias/:id
- DELETE /categorias/:id

Pedidos (orders)
- GET /orders
- GET /orders/:id
- POST /orders
- PUT /orders/:id
- DELETE /orders/:id

Checkout / Mesas / Pagamento
- POST /checkout
- POST /tables/viewclose
- POST /tables/viewcloseondate
- POST /tables/view
- GET  /tables/isOpen
- POST /payment/

Rotas financeiras (prefixo `/api/finance`)
- POST /api/finance/daily-sales
- POST /api/finance/today-info
- POST /api/finance/top-items
- POST /api/finance/day-to-monthly
- POST /api/finance/health

3) Principais modelos e relações (GORM)
---------------------------------------
- models.Produto
  - Campos: ID, Active, Nome, Descricao, Preco, PrecoPromocional, Imagem, SubcategoriaID, Subcategoria
  - TableName(): "produtos"

- models.Order
  - Campos: ID, NomeLoja, MesaID, QRCode, Total (float64), Status, CreatedAt, Items []OrderItem

- models.OrderItem
  - Campos: ID, OrderID, ProdutoID, Quantidade, PrecoUnitario, Produto (relation)

- models.StatusTable
  - Campos: ID, Number, LastOrderAt, OpenedAt, ClosedAt, ServiceID, IsOpen
  - TableName(): "status_tables"

Observação: existem views SQL usadas pelos handlers (ex.: `view_pedidos_abertos_com_produtos_json`, `financial_metrics_view`) — verifique consistência entre colunas esperadas e os structs.

4) Achados críticos (prioridade alta)
-------------------------------------
Abaixo estão problemas que afetam segurança e estabilidade. Corrija imediatamente.
 
4.4 Endpoints sensíveis sem autenticação
- Rotas de criação/atualização/deleção não requerem middleware de autenticação.
- Ação: criar middleware JWT e aplicar apenas a rotas administrativas (POST/PUT/DELETE).
 

5) Problemas funcionais / bugs (prioridade média)
--------------------------------------------------
5.1 UpdateProduto (handlers/product.go)
- Uso combinado de unmarshal em struct e map, múltiplas queries redundantes e `return nil` em branch de erro.
- Ação: simplificar — usar DTOs, validar campos e usar `db.Model(&produto).Updates(updatesMap)` com cuidado.

5.4 Uso de AutoMigrate em produção
- `main.go` chama `AutoMigrate(...)` no startup. Em produção prefira migrações versionadas (golang-migrate).

5.5 Transações parcialmente inconsistentes
- Alguns handlers usam `tx := database.DB.WithContext(ctx).Begin()` mas depois consultam `database.DB` diretamente após commit. Preferir `tx` durante a transação e só usar `database.DB` fora.

6) Boas práticas e melhorias recomendadas
----------------------------------------
6.1 Input validation
- Usar `go-playground/validator` e DTOs para sanitizar entrada.

6.2 Logs estruturados e tracing
- Usar `zap` ou `logrus` para logs estruturados e OpenTelemetry para traces.

6.3 Testes e CI
- Adicionar testes unitários para handlers e integração com DB em pipeline (docker-compose para testes ou testcontainers).

6.4 Representação de dinheiro
- Migrar para `int64` centavos ou usar decimal library (shopspring/decimal).

6.5 Hardening WebSocket
- Validar Origin e implementar ping/pong, limites de leitura e escrita, e controle de buffer.

6.6 Migrations no CI/CD
- Remover AutoMigrate de startup e usar uma pipeline de migrações controladas (migrate/golang-migrate).

7) Checklist de correções imediatas (passo a passo)
---------------------------------------------------
1. Remover `go/.env` do git e adicionar `go/.env` em `.gitignore`.  //foi
2. Rotacionar senha do DB junto ao provedor (Neon/Postgres).
3. Mover `JWT` secret para env `JWT_SECRET` e atualizar código.  //foi
4. Corrigir log.Printf e remover c.JSON() de logs.
5. Proteger rotas sensíveis com middleware JWT.
6. Implementar validação HMAC para webhooks externos (pagamentos).
7. Adicionar deadlines e ping/pong no WebSocket.
8. Padronizar tipos monetários.
9. Substituir AutoMigrate por migrações versionadas.

8) Como validar localmente
--------------------------
- Rodar o backend:
  - Exportar env vars: `DATABASE_URL`, `JWT_SECRET`.
  - `cd go && go run ./src/main.go`
- Testar endpoints com `curl` ou Postman.
- Testar WebSocket via client apontando para `ws://localhost:4000/ws`.

9) Arquivos relevantes (Go)
---------------------------
- `go/src/main.go`
- `go/src/database/db.go`
- `go/src/handlers/*.go` (product.go, order.go, payments.go, checkout.go, category.go, financial.go, table.go)
- `go/src/models/*.go` (product.go, order.go, tables.go, etc.)
- `go/src/broadcast/broadcast.go`

10) Recomendações de prioridade para implementação
-------------------------------------------------
Prioridade alta (urgente): remover segredos, proteger rotas, corrigir logs errados, restringir CORS/CheckOrigin.
Prioridade média: padronizar tipos de dinheiro, implementar heartbeats WS, revisar transações.
Prioridade baixa: testes, observability avançada, migrações sofisticadas.

---

Se quiser, eu converto este Markdown para PDF agora e adiciono `report_go.pdf` na raiz do repositório. Preciso da sua confirmação para executar a conversão aqui (posso usar `pandoc` / `wkhtmltopdf` / headless Chrome). Deseja que eu gere o PDF agora? (Sim/Não)
