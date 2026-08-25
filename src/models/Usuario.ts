import {DataTypes, Model} from "sequelize";
import {sequelize} from "../config/database";

export interface UsuarioAttributes {
    id?: number;
    nome: string;
}

export class Usuario 
    extends Model<UsuarioAttributes>
    implements UsuarioAttributes {
        public id!: number;
        public nome!: string;   
}

Usuario.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
},
{
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios'
});
