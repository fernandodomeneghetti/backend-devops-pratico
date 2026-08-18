# aula-api (TypeScript)

Passo a passo para criar a mesma API  usando TypeScript.

## Pré-requisitos
- Node.js (v16+ recomendado)
- npm

## 1) Inicializar o projeto
```bash
npm init -y
```

Crie um arquivo `.gitignore` com pelo menos:
```
node_modules
dist
.env
```

## 2) Instalar dependências
```bash
npm install express
npm install -D typescript ts-node-dev @types/node @types/express
```

## 3) Configurar TypeScript
Para este projeto de API com Express, a configuração mais adequada é usar `module: "CommonJS"` e `moduleResolution: "node"`, porque o projeto roda em Node.js com a estrutura de backend tradicional. Isso evita conflitos com imports e com a compatibilidade do Express em ambiente comum.

Para gerar a base do arquivo, o comando correto é:
```bash
npm install -D typescript @types/node @types/express ts-node-dev
npx tsc --init
```

Depois de gerar o arquivo, ajuste o `tsconfig.json` para algo como:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Por que este `tsconfig` é o mais adequado?
- `module: "CommonJS"` — é o padrão usado por grande parte das APIs Node.js/Express.
- `moduleResolution: "node"` — evita problemas de resolução de módulos no ambiente Node.
- `target: "ES2020"` — moderno e compatível com versões recentes do Node.
- `rootDir` e `outDir` — organizam a compilação em `src` e `dist`.
- `types: ["node"]` — garante tipagem correta para `process`, `require`, etc.
- `strict: true` — ativa checagem mais segura do TypeScript.

> O arquivo gerado automáticamente pelo `npx tsc --init` pode incluir opções mais voltadas para React ou Node avançado, mas para esse projeto de backend Express, essas opções extras não são necessárias e podem causar confusão.

## 4) Estrutura de pastas
- `src/` — código TypeScript
- `dist/` — saída compilada (gerada pelo `tsc`)

## 5) Código da API (TypeScript)
Crie o arquivo `src/index.ts` com o conteúdo abaixo:
```ts
import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

interface Usuario {
  id: number;
  nome: string;
}

let usuarios: Usuario[] = [
  { id: 1, nome: 'João' },
  { id: 2, nome: 'Maria' }
];

app.get('/api/usuarios', (req: Request, res: Response) => {
  res.json(usuarios);
});

app.post('/api/usuarios', (req: Request, res: Response) => {
  const novoUsuario: Usuario = { id: usuarios.length + 1, ...req.body } as Usuario;
  usuarios.push(novoUsuario);
  res.status(201).json(novoUsuario);
});

app.put('/api/usuarios/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx > -1) {
    usuarios[idx] = { id, ...req.body } as Usuario;
    res.json(usuarios[idx]);
  } else {
    res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

app.delete('/api/usuarios/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  usuarios = usuarios.filter(u => u.id !== id);
  res.status(204).send();
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
```

## 6) Scripts úteis no `package.json`
Adicione/atualize a seção `scripts`:
```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

- `npm run dev` — executa em modo desenvolvimento (reload automático)
- `npm run build` — compila para `dist/`
- `npm start` — executa a versão compilada

## 7) Executando
- Desenvolvimento:
```bash
npm run dev
```
- Produção (build + start):
```bash
npm run build
npm start
```

## 8) Testando endpoints (exemplos com `curl`)
- Listar usuários:
```bash
curl http://localhost:3000/api/usuarios
```
- Adicionar usuário:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"nome":"Carlos"}' http://localhost:3000/api/usuarios
```

## 9) Usando arquivo `.rest` no VS Code
Foi comum na aula anterior usar arquivos com extensão `.rest` para testar a API sem instalar outro programa externo. Esse tipo de arquivo funciona muito bem dentro do VS Code com uma extensão específica.

### 9.1) Instalar a extensão
No VS Code, acesse:
1. Extensões
2. Procure por: `REST Client`
3. Instale a extensão de nome: `REST Client` (da Microsoft/autor aprovada no marketplace)

Essa extensão permite enviar requisições HTTP diretamente pelo editor.

### 9.2) Criar o arquivo `.rest`
Crie uma pasta chamada `requests` e dentro dela um arquivo, por exemplo:
```bash
requests/request.rest
```

### 9.3) Estrutura básica de um arquivo `.rest`
```http
### GET
GET http://localhost:3000/api/usuarios HTTP/1.1

### POST
POST http://localhost:3000/api/usuarios HTTP/1.1
Content-Type: application/json

{
  "nome": "Carlos"
}

### PUT
PUT http://localhost:3000/api/usuarios/3 HTTP/1.1
Content-Type: application/json

{
  "nome": "Nome alterado"
}
```

### 9.4) Como usar
1. Inicie a API:
```bash
npm run dev
```
2. Abra o arquivo `.rest` no VS Code.
3. Clique em `Send Request` acima da requisição.
4. O resultado da resposta aparece em uma aba lateral do editor.

### 9.5) Exemplo do projeto
O arquivo usado no projeto pode ficar assim:
```http
### GET
GET http://localhost:3000/api/usuarios HTTP/1.1

### GET
GET http://localhost:3000/api/usuarios/getById/3 HTTP/1.1

### POST
POST http://localhost:3001/api/usuarios HTTP/1.1
content-type: application/json

{
    "nome": "novo usuario"
}

### PUT
PUT http://localhost:3000/api/usuarios/3 HTTP/1.1
content-type: application/json

{
    "nome": "nome alterado"
}
```

### 9.6) Observações importantes
- A porta da API precisa bater com o `PORT` definido no servidor.
- Se você usa `3000`, todos os requests devem apontar para `http://localhost:3000`.
- O `Content-Type: application/json` é obrigatório em requisições com body JSON.
- Caso apareça erro de conexão, verifique se o servidor está rodando com `npm run dev`.
- O `REST Client` funciona muito bem como alternativa ao Postman, principalmente em aulas e testes rápidos.

## 10) Observações
- Use um cliente como Postman ou Insomnia para testar rotas com payloads JSON.
- Para projetos de API Express em Node, `CommonJS` e `moduleResolution: "node"` são a escolha mais previsível.
- O `npx tsc --init` gera uma base padrão, mas ela pode ser ajustada para o backend que você está criando.

---
Arquivo atualizado para TypeScript com a configuração adequada para Express/Node: desenvolvimento-framework-II/AULA-API/aula-api/README.md
