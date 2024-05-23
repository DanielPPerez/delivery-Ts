"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.borrarProducto = exports.obtener = exports.editarProducto = exports.crearproducto = void 0;
const multer_1 = __importStar(require("multer"));
const Products_models_1 = __importDefault(require("../models/Products.models"));
// Configuración de multer para almacenar las imágenes en memoria
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
// Controlador para crear un producto
const crearproducto = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    upload.single('img')(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (err instanceof multer_1.MulterError) {
            console.error(err);
            res.status(500).json({ message: 'Error al cargar la imagen.' });
            return;
        }
        else if (err) {
            return next(err);
        }
        try {
            const { title, desc, price, quantity } = req.body;
            // Verificar que se hayan proporcionado los datos necesarios
            if (!title || !price || !quantity) {
                res.status(400).json({ message: 'Por favor, proporcione todos los campos obligatorios.' });
                return;
            }
            // Guardar la imagen en el modelo de producto
            const imgBuffer = (_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer;
            const product = new Products_models_1.default({ title, desc, price, quantity, img: imgBuffer });
            // Guardar el producto en la base de datos
            const productoGuardado = yield product.save();
            res.status(201).json(productoGuardado);
        }
        catch (error) {
            console.error('Error al crear el producto:', error);
            res.status(500).json({ message: 'Error al crear el producto.' });
        }
    }));
});
exports.crearproducto = crearproducto;
// Controlador para editar un producto
const editarProducto = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    upload.single('img')(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        if (err instanceof multer_1.MulterError) {
            console.error(err);
            res.status(500).json({ message: 'Error al cargar la imagen.' });
            return;
        }
        else if (err) {
            return next(err);
        }
        try {
            const { id } = req.params;
            const { title, desc, price, quantity } = req.body;
            // Verificar que se hayan proporcionado los datos necesarios
            if (!title || !price || !quantity) {
                res.status(400).json({ message: 'Por favor, proporcione todos los campos obligatorios.' });
                return;
            }
            // Preparar los datos de actualización
            const updateData = { title, desc, price, quantity };
            // Si se proporciona una nueva imagen, agregarla al objeto de actualización
            if (req.file) {
                updateData.img = req.file.buffer;
            }
            // Actualizar el producto en la base de datos
            const productoActualizado = yield Products_models_1.default.findByIdAndUpdate(id, updateData, { new: true });
            if (!productoActualizado) {
                res.status(404).json({ message: 'Producto no encontrado.' });
                return;
            }
            res.json(productoActualizado);
        }
        catch (error) {
            console.error('Error al editar el producto:', error);
            res.status(500).json({ message: 'Error al editar el producto.' });
        }
    }));
});
exports.editarProducto = editarProducto;
// Controlador para obtener los productos
const obtener = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productos = yield Products_models_1.default.find();
        // Mapear productos para incluir la imagen como base64
        const productosConImagen = productos.map(producto => {
            return {
                _id: producto._id,
                title: producto.title,
                desc: producto.desc,
                img: producto.img ? producto.img.toString('base64') : '',
                price: producto.price,
                quantity: producto.quantity,
                createdAt: producto.createdAt,
            };
        });
        res.json(productosConImagen);
    }
    catch (error) {
        console.error('Error al recuperar los productos:', error);
        res.status(500).json({ message: 'Error al recuperar los productos.' });
    }
});
exports.obtener = obtener;
// Controlador para borrar un producto
const borrarProducto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Eliminar el producto de la base de datos
        const productoEliminado = yield Products_models_1.default.findByIdAndDelete(id);
        if (!productoEliminado) {
            res.status(404).json({ message: 'Producto no encontrado.' });
            return;
        }
        res.json({ message: 'Producto eliminado exitosamente.' });
    }
    catch (error) {
        console.error('Error al borrar el producto:', error);
        res.status(500).json({ message: 'Error al borrar el producto.' });
    }
});
exports.borrarProducto = borrarProducto;
