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
exports.notifyLongPollingClients = exports.longPollingRouter = exports.shortPollingRouter = void 0;
const Products_models_1 = __importDefault(require("../models/Products.models"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const shortPollingRouter = express_1.default.Router();
exports.shortPollingRouter = shortPollingRouter;
const longPollingRouter = express_1.default.Router();
exports.longPollingRouter = longPollingRouter;
const longPollingClients = [];
shortPollingRouter.use((0, cors_1.default)());
longPollingRouter.use((0, cors_1.default)());
shortPollingRouter.get('/checkAvailability', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productos = yield Products_models_1.default.find();
        const productosAgotados = productos.filter((producto) => producto.quantity === 0).map((producto) => producto.title);
        res.json({ productosAgotados });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al verificar la disponibilidad de productos.' });
    }
}));
longPollingRouter.get('/wait', (req, res) => {
    longPollingClients.push(res);
});
function notifyLongPollingClients(newPedido) {
    while (longPollingClients.length > 0) {
        const client = longPollingClients.pop();
        if (!client.headersSent) {
            try {
                client.json({
                    eventType: 'newPedido',
                    eventData: {
                        numeroPedido: newPedido.numeroPedido,
                        userEmail: newPedido.userEmail,
                        detallesVenta: newPedido.detallesVenta,
                    },
                });
                client.end();
            }
            catch (error) {
                console.error('Error al enviar la notificación al cliente de long polling:', error);
                client.status(500).json({ error: 'Error al enviar la notificación al cliente de long polling.' });
            }
        }
    }
}
exports.notifyLongPollingClients = notifyLongPollingClients;
