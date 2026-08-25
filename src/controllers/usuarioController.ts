import {Request, Response} from "express";

interface Usuario {
    id: number;
    nome: string;
}

export class UsuarioController {
    getAll(req: Request, res: Response): Response {
        return res.json()
    }

    getById(req: Request, res:Response): Response {
        return res.json()
    }

    create(req: Request, res:Response): Response {
        return res.status(201).json()
    }

    update(req: Request, res:Response): Response {
        return res.status(201).json()
    }

    delete(req: Request, res:Response): Response {
        return res.status(201).json()
    }
}