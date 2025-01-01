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
async function objetoPost(req, id) {
    // definindo variáveis a serem usadas nesta função
    let descricao, alt, imgBuffer, imagem, imagemAnterior, postAnterior, arquivoImagem, extensao = null;
    // identificando a informações antes da alteração
    if (id) {
       postAnterior = await getPost(id); 
    }
    // Verifica se a imagem foi enviada, caso contrário retorna uma falha.
    if (req.file) {
		imgBuffer = fs.readFileSync(req.file.path);
		//imgBuffer = fs.promises.readFile(req.file.path);
		imagem = req.file.originalname;
        if (postAnterior) {
           imagemAnterior = postAnterior.imagem;
        }
        //if (imgBuffer == null || imgBuffer == "") {
		if (!imgBuffer) {
           //return { "falha": "Imagem é obrigatória." }; 
        }
    } else {
		console.log("postAnterior:", postAnterior);
        if (postAnterior) {
           imagem = postAnterior.imagem;
        }
		if (!req.body.descricao && !req.body.alt) {
			extensao = path.extname(postAnterior.imagem).slice(1);
			arquivoImagem = `uploads/${postAnterior._id}.${extensao}`;
			imgBuffer = fs.readFileSync(arquivoImagem);
		}
		
    }
    // Se a descrição não for fornecida, gera uma descrição automática com Gemini.
	
    if (!req.body.descricao && imgBuffer) {
        try {
            descricao = await gerarDescricaoComGemini(imgBuffer, "Crie uma descrição resumida desta imagem, sem introdução, formatação ou quebra de linha.");
        } catch (e) {
            console.log("Google Gemini: descrição automática: ",e.message);
            descricao = "Descrição automática falhou. Tente novamente."
        }
        
    } else {
        // Usa a descrição fornecida no corpo da requisição.
        descricao = req.body.descricao; 
    }

    // Se o texto alternativo (alt) não for fornecido, gera um automaticamente.
    if (!req.body.alt && imgBuffer) {
        alt = await gerarDescricaoComGemini(imgBuffer, "Crie uma descrição detalhada desta imagem, sem introdução, formatação ou quebra de linha.");
    } else {
        // Usa o texto alternativo fornecido no corpo da requisição.
        alt = req.body.alt; 
    }
    // teste
    // console.log("objetoPost: imagemAnterior:",imagemAnterior);

    // Retorna o objeto com as informações do post.
    return {
        "imagem": imagem,
        "descricao": descricao,
        "alt": alt,
        ...(imagemAnterior ? {"imagemAnterior": imagemAnterior} : {})
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
		// console.log("novoPost: 1", novoPost);
		let extensao = ""
		if (req.file) {
			extensao = path.extname(req.file.originalname).slice(1);
		}
		// console.log("novoPost: 2", novoPost);
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
    if (req.file) {
       // Verifica se a imagem anterior foi fornecida, caso contrário retorna erro.
       if (!req.body.imagemAnterior) {
          return res.status(400).json({ "alterarPost: error": "Imagem anterior é obrigatória." });
       }
    }
    // Cria o novo objeto de post com base nos dados enviados no request.
    const postAlterado = await objetoPost(req, id);
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
                console.log(`\nImagem antiga ${imagemAntiga} apagada com sucesso.`);
            }
            // Renomeia e move a nova imagem para a pasta uploads.
            fs.renameSync(req.file.path, imagemAtualizada);
        }
        // Atualiza os dados do post no banco de dados.
        const postModificado = await postAtualizar(id, postAlterado);
        // Retorna os dados do post modificado.
        // console.log("postAlterado:alterarPost:",postAlterado);
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
            console.log(`\nArquivo ${imagemAtual} apagado com sucesso.`);
        } else {
            console.log(`\nArquivo ${imagemAtual} não encontrado.`);
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
