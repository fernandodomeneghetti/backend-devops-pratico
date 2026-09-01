import {Request, Response} from "express";
import {UsuarioService} from "../services/usuarioService";

export class UsuarioController {
    private usuarioService : UsuarioService;

    constructor() {
        this.usuarioService = new UsuarioService();
    }

    async getAll(req: Request, res: Response): Promise<Response> {
       try {
        const usuarios = await this.usuarioService.getAllUsuarios();
        return res.status(200).json(usuarios);
       } catch (error) {
        // Tratar o erro com log interno
        return res.status(500).json({message: "Erro interno"})
       }
    }

    async getById(req: Request, res:Response): Promise<Response> {
        try {
           const id = Number(req.params.id);
           const usuario = await this.usuarioService.getUsuarioById(id);
           return res.status(200).json(usuario); 
        } catch (error) {
            return res.status(404).json({message: (error as Error).message})
        }
    }

    async create(req: Request, res:Response): Promise<Response> {
        try {
            const { nome } = req.body;
            const novoUsuario = await this.usuarioService.createUsuario({nome});
            return res.status(201).json(novoUsuario);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message});
        }
    }

    update(req: Request, res:Response): Response {
        return res.status(201).json()
    }

    delete(req: Request, res:Response): Response {
        return res.status(201).json()
    }
}