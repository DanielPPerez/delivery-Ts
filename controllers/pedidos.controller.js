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
exports.actualizarPedido = exports.obtenerPedidoPorId = exports.pagarPedido = exports.borrarTodosLosPedidos = exports.obtenerPedidos = exports.crearPedido = void 0;
const Pedidos_model_1 = __importDefault(require("../models/Pedidos.model"));
const Users_model_1 = __importDefault(require("../models/Users.model"));
const Products_models_1 = __importDefault(require("../models/Products.models"));
const polling_controller_1 = require("./polling.controller");
let numeroPedidoActual = 0;
const crearPedido = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userEmail, detallesVenta } = req.body;
        const usuario = yield Users_model_1.default.findOne({ email: userEmail });
        if (!usuario) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        let totalProducts = 0;
        const productosComprados = [];
        for (const detalle of detallesVenta) {
            const producto = yield Products_models_1.default.findOne({ title: detalle.name.trim() });
            if (!producto) {
                res.status(404).json({ message: `Producto no encontrado: ${detalle.name}` });
                return;
            }
            if (detalle.quantity > producto.quantity) {
                const errorMessage = `Cantidad no disponible para: ${detalle.name}`;
                res.status(400).json({ error: errorMessage });
                return;
            }
            const pedido = new Pedidos_model_1.default({
                user: usuario._id,
                products: [{ product: producto._id, title: detalle.name, quantity: detalle.quantity }],
                totalAmount: detalle.quantity * producto.price,
                numeroPedido: ++numeroPedidoActual,
            });
            totalProducts += pedido.totalAmount;
            producto.quantity -= detalle.quantity;
            const result = yield pedido.save();
            usuario.compras.push(result._id);
            productosComprados.push({ _id: producto._id, quantity: detalle.quantity });
        }
        yield usuario.save();
        yield Promise.all(productosComprados.map(producto => Products_models_1.default.findByIdAndUpdate(producto._id, { $inc: { quantity: -producto.quantity } })));
        (0, polling_controller_1.notifyLongPollingClients)({
            numeroPedido: numeroPedidoActual,
            userEmail,
            detallesVenta,
        });
        res.json({ numeroPedido: numeroPedidoActual, message: "Pedido creado con éxito" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear el pedido: " + (error instanceof Error ? error.message : error) });
    }
});
exports.crearPedido = crearPedido;
const obtenerPedidos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pedidos = yield Pedidos_model_1.default.find().populate('user').populate('products.product');
        const pedidosDetallados = pedidos.map((pedido) => ({
            _id: pedido._id,
            user: pedido.user,
            products: pedido.products.map((item) => ({
                title: item.product.title || 'Producto no disponible',
                quantity: item.quantity,
                totalProduct: item.quantity * (item.product.price || 0),
            })),
            totalAmount: pedido.totalAmount,
            createdAt: pedido.createdAt,
        }));
        res.json({ pedidos: pedidosDetallados });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al recuperar los pedidos.' });
    }
});
exports.obtenerPedidos = obtenerPedidos;
const borrarTodosLosPedidos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Pedidos_model_1.default.deleteMany({});
        res.json({ alert: { type: "success", message: 'Todos los pedidos han sido eliminados' } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ alert: { type: "error", message: 'Error al borrar los pedidos' } });
    }
});
exports.borrarTodosLosPedidos = borrarTodosLosPedidos;
const pagarPedido = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pedidoId } = req.params;
        // Marcar el pedido como pagado en la base de datos
        yield Pedidos_model_1.default.findByIdAndUpdate(pedidoId, { pagado: true });
        // Obtener los productos asociados al pedido
        const pedido = yield Pedidos_model_1.default.findById(pedidoId);
        if (!pedido) {
            res.status(404).json({ message: 'Pedido no encontrado.' });
            return;
        }
        const productosPedido = pedido.products.map(item => ({ _id: item.product, quantity: item.quantity }));
        // Eliminar los productos asociados al pedido de la base de datos
        yield Promise.all(productosPedido.map(producto => Products_models_1.default.findByIdAndUpdate(producto._id, { $inc: { quantity: producto.quantity } })));
        res.json({ message: 'Pedido pagado exitosamente y productos eliminados de la base de datos.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al pagar el pedido y eliminar los productos.' });
    }
});
exports.pagarPedido = pagarPedido;
const obtenerPedidoPorId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pedidoId } = req.params;
        // Obtener el pedido por su ID con todos los detalles
        const pedido = yield Pedidos_model_1.default.findById(pedidoId).populate('user').populate('products.product');
        if (!pedido) {
            res.status(404).json({ message: 'Pedido no encontrado.' });
            return;
        }
        res.json({ pedido });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los detalles del pedido.' });
    }
});
exports.obtenerPedidoPorId = obtenerPedidoPorId;
const actualizarPedido = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pedidoId } = req.params;
        const { detallesActualizados } = req.body;
        // Actualizar los detalles del pedido en la base de datos
        yield Pedidos_model_1.default.findByIdAndUpdate(pedidoId, { detallesVenta: detallesActualizados });
        res.json({ message: 'Detalles del pedido actualizados correctamente.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar los detalles del pedido.' });
    }
});
exports.actualizarPedido = actualizarPedido;
