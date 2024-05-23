"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profile = exports.logout = exports.verifyToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const Users_model_1 = __importDefault(require("../models/Users.model"));
const config_1 = require("../config");
const jwt_1 = require("../libs/jwt");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, telefono } = req.body;
        // Buscar si ya existe un usuario con el mismo email
        const userFound = yield Users_model_1.default.findOne({ email });
        // Si se encuentra un usuario con el mismo email, devuelve un mensaje de error
        if (userFound) {
            res.status(400).json({
                message: ["El email ya está en uso"],
            });
            return;
        }
        // Verificar si el usuario es un administrador
        const isAdmin = email === "admin@example.com" && password === "adminPassword";
        // Hash de la contraseña
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        // Crear un nuevo usuario
        const newUser = new Users_model_1.default({
            email: (0, sanitize_html_1.default)(email.toLowerCase()),
            password: passwordHash,
            telefono: (0, sanitize_html_1.default)(telefono),
            isAdmin: isAdmin,
        });
        // Guardar el nuevo usuario en la base de datos
        const userSaved = yield newUser.save();
        // Devolver la información del usuario creado
        res.json({
            id: userSaved._id,
            telefono: userSaved.telefono,
            email: userSaved.email,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            // Manejar el error
            res.status(500).json({ message: error.message });
        }
        else {
            // Manejar errores desconocidos
            res.status(500).json({ message: 'Unknown error' });
        }
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const userFound = yield Users_model_1.default.findOne({ email });
        if (!userFound || !(yield bcryptjs_1.default.compare(password, userFound.password))) {
            res.status(400).json({
                message: ["El email o la contraseña son incorrectos"],
            });
            return;
        }
        const token = yield (0, jwt_1.createAccessToken)({
            id: userFound._id,
            email: userFound.email,
            isAdmin: userFound.isAdmin,
        });
        res.cookie("token", token).json({
            token,
            isAdmin: userFound.isAdmin,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Unknown error' });
        }
    }
});
exports.login = login;
const verifyToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.cookies;
    if (!token) {
        res.send(false);
        return;
    }
    jsonwebtoken_1.default.verify(token, config_1.TOKEN_SECRET, (error, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (error) {
            res.sendStatus(401);
            return;
        }
        const userFound = yield Users_model_1.default.findById(user.id);
        if (!userFound) {
            res.sendStatus(401);
            return;
        }
        res.json({
            id: userFound._id,
            email: userFound.email,
        });
    }));
});
exports.verifyToken = verifyToken;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.cookie("token", "", {
        httpOnly: true,
        secure: true,
        expires: new Date(0),
    });
    res.sendStatus(200);
});
exports.logout = logout;
const profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userFound = yield Users_model_1.default.findById(req.body.user.id);
    if (!userFound) {
        res.status(400).json({ message: "Usuario no encontrado" });
        return;
    }
    res.json({
        email: userFound.email,
        telefono: userFound.telefono,
    });
});
exports.profile = profile;
