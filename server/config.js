// server/config.js
import dotenv from 'dotenv';

// Ejecutar la configuración de dotenv aquí, antes de cualquier otro código.
dotenv.config();

// Exporta process.env para que otros módulos puedan hacer destructuring si es necesario
export const env = process.env;
