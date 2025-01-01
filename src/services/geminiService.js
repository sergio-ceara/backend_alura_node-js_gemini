// Importa o módulo para interagir com o modelo generativo da Google (Gemini AI)
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa o cliente Gemini AI com a chave de API fornecida no arquivo .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define o modelo a ser utilizado (no caso, o modelo Gemini 1.5 Flash)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Função assíncrona para gerar uma descrição alternativa (alt-text) para uma imagem,
 * utilizando o modelo generativo do Gemini AI.
 *
 * @param {Buffer} imageBuffer - O buffer de imagem a ser analisado pelo modelo Gemini.
 * @param {string} solicitacao - O texto de solicitação que descreve o que deve ser gerado (prompt).
 * @returns {Promise<string>} - Retorna a descrição gerada pelo modelo ou uma mensagem padrão caso falhe.
 */
export default async function gerarDescricaoComGemini(imageBuffer, solicitacao) {
  // A variável 'prompt' recebe a solicitação que será passada ao modelo.
  const prompt = solicitacao;

  try {
    // Cria o objeto de imagem com o conteúdo da imagem convertido para base64 e o tipo MIME.
    const image = {
      inlineData: {
        // Converte o buffer da imagem em uma string base64
        data: imageBuffer.toString("base64"), 
        // Especifica o tipo MIME da imagem como PNG
        mimeType: "image/png", 
      },
    };

    try {
      // Chama o modelo Gemini para gerar a resposta com base no 'prompt' e na imagem fornecida.
      const res = await model.generateContent([prompt, image]);

      // Verifica se a resposta contém um texto gerado
      if (res && res.response && res.response.text) {
        return res.response.text();  // Retorna o texto gerado pelo modelo
      } else {
        return "Auto descrição indisponível."; // Caso não tenha texto gerado
      }
    } catch (e) {
      // Se ocorrer um erro ao gerar o conteúdo, retorna uma mensagem padrão
      console.error("\nErro ao gerar conteúdo com Gemini:", e.message);
      return "Auto descrição indisponível.";
    }

  } catch (erro) {
    // Se ocorrer um erro durante a criação do objeto de imagem ou qualquer outro erro, captura e loga
    console.error("\nErro ao obter alt-text:", erro.message, erro);
    
    // Lança um erro customizado para indicar que a descrição não pôde ser gerada
    throw new Error("\nErro ao obter o alt-text do Gemini.");
  }
}
