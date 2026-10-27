import swaggerJSDoc from "swagger-jsdoc";
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API de Usuarios",
            version: "1.0.0",
            description: "API para cadastro de usuários..."
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        servers: [
            {
                url: "http://localhost:3002",
                description: "Servidor local"
            },
            {
                url: "http://api.giovanna.com",
                description: "Servidor de Produçao"
            },
        ],

        
    },
    
    apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);