import {Request, Response} from "express";
import {UsuarioService} from "../services/usuarioService";

export class AuthController {
    private usuarioService: UsuarioService;

    constructor() {
       this.usuarioService = new UsuarioService();  
    }

    async login(req: Request, res: Response) : Promise<Response> {
        try {
            const {email, senha} = req.body;
            const resultado = await this.usuarioService.autenticar(email, senha);

            return res.status(200).json({token: resultado});
        } catch (error) {
            return res.status(401).json({ message: (error as Error).message});
        }
    }
}