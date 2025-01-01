// Importa o módulo para manipular URLs no ES Modules (Exemplo: __filename, __dirname)
import.meta.url
// Importa o middleware CORS para permitir requisições de diferentes origens
import cors from "cors"; 
// Importa o módulo para manipulação de caminhos de arquivos
import path from 'path'; 
// Importa o middleware para lidar com uploads de arquivos
import multer from "multer"; 
// Importa o framework Express
import express from "express"; 
// Importa a função para transformar URLs em caminhos de arquivo
import { fileURLToPath } from 'url'; 
// Importa os controladores das rotas
import { apagarTodosPosts, alterarPost, listarBancosCollections, listarPosts, listarPost, novoPost, apagarItemPost } from "../controllers/postController.js"; 

// Simula a variável __dirname (caminho absoluto do diretório do arquivo) no ambiente ES Modules
const __filename = fileURLToPath(import.meta.url);
// Extrai o diretório do arquivo atual
const __dirname = path.dirname(__filename); 
// Define o caminho para a pasta 'public', que contém arquivos estáticos como 'index.html' e 'styles.css'
const publicPath = path.join(__dirname, '../../public');

// Configura as opções para o CORS (Cross-Origin Resource Sharing), permitindo acesso do frontend no endereço especificado
const corsOptions = {
    // Permite requisições do frontend definido no arquivo '.env' no campo 'CORS_ORIGIN'.
    origin: process.env.CORS_ORIGIN, 
    // Definindo o status de sucesso para 200 (comum em navegadores antigos)
    optionsSucessStatus: 200 
};

// Configuração do multer para o armazenamento de arquivos (imagem)
const storage = multer.diskStorage({
    // Define o destino dos arquivos enviados para o servidor
    destination: function (req, file, cb) {
        // Define a pasta de destino 'uploads'
        cb(null, 'uploads/'); 
    }
});

// Configuração do multer para aceitar uploads de arquivos
// Define onde os arquivos serão armazenados
const upload = multer({dest:"./uploads", storage}); 

// Função que define as rotas da aplicação Express
//const routes = (app) => {
export default function routes(app) {
    // Habilita o middleware para parsear JSON no corpo das requisições
    app.use(express.json()); 
    // Habilita o CORS com as configurações definidas acima
    app.use(cors(corsOptions)); 
    // Rota para servir o arquivo 'index.html' como resposta para requisições GET na raiz
    app.get("/", (req, res) => {
        // Retorna o arquivo 'index.html' da pasta public
        res.sendFile(path.join(publicPath, 'index.html')); 
    });
    // Rota para listar todos os bancos de dados e coleções
    app.get("/clusters/", listarBancosCollections);
    // Rota para listar todos os posts
    app.get("/posts/", listarPosts);
    // Rota para listar um post específico pelo ID
    app.get("/posts/:id", listarPost);
    // Rota para criar um novo post, com a imagem, do tipo "File", sendo enviada como parte do formulário
    app.post("/posts/", upload.single("imagem"), novoPost); 
    // Rota para alterar um post específico pelo ID, com a opção de enviar uma nova imagem do tipo "file".
    app.put("/posts/:id", upload.single("imagem"), alterarPost);
    // Rota para apagar todos os posts da coleção
    app.delete("/posts", apagarTodosPosts);
    // Rota para apagar um post específico pelo ID
    app.delete("/posts/:id", apagarItemPost);
    // Rota de fallback para qualquer URL não mapeada, redireciona para 'index.html'
    app.get("*", (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html')); 
    });
}
