import {UsuarioRepository} 
    from "../repositories/usuarioRepository";
import {UsuarioAttributes} from "../models/Usuario";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {JWT_SECRET, JWT_EXPIRES_IN} from "../config/jwt";

export class UsuarioService {
    private usuarioRepository : UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    async getAllUsuarios() {
        return await this.usuarioRepository.findAll();
    }

    async getUsuarioById(id: number) {
        const usuario = await this.usuarioRepository.findById(id);
        if (!usuario) {
            throw new Error("Usuário não encontrado");
        }

        return usuario;
    }

    async createUsuario(usuarioData: Omit<UsuarioAttributes, "id">) {
            const senhaCripto = await bcrypt.hash(usuarioData.senha, 10);

            return await this.usuarioRepository.create({
                ...usuarioData,
                senha: senhaCripto
            });
        }
    
    async autenticar(email:string, senha:string) {
        const usuario = await this.usuarioRepository.findByEmail(email);

        if(!usuario) {
            throw new Error("E-mail ou senha inválido");
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if(!senhaValida) {
            throw new Error("E-mail ou senha inválido");
        }

        const token = jwt.sign(
            {id: usuario.id, email: usuario.email, nome: usuario.nome},
            JWT_SECRET!,
            { expiresIn: JWT_EXPIRES_IN }
        )

        return token;
    }

    // TODO: Criar a service de update e delete
}