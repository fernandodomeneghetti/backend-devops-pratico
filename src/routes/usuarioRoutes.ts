import {Router} from "express";
import {UsuarioController} from "../controllers/usuarioController";

const router = Router();
const usuarioController = new UsuarioController();

router.get("/", (req, res) => 
    usuarioController.getAll(req, res));

router.get("/:id", (req, res) => 
    usuarioController.getById(req, res));

router.post("/", (req, res) =>
    usuarioController.create(req, res));

router.put("/:id", (req, res) =>
    usuarioController.update(req, res));

router.delete("/:id", (req, res) => 
    usuarioController.delete(req, res));

export default router;