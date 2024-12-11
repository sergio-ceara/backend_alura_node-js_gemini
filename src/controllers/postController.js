// Importa o módulo fs (File System) para manipulação de arquivos no servidor
import fs from 'fs';
// Importa o módulo path para lidar com caminhos de arquivos
import path from 'path';
// Importa funções do model para manipulação de posts e bancos de dados.
import { getTodosPosts, getPost, getBancosCollections, criarPost, postAtualizar, postApagarItem } from "../models/postModel.js";
// Importa o serviço para gerar descrições automáticas usando Gemini.
import gerarDescricaoComGemini from '../services/geminiService.js';

// Função para listar os bancos de dados e suas coleções
export async function listarBancosCollections(req, res) {
    const bancosCollections = await getBancosCollections(); // Recupera as coleções do banco de dados.
    res.status(200).json(bancosCollections); // Retorna as coleções como resposta JSON.
}

// Função para listar todos os posts.
export async function listarPosts(req, res) {
    // Recupera todos os posts do banco de dados.
    const posts = await getTodosPosts(); 
    // Retorna todos os posts como resposta JSON.
    res.status(200).json(posts); 
}

// Função para listar um post específico baseado no ID.
export async function listarPost(req, res) {
    // Obtém o ID do post da URL.
    const id = req.params.id; 
    // Recupera o post correspondente ao ID fornecido.
    const post = await getPost(id); 
    // Retorna o post encontrado como resposta JSON.
    res.status(200).json(post); 
}

// Função auxiliar para construir o objeto do post com imagem e descrição.
async function objetoPost(req) {
    // definindo variáveis a serem usadas nesta função
    let descricao, alt, imgBuffer = "";
    // Verifica se a imagem foi enviada, caso contrário retorna uma falha.
    if (req.file) {
        // Lê a imagem enviada.
        imgBuffer = fs.readFileSync(req.file.path); 
    } else {
        // Se não houver imagem, retorna erro.
        return { "falha": "Imagem é obrigatória." }; 
    }
    // Se a descrição não for fornecida, gera uma descrição automática com Gemini.
    if (!req.body.descricao) {
        descricao = await gerarDescricaoComGemini(imgBuffer, "Crie uma descrição resumida desta imagem, sem introdução, formatação ou quebra de linha.");
    } else {
        // Usa a descrição fornecida no corpo da requisição.
        descricao = req.body.descricao; 
    }

    // Se o texto alternativo (alt) não for fornecido, gera um automaticamente.
    if (!req.body.alt) {
        alt = await gerarDescricaoComGemini(imgBuffer, "Crie uma descrição detalhada desta imagem, sem introdução, formatação ou quebra de linha.");
    } else {
        // Usa o texto alternativo fornecido no corpo da requisição.
        alt = req.body.alt; 
    }

    // Retorna o objeto com as informações do post.
    return {
        "imagem": req.file.originalname,
        "descricao": descricao,
        "alt": alt
    };
}

// Função para criar um novo post.
export async function novoPost(req, res) {
    // Cria o objeto do post com base nos dados fornecidos.
    const novoPost = await objetoPost(req); 
    // Se falhou em gerar o objeto, retorna erro com status 400.
    if (novoPost.falha) {
        return res.status(400).json({ "novoPost: error": novoPost.falha });
    }
    try {
        // Obtém a extensão da imagem e renomeia o arquivo para salvar no servidor.
        const extensao = path.extname(req.file.originalname).slice(1);
        // Cria o post no banco de dados.
        const postCriado = await criarPost(novoPost); 
        // Atualiza o caminho da imagem no servidor.
        const imagemAtualizada = `uploads/${postCriado.insertedId}.${extensao}`;
        // Renomeia e move a imagem para a pasta uploads.
        fs.renameSync(req.file.path, imagemAtualizada); 
        // Retorna o post criado como resposta.
        res.status(200).json(postCriado); 
    } catch (erro) {
        // Erro genérico para segurança, sem detalhes.
        res.status(500).json({ "novoPost:Error": "Falha na requisição" }); 
        // Detalhes do erro são registrados no console do backend.
        console.error(erro.message); 
    }
}

// Função para alterar um post existente.
export async function alterarPost(req, res) {
    // Obtém o ID do post a ser alterado.
    const id = req.params.id; 
    // Verifica se o ID foi fornecido, caso contrário retorna erro.
    if (!id) {
        return res.status(400).json({ "alterarPost: error": "ID é obrigatório." });
    }
    // Verifica se a imagem anterior foi fornecida, caso contrário retorna erro.
    if (!req.body.imagemAnterior) {
        return res.status(400).json({ "alterarPost: error": "Imagem anterior é obrigatória." });
    }
    // Cria o novo objeto de post com base nos dados enviados no request.
    const postAlterado = await objetoPost(req);
    if (postAlterado.falha) {
        // se não for possível criar o objeto, retorna uma informação arnazenada em 'postAlterado.falha'.
        return res.status(400).json({ "alterarPost: error": postAlterado.falha });
    }

    try {
        // Verifica se uma nova imagem foi enviada e, se sim, processa a atualização da imagem.
        let imagemAtualizada;
        if (req.file) {
            // Recupera a extensão do arquivo atual selecionado
            const extensaoAtual = path.extname(req.file.originalname).slice(1);
            // Recupera o nome da imagem anterior pelo campo 'imagemAnterior'
            const imagemAnterior = req.body.imagemAnterior;
            // Recupera a extensão do arquivo anterior
            const extensaoAnterior = imagemAnterior.split(".").slice(1).toString();
            // Define o caminho do arquivo de imagem no servidor
            imagemAtualizada = `uploads/${id}.${extensaoAtual}`;
            // Apaga a imagem antiga se ela existir.
            const imagemAntiga = path.resolve('uploads', `${id}.${extensaoAnterior}`);
            if (fs.existsSync(imagemAntiga)) {
                fs.unlinkSync(imagemAntiga);
                console.log(`Imagem antiga ${imagemAntiga} apagada com sucesso.`);
            }
            // Renomeia e move a nova imagem para a pasta uploads.
            fs.renameSync(req.file.path, imagemAtualizada);
        }
        // Atualiza os dados do post no banco de dados.
        const postModificado = await postAtualizar(id, postAlterado);
        // Retorna os dados do post modificado.
        res.status(200).json(postAlterado); 
    } catch (erro) {
        // Erro genérico para segurança.
        res.status(500).json({ "alterarPost: Error": "Falha na requisição" }); 
        // Detalhes do erro registrados no backend.
        console.error(erro.message); 
    }
}

// Função para apagar todos os posts, incluindo as imagens associadas.
export async function apagarTodosPosts(req, res) {
    // Obtém todos os posts para deletar.
    const posts = await getTodosPosts(); 
    // Cria variável para guardar os itens apagados.
    let apagados = 0;
    // Itera sobre cada post e apaga sua imagem e dados do banco.
    for (const post of posts) {
        // Recebe o ID do banco de dados
        const id = post._id.toString();
        // Recebe o nome do arquivo de imagem do banco de dados
        const imagem = post.imagem;
        // Recupera a extensão do arquivo da imagem
        const extensao = imagem.split(".").slice(1).toString();
        // Criar o caminho no servidor do arquivo da imagem.
        const imagemAtual = path.resolve('uploads', `${id}.${extensao}`);
        // Verifica se a imagem existe e a apaga.
        if (fs.existsSync(imagemAtual)) {
            // Apaga a imagem.
            fs.unlinkSync(imagemAtual); 
            console.log(`apagarTodosPosts: Arquivo ${imagemAtual} apagado com sucesso.`);
        } else {
            console.log(`apagarTodosPosts: Arquivo ${imagemAtual} não encontrado.`);
        }
        // Apaga o post do banco de dados.
        try {
            // chama rotina 'postApagarItem' do arquivo 'postModel.js' para apagar registro no banco de dados.
            const apagarResultado = await postApagarItem(id);
            console.log(`Post ${id} apagado com sucesso.`);
            // Incrementa o contador de excluidos na variavel 'apagados'.
            apagados++;
        } catch (erro) {
            console.log(`Erro ao apagar o post ${id}:`, erro.message);
        }
    }

    // Retorna a quantidade total de posts e quantos foram apagados.
    res.status(200).json({
        "total de registros:": posts.length,
        "Apagados:": apagados
    });
}

// Função para apagar um post específico, incluindo a imagem.
export async function apagarItemPost(req, res) {
    // Obtém o ID do post a ser apagado.
    const id = req.params.id; 
    try {
        // Apaga o post do banco de dados.
        const apagarResultado = await postApagarItem(id); 
        // Obtém a extensão da imagem.
        let extensao = apagarResultado['imgExtension'] ? apagarResultado['imgExtension'] : ""; 
        // Cria o caminho completo para a imagem do post no servidor.
        const imagemAtual = path.resolve('uploads', `${id}.${extensao}`);
        // Verifica se a imagem existe e a apaga.
        if (fs.existsSync(imagemAtual)) {
            // Apaga a imagem.
            fs.unlinkSync(imagemAtual); 
            console.log(`Arquivo ${imagemAtual} apagado com sucesso.`);
        } else {
            console.log(`Arquivo ${imagemAtual} não encontrado.`);
        }
        // Retorna o resultado da operação de apagar o post.
        res.status(200).json(apagarResultado);
    } catch (erro) {
        // Registra o erro no console do backend.
        console.log("apagarItemPost: falhou:", erro.message); 
        // Retorna erro genérico.
        res.status(500).json({ "erro": "Falha na requisição" }); 
    }
}
