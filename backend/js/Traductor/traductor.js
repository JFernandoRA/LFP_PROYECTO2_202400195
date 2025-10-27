
class Traductor {
    constructor() {
        this.codigoPython = "";
        this.nivelIndentacion = 0;
    }

    traducir(ast) {
        this.codigoPython = "";
        this.nivelIndentacion = 0;

        if (!ast) {
            return { codigo: "# Error: No se pudo generar AST", errores: [] };
        }

        this.codigoPython += '# Traducido de Java a Python\n';
        this.codigoPython += '# Clase: ' + ast.nombre + '\n\n';

        this.traducirMain(ast.main);

        return { codigo: this.codigoPython, errores: [] };
    }

    traducirMain(main) {
        if (!main || !main.sentencias) return;

        this.traducirSentencias(main.sentencias);
    }

    traducirSentencias(sentencias) {
        if (!sentencias) return;

        sentencias.forEach(sentencia => this.traducirSentencia(sentencia));
    }

    traducirSentencia(sentencia) {
        if (!sentencia) return;

        const indentacion = "    ".repeat(this.nivelIndentacion);

        switch (sentencia.tipo) {
            case "DECLARACION":
                this.traducirDeclaracion(sentencia, indentacion);
                break;
            case "ASIGNACION":
                this.codigoPython += `${indentacion}${sentencia.nombre} = ${this.traducirExpresion(sentencia.valor)}\n`;
                break;
            case "INCREMENTO":
                this.codigoPython += `${indentacion}${sentencia.nombre} += 1\n`;
                break;
            case "DECREMENTO":
                this.codigoPython += `${indentacion}${sentencia.nombre} -= 1\n`;
                break;
            case "PRINT":
                this.codigoPython += `${indentacion}print(${this.traducirExpresion(sentencia.expresion)})\n`;
                break;
            case "IF_ELSE":
                this.traducirIfElse(sentencia, indentacion);
                break;
            case "FOR":
                this.traducirFor(sentencia, indentacion);
                break;
            case "WHILE":
                this.traducirWhile(sentencia, indentacion);
                break;
            case "VACIO":
                break;
        }
    }

    traducirDeclaracion(declaracion, indentacion) {
        if (!declaracion.variables) return;

        declaracion.variables.forEach(variable => {
            if (!variable) return;

            const valor = variable.valor ?
                this.traducirExpresion(variable.valor) :
                this.valorPorDefecto(declaracion.tipoDato);

            this.codigoPython += `${indentacion}${variable.nombre} = ${valor}`;
            this.codigoPython += `  # Declaracion: ${declaracion.tipoDato}\n`;
        });
    }

    traducirIfElse(ifElse, indentacion) {
        const condicion = this.traducirExpresion(ifElse.condicion);
        this.codigoPython += `${indentacion}if ${condicion}:\n`;

        this.nivelIndentacion++;
        if (ifElse.bloqueIf && ifElse.bloqueIf.length > 0) {
            this.traducirSentencias(ifElse.bloqueIf);
        } else {
            this.codigoPython += `${"    ".repeat(this.nivelIndentacion)}pass\n`;
        }
        this.nivelIndentacion--;

        if (ifElse.bloqueElse) {
            this.codigoPython += `${indentacion}else:\n`;
            this.nivelIndentacion++;
            if (ifElse.bloqueElse.length > 0) {
                this.traducirSentencias(ifElse.bloqueElse);
            } else {
                this.codigoPython += `${"    ".repeat(this.nivelIndentacion)}pass\n`;
            }
            this.nivelIndentacion--;
        }
    }

    traducirFor(forLoop, indentacion) {
        // Extraer información de la inicialización
        let variable = "";
        let valorInicial = "";

        if (forLoop.inicializacion && forLoop.inicializacion.variables) {
            variable = forLoop.inicializacion.variables[0].nombre;
            valorInicial = this.traducirExpresion(forLoop.inicializacion.variables[0].valor);
        }

        // Primero declarar la variable
        this.codigoPython += `${indentacion}${variable} = ${valorInicial}\n`;

        // Crear el while equivalente
        const condicion = this.traducirExpresion(forLoop.condicion);
        this.codigoPython += `${indentacion}while ${condicion}:\n`;

        this.nivelIndentacion++;
        if (forLoop.bloque && forLoop.bloque.length > 0) {
            this.traducirSentencias(forLoop.bloque);
        }

        // Agregar el incremento al final del bloque
        if (forLoop.incremento) {
            this.traducirSentencia(forLoop.incremento);
        }

        this.nivelIndentacion--;
    }

    traducirWhile(whileLoop, indentacion) {
        const condicion = this.traducirExpresion(whileLoop.condicion);
        this.codigoPython += `${indentacion}while ${condicion}:\n`;

        this.nivelIndentacion++;
        if (whileLoop.bloque && whileLoop.bloque.length > 0) {
            this.traducirSentencias(whileLoop.bloque);
        } else {
            this.codigoPython += `${"    ".repeat(this.nivelIndentacion)}pass\n`;
        }
        this.nivelIndentacion--;
    }

    traducirExpresion(expresion) {
        if (!expresion) return "";

        if (expresion.tipo === "PRIMARIO") {
            return this.traducirPrimario(expresion);
        }

        if (expresion.tipo === "EXPRESION_LOGICA") {
            const izq = this.traducirExpresion(expresion.izquierda);
            const der = this.traducirExpresion(expresion.derecha);
            const op = this.traducirOperador(expresion.operador);
            return `${izq} ${op} ${der}`;
        }

        if (expresion.tipo === "EXPRESION_RELACIONAL") {
            const izq = this.traducirExpresion(expresion.izquierda);
            const der = this.traducirExpresion(expresion.derecha);
            const op = this.traducirOperador(expresion.operador);
            return `${izq} ${op} ${der}`;
        }

        if (expresion.tipo === "EXPRESION_ARITMETICA") {
            const izq = this.traducirExpresion(expresion.izquierda);
            const der = this.traducirExpresion(expresion.derecha);
            const op = this.traducirOperador(expresion.operador);

            if (op === "+") {
                return this.simplificarConcatenacion(izq, der, expresion.izquierda, expresion.derecha);
            }

            return `${izq} ${op} ${der}`;
        }

        return expresion.valor || "";
    }

    simplificarConcatenacion(izq, der, izqOrig, derOrig) {
        const izqStr = this.esString(izqOrig);
        const derStr = this.esString(derOrig);

        if (izqStr && !derStr) return `${izq} + str(${der})`;
        if (!izqStr && derStr) return `str(${izq}) + ${der}`;
        if (!izqStr && !derStr) return `str(${izq}) + str(${der})`;
        return `${izq} + ${der}`;
    }

    esString(expresion) {
        return expresion?.tipo === "PRIMARIO" &&
            (expresion.tipoDato === "STRING" || expresion.tipoDato === "CHAR");
    }

    traducirPrimario(primario) {
        if (!primario) return "";

        switch (primario.tipoDato) {
            case "TRUE": return "True";
            case "FALSE": return "False";
            case "STRING":
            case "CHAR":
                return primario.valor;
            default:
                return primario.valor;
        }
    }

    traducirOperador(op) {
        const ops = {
            "+": "+", 
            "-": "-", 
            "*": "*", 
            "/": "//",
            "==": "==", 
            "!=": "!=", 
            ">": ">", 
            "<": "<",
            ">=": ">=", 
            "<=": "<=", 
            "&&": "and", 
            "||": "or"
        };
        return ops[op] || op;
    }

    valorPorDefecto(tipo) {
        const defaults = {
            "int": "0", 
            "double": "0.0", 
            "char": "''",
            "String": '""', 
            "boolean": "False"
        };
        return defaults[tipo] || "None";
    }
}