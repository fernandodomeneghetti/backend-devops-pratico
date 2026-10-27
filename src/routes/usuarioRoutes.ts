import {Router} from "express";
import {UsuarioController} from "../controllers/usuarioController";
import {authMiddleware} from "../middleware/authMiddleware";

const router = Router();
const usuarioController = new UsuarioController();

/**
 * @swagger
 * components:
 *  schemas:
 *      Usuario:
 *          type: object
 *          properties:
 *              id:
 *                  type: integer
 *                  example: 1
 *              nome:
 *                  type: string
 *                  example: Fulano da Silva
 */


/**
 * @swagger
 * /api/usuarios:
 *  get:
 *      summary: Lista todos os usuários
 *      tags: [Usuarios]
 *      security:
 *          - bearerAuth: []
 *      responses:
 *          200:
 *              description: Lista de todos usuários
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/Usuario'
 *          401:
 *              description: Token Inválido
 *          500:
 *              description: Erro interno
 */
router.get("/", authMiddleware, (req, res) => 
    usuarioController.getAll(req, res));

/**
 * @swagger
 * /api/usuarios/{id}:
 *  get:
 *      summary: Buscar usuários por Id
 *      tags: [Usuarios]
 *      security:
 *          - bearerAuth: []
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *              type: integer
 *      responses:
 *          200:
 *              description: Usuário foi encontrado
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Usuario'
 *          401:
 *              description: Token Inválido
 *          404:
 *              description: Usuário não encontrado
 */
router.get("/:id", authMiddleware, (req, res) => 
    usuarioController.getById(req, res));

/**
 * @swagger
 * /api/usuarios:
 *  post:
 *      summary: Criar novos usuários
 *      tags: [Usuarios]
 *      security:
 *          - bearerAuth: []
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          nome:
 *                              type: string
 *                              example: Ciclano da Silva
 *      responses:
 *          201:
 *              description: Usuário Criado      
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Usuario'    
 */
router.post("/", (req, res) =>
    usuarioController.create(req, res));

router.put("/:id", (req, res) =>
    usuarioController.update(req, res));

router.delete("/:id", (req, res) => 
    usuarioController.delete(req, res));

export default router;