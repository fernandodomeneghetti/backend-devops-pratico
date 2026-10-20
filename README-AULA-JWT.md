# 🔐 Adicionando autenticação JWT à API do projeto `tempo/backend-devops-pratico/`

## 🎯 Objetivo
Este guia adiciona **autenticação com JWT (JSON Web Token)** à API que está na pasta **`tempo/backend-devops-pratico/`** deste repositório — o estágio mais recente do projeto em camadas (Controller → Service → Repository → Model), já com Swagger (`swagger-jsdoc`) documentando as rotas, como descrito em `README-SWAGGER.md`. É o item 2 dos "Próximos passos" listados em `README-CAMADAS.md`.

Ao final deste guia, a API terá:
- Uma rota **pública** de cadastro (`POST /api/usuarios`), que agora exige `email` e `senha`.
- Uma rota **pública** de login (`POST /api/auth/login`), que devolve um token JWT.
- As demais rotas de usuário (`GET`, `PUT`, `DELETE`) **protegidas**: só respondem se a requisição enviar um token JWT válido.

> ⚠️ Todos os comandos deste guia devem ser executados com o terminal **dentro da pasta `tempo/backend-devops-pratico/`**. Antes de começar, rode:
> ```bash
> cd tempo/backend-devops-pratico
> ```

## 📂 Sobre qual código este guia trabalha
Hoje `src/models/Usuario.ts` só tem `id` e `nome` — não existe nada que sirva como credencial (nem `email`, nem `senha`). Não dá para autenticar um usuário que não tem como provar quem ele é, então a primeira mudança deste guia é justamente adicionar essas duas colunas ao model.

A pasta `tempo/backend-devops-pratico/` está organizada assim hoje:
```
tempo/backend-devops-pratico/
├── database.sqlite
├── requests/
│   └── usuario.rest
├── src/
│   ├── index.ts                       # cria o app Express, conecta no banco, monta Swagger UI e as rotas
│   ├── config/
│   │   ├── database.ts
│   │   └── swagger.ts                 # especificação OpenAPI gerada com swagger-jsdoc
│   ├── routes/
│   │   └── usuarioRoutes.ts           # rotas + comentários @swagger
│   ├── controllers/usuarioController.ts
│   ├── services/usuarioService.ts
│   ├── repositories/usuarioRepository.ts
│   └── models/Usuario.ts
```
Em `src/index.ts`, o servidor sobe assim hoje:
```ts
import express from "express";
import usuarioRoutes from "./routes/usuarioRoutes";
import { connectDatabase } from "./config/database";

import swaggerUi from "swagger-ui-express";
import {swaggerSpec} from "./config/swagger";

const app = express();
const PORT = 3002;

app.use(express.json());
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/usuarios", usuarioRoutes);

const startServer = async ()=> {
    await connectDatabase()
    app.listen(PORT, () => { console.log("servidor rodando") });
};

startServer();
```
Repare que a API já roda na porta **3002** (não 3000) — todos os exemplos deste guia usam essa porta.

Ao final deste guia, o projeto ganha três peças novas:
```
tempo/backend-devops-pratico/
├── .env                                # (novo) segredo do JWT — NÃO vai para o git
├── src/
│   ├── config/
│   │   └── jwt.ts                      # (novo) segredo e tempo de expiração do token
│   ├── middlewares/
│   │   └── authMiddleware.ts           # (novo) verifica o token em rotas protegidas
│   ├── controllers/
│   │   └── authController.ts           # (novo) recebe email/senha e devolve o token
│   ├── routes/
│   │   └── authRoutes.ts               # (novo) POST /api/auth/login
```

## 1) O que é JWT
- **JWT (JSON Web Token)** é um token assinado digitalmente, composto por três partes separadas por ponto: `header.payload.signature` (ex: `eyJhbGci...eyJpZCI6...SflKxw...`).
- O **payload** carrega dados (aqui, o `id` e o `email` do usuário) — mas não é criptografado, só codificado em Base64. **Nunca coloque senha ou dado sensível dentro do payload**, qualquer um consegue decodificar e ler.
- A **signature** é o que garante que o token não foi alterado: ela é gerada com uma chave secreta (`JWT_SECRET`) que só o servidor conhece. Se alguém tentar editar o payload manualmente, a assinatura não bate mais e o servidor rejeita o token.
- É uma autenticação **stateless**: o servidor não guarda sessão em memória nem em banco — ele só verifica a assinatura do token a cada requisição. Isso é diferente de autenticação por sessão (cookie + `session store`).
- O cliente envia o token em todas as requisições protegidas, no cabeçalho HTTP:
  ```
  Authorization: Bearer <token>
  ```

## 📦 Pré-requisitos
- Você já seguiu o `README.md` deste projeto e o `README-SWAGGER.md`, e o projeto roda com `npm run dev` sem erros, com `/api/docs` respondendo em `http://localhost:3002/api/docs`.
- Node.js e npm instalados.

## 2) Instalar as dependências
Com o terminal dentro de `tempo/backend-devops-pratico/`, rode:
```bash
npm install jsonwebtoken bcryptjs dotenv
npm install -D @types/jsonwebtoken @types/bcryptjs
```
O que cada pacote faz:
- `jsonwebtoken`: cria (`sign`) e verifica (`verify`) tokens JWT.
- `bcryptjs`: gera o **hash** da senha antes de salvar no banco, e depois compara uma senha em texto puro com o hash salvo. Nunca se guarda a senha original no banco.
- `dotenv`: lê variáveis de ambiente de um arquivo `.env` e as coloca em `process.env`, para o segredo do JWT não ficar escrito direto no código-fonte.
- `@types/jsonwebtoken` e `@types/bcryptjs` (com `-D`, como dependência de desenvolvimento): tipos TypeScript dessas bibliotecas.

## 3) Adicionar `email` e `senha` ao model `Usuario`
Abra `src/models/Usuario.ts`. Hoje ele só tem `nome`. Adicione `email` e `senha`:
```ts
import {DataTypes, Model} from "sequelize";
import {sequelize} from "../config/database";

export interface UsuarioAttributes {
    id?: number;
    nome: string;
    email: string;
    senha: string;
}

export class Usuario 
    extends Model<UsuarioAttributes>
    implements UsuarioAttributes {
        public id!: number;
        public nome!: string;
        public email!: string;
        public senha!: string;
}

Usuario.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false
    },
},
{
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios'
});
```

> ⚠️ **Importante**: o arquivo `database.sqlite` já existe nesta pasta, com a tabela `usuarios` antiga (só `id`/`nome`). O `sequelize.sync()` usado em `connectDatabase` **não adiciona colunas em tabelas que já existem**. Apague o arquivo antes de testar este guia:
> ```bash
> rm database.sqlite
> ```
> Na próxima vez que o servidor subir, a tabela é recriada já com `email` e `senha` (e você perde os usuários de teste cadastrados até agora — tudo bem, é só dado de aula).

## 4) Criar o arquivo de segredo do JWT
### 4.1) Criar o `.env`
Na raiz de `tempo/backend-devops-pratico/` (mesmo nível do `package.json`), crie um arquivo `.env`:
```
JWT_SECRET=troque-por-uma-string-longa-e-aleatoria
```
Esse arquivo **não deve ir para o git** — confira que o `.gitignore` já tem a linha `.env` (ela já existe hoje, então não precisa mexer).

### 4.2) Criar `src/config/jwt.ts`
```ts
export const JWT_SECRET = process.env.JWT_SECRET || "segredo-apenas-para-desenvolvimento";
export const JWT_EXPIRES_IN = "1h";
```
- `JWT_SECRET`: a chave usada para assinar e verificar os tokens. Vem do `.env`; o valor depois do `||` é só uma rede de segurança para não quebrar em desenvolvimento caso alguém esqueça de criar o `.env` — **nunca confie nesse valor padrão em produção**.
- `JWT_EXPIRES_IN`: por quanto tempo o token continua válido depois de emitido. Depois de `"1h"`, o mesmo token passa a ser rejeitado mesmo que a assinatura esteja correta.

### 4.3) Carregar o `.env` antes de tudo, em `src/index.ts`
O `process.env.JWT_SECRET` só existe depois que o `dotenv` carrega o `.env`. Como `src/config/jwt.ts` lê `process.env.JWT_SECRET` assim que é importado, o carregamento do `dotenv` precisa acontecer **antes de qualquer outro import** em `src/index.ts` — por isso ele vai na primeira linha do arquivo (passo 10).

## 5) Atualizar o Repository: buscar usuário por email
O login precisa localizar o usuário pelo `email` (não pelo `id`). Abra `src/repositories/usuarioRepository.ts` e adicione o método `findByEmail`. Aproveite para excluir a coluna `senha` de `findAll`/`findById`, já que essas duas rotas são de listagem/consulta e nunca deveriam devolver o hash da senha:
```ts
import {Usuario, UsuarioAttributes} from "../models/Usuario";

export class UsuarioRepository {
    async findAll(): Promise<Usuario[]> {
        return await Usuario.findAll({ attributes: { exclude: ["senha"] } });
    }

    async findById(id: number): Promise<Usuario | null> {
        return await Usuario.findByPk(id, { attributes: { exclude: ["senha"] } });
    }

    async findByEmail(email: string): Promise<Usuario | null> {
        return await Usuario.findOne({ where: { email } });
    }

    async create(usuarioData: Omit<UsuarioAttributes, "id">):
        Promise<Usuario> {
            return await Usuario.create(usuarioData);
    }

    async update(id:number, 
        usuarioData: Partial<UsuarioAttributes>)
            :Promise<Usuario | null> {
                const currentUser = await this.findById(id);
                if (!currentUser) return null;

                await currentUser.update(usuarioData);
                return currentUser;
    }

    async delete(id:number): Promise<boolean> {
        const result = await Usuario.destroy({where: {id}});
        return result > 0;
    }
}
```
`findByEmail` continua trazendo a `senha` (com o hash) de propósito — é dela que o login precisa para comparar com a senha digitada. Já `findAll`/`findById` excluem a coluna porque servem para exibir dados, não para autenticar.

## 6) Atualizar o Service: cadastro com senha criptografada + login
Abra `src/services/usuarioService.ts`:
```ts
import {UsuarioRepository} 
    from "../repositories/usuarioRepository";
import {UsuarioAttributes} from "../models/Usuario";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/jwt";

export class UsuarioService {
    private usuarioRepository : UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    async getAllUsuarios() {
        return await this.usuarioRepository.findAll();
    }

    async getUsuarioById(id: number) {
        const usuario = await this.usuarioRepository.findById(id);
        if (!usuario) {
            throw new Error("Usuário não encontrado");
        }

        return usuario;
    }

    async createUsuario(usuarioData: Omit<UsuarioAttributes, "id">) {
        const senhaCriptografada = await bcrypt.hash(usuarioData.senha, 10);
        const usuario = await this.usuarioRepository.create({
            ...usuarioData,
            senha: senhaCriptografada,
        });

        const { senha, ...usuarioSemSenha } = usuario.toJSON();
        return usuarioSemSenha;
    }

    async autenticar(email: string, senha: string) {
        const usuario = await this.usuarioRepository.findByEmail(email);
        if (!usuario) {
            throw new Error("Email ou senha inválidos");
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            throw new Error("Email ou senha inválidos");
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return { token };
    }

    // TODO: Criar a service de update e delete
}
```
O que não é óbvio:
- `bcrypt.hash(usuarioData.senha, 10)`: gera o hash da senha antes de salvar. O `10` é o "custo" (`salt rounds`) — quanto maior, mais lento (e mais seguro) fica gerar/verificar o hash. `10` é um valor padrão razoável.
- `usuario.toJSON()` seguido de `const { senha, ...usuarioSemSenha }`: `usuario` é uma instância do Sequelize, não um objeto simples — `toJSON()` converte para um objeto plano para então remover a `senha` com desestruturação. Sem isso, `POST /api/usuarios` devolveria o hash da senha na resposta, o que nunca deveria acontecer, mesmo sendo "só" um hash.
- `autenticar` lança a **mesma mensagem** (`"Email ou senha inválidos"`) tanto para email inexistente quanto para senha errada. Isso é proposital: se as mensagens fossem diferentes ("email não encontrado" vs "senha errada"), um atacante conseguiria descobrir quais emails estão cadastrados só testando o login (enumeração de usuários).
- `jwt.sign(payload, JWT_SECRET, { expiresIn })`: gera o token. O `payload` (`{ id, email }`) fica visível para quem tiver o token — de novo, nunca coloque a senha aqui.

## 7) Criar o `AuthController` e a rota de login
### 7.1) `src/controllers/authController.ts`
```ts
import { Request, Response } from "express";
import { UsuarioService } from "../services/usuarioService";

export class AuthController {
    private usuarioService: UsuarioService;

    constructor() {
        this.usuarioService = new UsuarioService();
    }

    async login(req: Request, res: Response): Promise<Response> {
        try {
            const { email, senha } = req.body;
            const resultado = await this.usuarioService.autenticar(email, senha);
            return res.status(200).json(resultado);
        } catch (error) {
            return res.status(401).json({ message: (error as Error).message });
        }
    }
}
```

### 7.2) `src/routes/authRoutes.ts`
```ts
import { Router } from "express";
import { AuthController } from "../controllers/authController";

const router = Router();
const authController = new AuthController();

router.post("/login", (req, res) => authController.login(req, res));

export default router;
```

## 8) Criar o middleware que protege as rotas
Crie a pasta e o arquivo `src/middlewares/authMiddleware.ts`:
```bash
mkdir src/middlewares
```
```ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";

export interface RequestAutenticado extends Request {
    usuarioId?: number;
}

export function authMiddleware(req: RequestAutenticado, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token não informado" });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Formato de token inválido" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
        req.usuarioId = payload.id;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
    }
}
```
O que não é óbvio:
- Um **middleware** do Express é uma função `(req, res, next)` que roda antes do controller da rota. Se ela chamar `next()`, a requisição segue adiante; se ela responder direto com `res.status(...).json(...)` (sem chamar `next()`), a requisição para ali — é assim que a rota fica "trancada" para quem não manda um token válido.
- `authHeader.split(" ")`: o cabeçalho chega no formato `"Bearer eyJhbGci..."` — uma string só. `split(" ")` separa em `["Bearer", "eyJhbGci..."]`; `scheme` deve ser exatamente `"Bearer"` e `token` é a segunda parte.
- `jwt.verify(token, JWT_SECRET)`: além de decodificar o payload, essa chamada **verifica a assinatura** e a **expiração** do token. Se qualquer uma delas falhar, ela lança uma exceção — por isso está dentro de um `try/catch`.
- `RequestAutenticado`: o `Request` padrão do Express não tem a propriedade `usuarioId`. Essa interface estende `Request` só para adicionar esse campo, permitindo que um Controller protegido saiba, mais adiante, qual usuário fez a requisição (`req.usuarioId`) sem precisar decodificar o token de novo.

## 9) Proteger as rotas de usuário (exceto o cadastro)
Abra `src/routes/usuarioRoutes.ts`. Hoje ele já tem comentários `@swagger` nas rotas `GET /`, `GET /:id` e `POST /` (do `README-SWAGGER.md`) — mantenha-os, só é preciso importar o middleware e usá-lo nas rotas que devem exigir token. O cadastro (`POST /`) continua **público** — é como um novo usuário se registra pela primeira vez, ele ainda não tem token:
```ts
import {Router} from "express";
import {UsuarioController} from "../controllers/usuarioController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
const usuarioController = new UsuarioController();

/**
 * @swagger
 * components:
 *  schemas:
 *      Usuario:
 *          type: object
 *          properties:
 *              id:
 *                  type: integer
 *                  example: 1
 *              nome:
 *                  type: string
 *                  example: Fulano da Silva
 */


/**
 * @swagger
 * /api/usuarios:
 *  get:
 *      summary: Lista todos os usuários
 *      tags: [Usuarios]
 *      responses:
 *          200:
 *              description: Lista de todos usuários
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/Usuario'
 *          401:
 *              description: Token ausente, inválido ou expirado
 *          500:
 *              description: Erro interno
 */
router.get("/", authMiddleware, (req, res) => 
    usuarioController.getAll(req, res));

/**
 * @swagger
 * /api/usuarios/{id}:
 *  get:
 *      summary: Buscar usuários por Id
 *      tags: [Usuarios]
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *              type: integer
 *      responses:
 *          200:
 *              description: Usuário foi encontrado
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Usuario'
 *          401:
 *              description: Token ausente, inválido ou expirado
 *          404:
 *              description: Usuário não encontrado
 */
router.get("/:id", authMiddleware, (req, res) => 
    usuarioController.getById(req, res));

/**
 * @swagger
 * /api/usuarios:
 *  post:
 *      summary: Criar novos usuários
 *      tags: [Usuarios]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          nome:
 *                              type: string
 *                              example: Ciclano da Silva
 *                          email:
 *                              type: string
 *                              example: ciclano@example.com
 *                          senha:
 *                              type: string
 *                              example: 123456
 *      responses:
 *          201:
 *              description: Usuário Criado      
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Usuario'    
 */
router.post("/", (req, res) =>
    usuarioController.create(req, res));

router.put("/:id", authMiddleware, (req, res) =>
    usuarioController.update(req, res));

router.delete("/:id", authMiddleware, (req, res) => 
    usuarioController.delete(req, res));

export default router;
```
Passar `authMiddleware` como segundo argumento (antes da função da rota) é a forma do Express de encadear middlewares numa rota específica — ele roda primeiro; só chega na função `(req, res) => ...` se o `authMiddleware` chamar `next()`. O comentário `@swagger` do `POST /api/usuarios` foi atualizado só para documentar os novos campos `email`/`senha` no corpo da requisição — sem isso, o Swagger UI continuaria mostrando o formato antigo (só `nome`), que não é mais válido.

## 10) Atualizar o Controller para receber `email`/`senha` no cadastro
Abra `src/controllers/usuarioController.ts` e ajuste só o método `create`, que hoje só lê `nome`:
```ts
async create(req: Request, res:Response): Promise<Response> {
    try {
        const { nome, email, senha } = req.body;
        const novoUsuario = await this.usuarioService.createUsuario({nome, email, senha});
        return res.status(201).json(novoUsuario);
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message});
    }
}
```
Os demais métodos (`getAll`, `getById`, `update`, `delete`) não mudam — quem passou a exigir o token foi a rota (passo 9), não o Controller.

## 11) Registrar as rotas de autenticação em `src/index.ts`
Hoje `src/index.ts` está assim:
```ts
import express from "express";
import usuarioRoutes from "./routes/usuarioRoutes";
import { connectDatabase } from "./config/database";

import swaggerUi from "swagger-ui-express";
import {swaggerSpec} from "./config/swagger";

const app = express();
const PORT = 3002;

app.use(express.json());
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/usuarios", usuarioRoutes);

const startServer = async ()=> {
    await connectDatabase()
    app.listen(PORT, () => { console.log("servidor rodando") });
};

startServer();
```
Adicione o carregamento do `.env` como **primeira linha do arquivo** e registre `authRoutes`:
```ts
import "dotenv/config";
import express from "express";
import usuarioRoutes from "./routes/usuarioRoutes";
import authRoutes from "./routes/authRoutes";
import { connectDatabase } from "./config/database";

import swaggerUi from "swagger-ui-express";
import {swaggerSpec} from "./config/swagger";

const app = express();
const PORT = 3002;

app.use(express.json());
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);

const startServer = async ()=> {
    await connectDatabase()
    app.listen(PORT, () => { console.log("servidor rodando") });
};

startServer();
```
`import "dotenv/config";` precisa vir antes de qualquer import que, direta ou indiretamente, leia `process.env.JWT_SECRET` (é o caso de `src/config/jwt.ts`, importado por `authController.ts`/`usuarioService.ts`/`authMiddleware.ts`) — por isso é a primeira linha do arquivo.

## 12) Testar o fluxo completo
Com o terminal dentro de `tempo/backend-devops-pratico/` (e o `database.sqlite` antigo já apagado, passo 3):
```bash
npm run dev
```

Atualize (ou crie) `requests/usuario.rest` — hoje ele só testa `GET`/`POST` na porta `3002` sem autenticação. Adicione o login e um exemplo protegido:
```http
### GET (protegido, precisa de token)
GET http://localhost:3002/api/usuarios  HTTP/1.1
Authorization: Bearer SEU_TOKEN

### GET por id (protegido)
GET http://localhost:3002/api/usuarios/2 HTTP/1.1
Authorization: Bearer SEU_TOKEN

### POST — cadastro (público, agora exige email e senha)
POST http://localhost:3002/api/usuarios HTTP/1.1
Content-Type: application/json

{
    "nome": "Aula ao vivo",
    "email": "aula@example.com",
    "senha": "123456"
}

### Login (público) — copie o "token" da resposta e cole nos requests acima
POST http://localhost:3002/api/auth/login HTTP/1.1
Content-Type: application/json

{
    "email": "aula@example.com",
    "senha": "123456"
}

### Sem token (deve responder 401)
GET http://localhost:3002/api/usuarios HTTP/1.1
```
Com `curl`:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"nome":"Aula ao vivo","email":"aula@example.com","senha":"123456"}' \
  http://localhost:3002/api/usuarios

curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"aula@example.com","senha":"123456"}' \
  http://localhost:3002/api/auth/login

curl http://localhost:3002/api/usuarios \
  -H "Authorization: Bearer SEU_TOKEN"

curl -i http://localhost:3002/api/usuarios
```
Resultados esperados:
- Cadastro: `201` com o usuário criado, **sem** o campo `senha` na resposta.
- Login: `200` com `{ "token": "eyJhbGci..." }`.
- `GET /api/usuarios` com token: `200` com a lista de usuários (sem `senha`).
- `GET /api/usuarios` sem token: `401` com `{ "message": "Token não informado" }`.

Você também pode conferir a rota `POST /api/usuarios` atualizada (com `email`/`senha`) em `http://localhost:3002/api/docs`.

## 🎯 Conceitos importantes
- **Autenticação vs. autorização**: este guia cobre autenticação (provar quem é o usuário, via login/token). Autorização (o que cada usuário tem *permissão* de fazer) é um passo além — veja "Próximos passos".
- **Nunca guardar senha em texto puro**: sempre um hash (`bcrypt`), nunca reversível.
- **JWT é assinado, não é criptografado**: qualquer um pode decodificar o payload (é só Base64); a assinatura só garante que ninguém alterou o conteúdo sem saber o `JWT_SECRET`.
- **`JWT_SECRET` é um segredo de verdade**: por isso vem de variável de ambiente (`.env`, fora do git), nunca hardcoded em código versionado.
- **Middleware de rota**: forma padrão do Express de executar uma verificação (autenticação, validação, log) antes do controller, reaproveitável em quantas rotas forem necessárias.

## 🔍 Próximos passos
1. Implementar `update`/`deleteUsuario` no Service (ainda são stubs) já considerando que só o próprio usuário (`req.usuarioId`) deveria poder editar/remover seu cadastro — isso já seria uma regra de **autorização**.
2. Documentar `POST /api/auth/login` também com `@swagger` em `src/routes/authRoutes.ts`, e adicionar um `securityScheme` do tipo `bearerAuth` em `src/config/swagger.ts`, para o botão **Authorize** aparecer no Swagger UI (`/api/docs`).
3. Escrever testes automatizados (Jest) para `UsuarioService.autenticar` e para o `authMiddleware`, mockando `jsonwebtoken`/`bcryptjs` (ver o padrão de mocks em `README-JEST.md`).
4. Adicionar um refresh token, para renovar o acesso sem exigir login de novo a cada expiração.
