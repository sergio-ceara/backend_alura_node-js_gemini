// Importa a classe MongoClient do módulo 'mongodb', que é usada para se conectar ao MongoDB.
import { MongoClient } from 'mongodb';

// Declara uma função assíncrona chamada 'conectarInstancia', que recebe a string de conexão como argumento.
export default async function conectarInstancia(stringConexao) {
    // Declara uma variável 'mongoClient' que armazenará a instância do MongoClient.
    let mongoClient;
    try {
        // Cria uma nova instância do MongoClient, passando a string de conexão fornecida.
        mongoClient = new MongoClient(stringConexao);
        
        // Exibe uma mensagem indicando que a tentativa de conexão com o banco de dados está em andamento.
        console.log("Conectando ao banco de dados em nuvem...");
        
        // Tenta conectar ao banco de dados MongoDB de forma assíncrona, aguardando até que a conexão seja estabelecida.
        await mongoClient.connect();
        
        // Exibe uma mensagem indicando que a conexão foi bem-sucedida.
        console.log("Conectado ao MongoDB Atlas com sucesso!");
        
        // Retorna a instância do MongoClient, permitindo que outras funções ou módulos interajam com o banco de dados.
        return mongoClient;
    } catch (erro) {
        // Exibe uma mensagem de erro caso a tentativa de conexão falhe.
        console.error(`Falha na conexão do banco: ${erro}`);
        
        // Faz com que o processo do Node.js seja encerrado devido à falha na conexão.
        process.exit();
    }
}
