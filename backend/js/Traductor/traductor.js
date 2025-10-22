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
            case "PRINT":
                this.codigoPython += `${indentacion}print(${this.traducirExpresion(sentencia.expresion)})\n`;
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

    traducirExpresion(expresion) {
        if (!expresion) return "";
        
        if (expresion.tipo === "PRIMARIO") {
            return this.traducirPrimario(expresion);
        }
        
        if (expresion.tipo.includes("EXPRESION")) {
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
            "+": "+", "-": "-", "*": "*", "/": "/",
            "==": "==", "!=": "!=", ">": ">", "<": "<", 
            ">=": ">=", "<=": "<=", "&&": "and", "||": "or"
        };
        return ops[op] || op;
    }

    valorPorDefecto(tipo) {
        const defaults = {
            "int": "0", "double": "0.0", "char": "''", 
            "String": '""', "boolean": "False"
        };
        return defaults[tipo] || "None";
    }
}