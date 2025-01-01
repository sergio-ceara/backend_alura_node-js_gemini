# API - Post

Este projeto backend utiliza o framework Express para gerenciar as rotas relacionadas a posts e o gerenciamento de arquivos de mídia. Também possui integração com o Google Gemini para adicionar descrições automáticas de imagens selecionadas.

## Rotas principais:

-    GET '/'         : Retorna o arquivo 'index.html' da pasta pública.
-    GET '/clusters/': Lista todos os bancos de dados e coleções.
-    GET '/posts/'   : Lista todos os posts.
-    GET '/posts/:id': Retorna um post específico pelo ID.
-   POST '/posts/'   : Cria um novo post, permitindo o upload de uma imagem.
-    PUT '/posts/:id': Atualiza um post específico, com a opção de enviar uma nova imagem.
- DELETE '/posts'    : Deleta todos os posts da coleção.
- DELETE '/post/:id' : Deleta um post específico pelo ID.
-    GET '*'         : Rota de fallback para todas as URLs não mapeadas, retornando 'index.html'.

## Dependências:

- Express: Framework para o backend, utilizado para definir as rotas e gerenciar as requisições HTTP.
-  Multer: Middleware para lidar com uploads de arquivos.
-    CORS: Middleware para habilitar o compartilhamento de recursos entre diferentes origens.
-    Path: Módulo para manipulação de caminhos de arquivos.
-     URL: Utilizado para manipular URLs e simular a variável `__dirname` no ambiente ES Modules.

## Configuração: Instalação das dependências
   Para instalar as dependências, execute o seguinte comando no diretório do projeto:
	npm install express multer cors path
