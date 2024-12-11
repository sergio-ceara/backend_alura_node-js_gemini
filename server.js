import.meta.url
import express from "express";
import routes from "./src/routes/postsRoutes.js";

const app = express();
app.use(express.static("uploads")); // tornar a pasta '/uploads' pública.
app.use(express.static("public"));  // Adiciona esta linha para a nova pasta estática
routes(app);
app.listen(process.env.PORT,() => {
    console.log(`banco: ${process.env.BANCO}`);
    console.log(`colection: ${process.env.COLLECTION}`);
    console.log(`Servidor ativo na porta ${process.env.PORT}`);
    console.log(`endereço: http://localhost:${process.env.PORT}/`);
    console.log("CORS_ORIGIN:",process.env.CORS_ORIGIN);
});


