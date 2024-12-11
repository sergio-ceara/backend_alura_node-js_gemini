// Importa as variáveis de ambiente do arquivo .env
import 'dotenv/config';
// Importa o ObjectId do MongoDB para manipulação de IDs
import { ObjectId } from "mongodb";
// Importa a função para conectar à instância do banco de dados
import conectarInstancia from "../config/db.js";

// Estabelece a conexão com a instância usando a string de conexão armazenada na variável de ambiente
const conexao = await conectarInstancia(process.env.STRING_CONEXAO);

// Função assíncrona para conectar à instância do banco de dados e retornar a coleção especificada
async function bancoColecao(tipo, id) {
    // tipo: 
    // 1 - Retorna a coleção e o banco de dados definidos nas variáveis de ambiente
    // 2 - Retorna um vetor (array) com a coleção (definida nas variáveis de ambiente) e o ID convertido para ObjectId.
    // Seleciona o banco de dados configurado nas variáveis de ambiente
    const db = conexao.db(process.env.BANCO);
    // Seleciona a coleção dentro do banco de dados configurado nas variáveis de ambiente
    const colecao = db.collection(process.env.COLLECTION);
    // Se o tipo for 1, retorna a coleção
    if (tipo == 1) {
        return colecao;
    } 
    // Se o tipo for 2, retorna a coleção e o ID convertido para ObjectId
    else if (tipo == 2) {
        try {
            // Tenta converter o ID para ObjectId
            const objectId = ObjectId.createFromHexString(id);
            return {colecao, objectId};
        } catch (e) {
            // Em caso de erro na conversão do ID, retorna a coleção e null para o ObjectId
            return {colecao: colecao, objectId: null};
        }
    }
}

// Função para listar todas as coleções de todos os bancos de dados disponíveis na instância
export async function getBancosCollections() {
    // Acessa o admin do banco de dados
    const admin = conexao.db().admin();
    // Lista todos os bancos de dados
    const dbInfo = await admin.listDatabases();
    const resultado = {};
    // Para cada banco de dados, lista suas coleções e as mapeia
    for (const { name } of dbInfo.databases) {
        // Recebe o nome do banco de dados atual.
        const db = conexao.db(name);
        // Recebe as coleções do banco de dados atual em formato de vetor (array).
        const collections = await db.listCollections().toArray();
        // Mapeia e adiciona as coleções ao resultado
        resultado[name] = collections.map(col => col.name); 
    }
    // Retorna um objeto com os bancos e suas coleções
    return resultado;
}

// Função para obter todos os posts da coleção
export async function getTodosPosts() {
    // Obtém a coleção
    const colecao = await bancoColecao(1); 
    // Retorna todos os posts como um array
    return colecao.find().toArray(); 
}

// Função para buscar um post específico pelo ID
export async function getPost(id) {
    // Obtém a coleção e converte o ID para ObjectId
    const {colecao, objectId} = await bancoColecao(2, id);
    // Verifica se o ID é válido
    if (!ObjectId.isValid(objectId)) {
        // Se o ID não for válido, retorna null
        return null; 
    }
    // Busca o post no banco de dados usando o ObjectId
    return await colecao.findOne({ _id: objectId });
}

// Função para criar um novo post na coleção
export async function criarPost(novoPost) {
    // Obtém a coleção
    const colecao = await bancoColecao(1);
    // Insere o novo post e retorna o resultado
    return colecao.insertOne(novoPost);
}

// Função para atualizar um post existente com um novo conteúdo
export async function postAtualizar(id, post) {
    // Obtém a coleção e converte o ID para ObjectId
    const {colecao, objectId} = await bancoColecao(2, id);
    // Verifica se o ID é válido
    if (!ObjectId.isValid(objectId)) {
        // Se o ID não for válido, retorna null
        return null; 
    }
    // Atualiza o post na coleção com os novos dados
    return colecao.updateOne({ _id: objectId }, { $set: post });
}

// Função para buscar um item específico dentro da coleção
export async function postPesquisaItem(colecao, id) {
    // Busca o item na coleção com o ID fornecido
    return await colecao.findOne({ _id: id });
}

// Função para apagar um post específico, incluindo a sua imagem
export async function postApagarItem(id) {
    // Obtém a coleção e converte o ID para ObjectId
    const {colecao, objectId} = await bancoColecao(2, id);
    // Verifica se o ID é válido
    if (!ObjectId.isValid(objectId)) {
        // Se o ID não for válido, retorna null
        return null; 
    }
    // Busca o item com o ID fornecido para obter a URL da imagem
    const item = await postPesquisaItem(colecao, objectId);
    // Se o item existir e tiver uma imagem, extraímos a extensão da imagem
    if (item && item.imagem) {
        console.log("postApagarItem: item.imagem:", item.imagem);
        // Obtém a extensão do arquivo
        const imgExtension = item.imagem.split('.').pop();  
        // Adiciona a extensão ao objeto do item
        item.imgExtension = imgExtension;  
    }
    // Apaga o item da coleção
    const result = await colecao.deleteOne({ _id: objectId });
    // Retorna o resultado da exclusão junto com a extensão do arquivo da imagem
    return {
        deletedCount: result.deletedCount,             // Quantidade de itens deletados
        imgExtension: item ? item.imgExtension : null  // Retorna a extensão da imagem se existir
    };
}
