import express from "express";
import usuarioRoutes from "./routes/usuarioRoutes";
import { connectDatabase } from "./config/database";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api/usuarios", usuarioRoutes);

const startServer = async ()=> {
    await connectDatabase()
    app.listen(PORT, () => { console.log("servidor rodando") });
};

startServer();
