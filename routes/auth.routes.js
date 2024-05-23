"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const pedidos_controller_1 = require("../controllers/pedidos.controller");
const Product_controller_1 = require("../controllers/Product.controller");
const router = (0, express_1.Router)();
// Rutas relacionadas con la autenticación
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.get("/profile", auth_middleware_1.auth, auth_controller_1.profile);
router.post("/logout", auth_middleware_1.auth, auth_controller_1.logout);
router.get("/verify/:token", auth_controller_1.verifyToken);
// Rutas relacionadas con los pedidos
router.post('/crearpedido', pedidos_controller_1.crearPedido);
router.get('/obtenerpedidos', pedidos_controller_1.obtenerPedidos);
router.post('/crearproducto', Product_controller_1.crearproducto);
router.put('/productos/:id', Product_controller_1.editarProducto);
router.delete('/productos/:id', Product_controller_1.borrarProducto);
router.get('/obtener', Product_controller_1.obtener);
router.get('/obtenerPedido/:id', pedidos_controller_1.obtenerPedidoPorId);
router.delete('/borrarTodos', pedidos_controller_1.borrarTodosLosPedidos);
exports.default = router;
