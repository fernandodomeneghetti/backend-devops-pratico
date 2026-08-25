import express from "express";
import usuarioRoutes from "./routes/usuarioRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api/usuarios", usuarioRoutes);

app.listen(PORT, () => { console.log("servidor rodando") })