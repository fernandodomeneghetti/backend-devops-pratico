import express, {Request, Response} from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/api/usuario", (req: Request, res: Response) => {
    res.json({ "materia": "devops backend"})
})


app.listen(PORT, () => { console.log("servidor rodando") })