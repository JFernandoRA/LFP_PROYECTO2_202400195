class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.errors = [];
        this.ast = null;
    }

    analizar() {
        this.errors = [];
        this.pos = 0;
        this.ast = null;

        try {
            this.ast = this.PROGRAMA();
            
            if (this.pos < this.tokens.length) {
                const tokenExtra = this.tokens[this.pos];
                if (tokenExtra.type !== "LLAVE_DER") { 
                    this.agregarError("Sintáctico", tokenExtra.value, 
                        "Código adicional inesperado", tokenExtra.line, tokenExtra.column);
                }
            }
        } catch (error) {
            console.error("Error crítico en parser:", error);
            this.agregarError("Sintáctico", "INTERNO", "Error interno del parser", 1, 1);
        }

        return { ast: this.ast, errors: this.errors };
    }

    PROGRAMA() {
        if (!this.verificarValor("public")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'public'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.verificarValor("class")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'class'", this.actual().line, this.actual().column);
            return null;
        }

        const nombreClase = this.actual();
        if (nombreClase.type !== "IDENTIFICADOR") {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba nombre de clase", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        if (!this.coincide("LLAVE_IZQ")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '{'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        const main = this.MAIN();
        if (!main) {
            return null;
        }

        if (!this.coincide("LLAVE_DER")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '}'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        return {
            tipo: "PROGRAMA",
            nombre: nombreClase.value,
            main: main
        };
    }

    MAIN() {
        if (!this.verificarValor("public")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'public'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.verificarValor("static")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'static'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.verificarValor("void")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'void'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.verificarValor("main")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'main'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.coincide("PAR_IZQ")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '('", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        if (!this.verificarValor("String")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'String'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.coincide("CORCHETE_IZQ")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '['", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        if (!this.coincide("CORCHETE_DER")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba ']'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        if (!this.verificarValor("args")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'args'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.coincide("PAR_DER")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba ')'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        if (!this.coincide("LLAVE_IZQ")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '{'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        const sentencias = this.SENTENCIAS();

        if (!this.coincide("LLAVE_DER")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '}'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        return {
            tipo: "MAIN",
            args: "args",
            sentencias: sentencias || []
        };
    }

    SENTENCIAS() {
        const sentencias = [];
        
        while (this.pos < this.tokens.length && !this.coincide("LLAVE_DER")) {
            const tokenActual = this.actual();

            if (tokenActual.type === "ERROR") {
                this.avanzar();
                continue;
            }

            const sentencia = this.SENTENCIA();
            if (sentencia) {
                sentencias.push(sentencia);
            } else {
                this.saltarHastaRecuperacion();
            }
        }

        return sentencias;
    }

    SENTENCIA() {
        const token = this.actual();
        if (!token || token.type === "LLAVE_DER") return null;

        try {
            if (this.esTipo(token.value)) {
                return this.DECLARACION();
            } else if (this.coincide("IDENTIFICADOR")) {
                return this.ASIGNACION();
            } else if (token.value === "System") {
                return this.PRINT();
            } else if (this.coincide("SEMICOLON")) {
                this.avanzar();
                return { tipo: "VACIO" };
            } else {
                this.agregarError("Sintáctico", token.value, "Sentencia no válida", token.line, token.column);
                this.avanzar();
                return null;
            }
        } catch (error) {
            this.agregarError("Sintáctico", token.value, "Error procesando sentencia", token.line, token.column);
            return null;
        }
    }

    DECLARACION() {
        const tipo = this.actual().value;
        this.avanzar();

        const id = this.actual();
        if (!this.coincide("IDENTIFICADOR")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba identificador", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        let expresion = null;
        if (this.coincide("EQUAL")) {
            this.avanzar();
            expresion = this.EXPRESION();
        }

        if (!this.coincide("SEMICOLON")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba ';'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        return {
            tipo: "DECLARACION",
            tipoDato: tipo,
            variables: [{
                tipo: "VARIABLE",
                nombre: id.value,
                valor: expresion
            }]
        };
    }

    ASIGNACION() {
        const id = this.actual();
        this.avanzar();

        if (!this.coincide("EQUAL")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '='", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        const expresion = this.EXPRESION();

        if (!this.coincide("SEMICOLON")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba ';'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        return {
            tipo: "ASIGNACION",
            nombre: id.value,
            valor: expresion
        };
    }

    PRINT() {
        this.avanzar(); 

        if (!this.coincide("DOT")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '.'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        if (!this.verificarValor("out")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'out'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.coincide("DOT")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '.'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        if (!this.verificarValor("println")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba 'println'", this.actual().line, this.actual().column);
            return null;
        }

        if (!this.coincide("PAR_IZQ")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba '('", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        const expresion = this.EXPRESION();

        if (!this.coincide("PAR_DER")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba ')'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        if (!this.coincide("SEMICOLON")) {
            this.agregarError("Sintáctico", this.actual().value, "Se esperaba ';'", this.actual().line, this.actual().column);
            return null;
        }
        this.avanzar();

        return {
            tipo: "PRINT",
            expresion: expresion
        };
    }

    EXPRESION() {
        return this.EXPRESION_LOGICA();
    }

    EXPRESION_LOGICA() {
        let izquierda = this.EXPRESION_RELACIONAL();

        while (this.coincide("AND") || this.coincide("OR")) {
            const operador = this.actual().value;
            this.avanzar();
            const derecha = this.EXPRESION_RELACIONAL();
            
            izquierda = {
                tipo: "EXPRESION_LOGICA",
                operador: operador,
                izquierda: izquierda,
                derecha: derecha
            };
        }

        return izquierda;
    }

    EXPRESION_RELACIONAL() {
        let izquierda = this.EXPRESION_ARITMETICA();

        while (this.coincide("EQUAL_EQUAL") || this.coincide("NOT_EQUAL") || 
               this.coincide("GREATER") || this.coincide("LESS") ||
               this.coincide("GREATER_EQUAL") || this.coincide("LESS_EQUAL")) {
            
            const operador = this.actual().value;
            this.avanzar();
            const derecha = this.EXPRESION_ARITMETICA();
            
            izquierda = {
                tipo: "EXPRESION_RELACIONAL",
                operador: operador,
                izquierda: izquierda,
                derecha: derecha
            };
        }

        return izquierda;
    }

    EXPRESION_ARITMETICA() {
        let izquierda = this.TERMINO();

        while (this.coincide("PLUS") || this.coincide("MINUS")) {
            const operador = this.actual().value;
            this.avanzar();
            const derecha = this.TERMINO();
            
            izquierda = {
                tipo: "EXPRESION_ARITMETICA",
                operador: operador,
                izquierda: izquierda,
                derecha: derecha
            };
        }

        return izquierda;
    }

    TERMINO() {
        let izquierda = this.FACTOR();

        while (this.coincide("MULTIPLY") || this.coincide("DIVIDE")) {
            const operador = this.actual().value;
            this.avanzar();
            const derecha = this.FACTOR();
            
            izquierda = {
                tipo: "EXPRESION_ARITMETICA",
                operador: operador,
                izquierda: izquierda,
                derecha: derecha
            };
        }

        return izquierda;
    }

    FACTOR() {
        const token = this.actual();

        if (this.coincide("IDENTIFICADOR") || this.coincide("INT") || 
            this.coincide("DOUBLE") || this.coincide("STRING") || 
            this.coincide("CHAR") || this.coincide("TRUE") || 
            this.coincide("FALSE")) {
            
            this.avanzar();
            return {
                tipo: "PRIMARIO",
                valor: token.value,
                tipoDato: token.type
            };
        } else if (this.coincide("PAR_IZQ")) {
            this.avanzar();
            const expresion = this.EXPRESION();
            
            if (!this.coincide("PAR_DER")) {
                this.agregarError("Sintáctico", this.actual().value, "Se esperaba ')'", this.actual().line, this.actual().column);
                return null;
            }
            this.avanzar();
            return expresion;
        } else {
            this.agregarError("Sintáctico", token.value, "Expresión no válida", token.line, token.column);
            this.avanzar();
            return null;
        }
    }

    // MÉTODOS AUXILIARES
    saltarHastaRecuperacion() {
        const tokensInicial = this.pos;
        while (this.pos < this.tokens.length) {
            const token = this.actual();
            if (this.coincide("SEMICOLON") || this.coincide("LLAVE_DER") || 
                this.esTipo(token.value) || token.value === "System" || 
                token.type === "IDENTIFICADOR") {
                break;
            }
            this.avanzar();
        }
        return this.pos - tokensInicial;
    }

    buscarSiguiente(tipoToken) {
        while (this.pos < this.tokens.length && !this.coincide(tipoToken)) {
            this.avanzar();
        }
        return this.pos < this.tokens.length;
    }

    verificarValor(valorEsperado) {
        if (this.pos < this.tokens.length && this.tokens[this.pos].value === valorEsperado) {
            this.avanzar();
            return true;
        }
        return false;
    }

    coincide(tipoEsperado) {
        return this.pos < this.tokens.length && this.tokens[this.pos].type === tipoEsperado;
    }

    actual() {
        if (this.pos < this.tokens.length) {
            return this.tokens[this.pos];
        }
        return { value: "EOF", type: "EOF", line: 1, column: 1 };
    }

    avanzar() {
        if (this.pos < this.tokens.length) {
            this.pos++;
        }
    }

    esTipo(valor) {
        const tipos = ["int", "double", "String", "char", "boolean"];
        return tipos.includes(valor);
    }

    agregarError(tipo, valor, descripcion, linea, columna) {
        const error = new Error(tipo, valor, descripcion, linea, columna);
        this.errors.push(error);
    }
}