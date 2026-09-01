import {UsuarioRepository} 
    from "../repositories/usuarioRepository";
import {UsuarioAttributes} from "../models/Usuario";

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

    async createUsuario(
        usuarioData: Omit<UsuarioAttributes, "id">) {
            return await this.usuarioRepository.create(usuarioData);
        }

    // TODO: Criar a service de update e delete
}