import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "../config/jwt";

export interface RequestAutenticado extends Request {
    usuarioId?: number;
}

export function authMiddleware(req:RequestAutenticado, res:Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({message: "Token invalido"});
    }

    const [schema, token] = authHeader.split(" ");

    if(schema !== "Bearer" || !token) {
        return res.status(401).json({message: "Token invalido"});
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET!) as {id:number; email:string};
        req.usuarioId = payload.id;
        return next();
    } catch (error) {
        return res.status(401).json({message: "Token invalido"});
    }
}