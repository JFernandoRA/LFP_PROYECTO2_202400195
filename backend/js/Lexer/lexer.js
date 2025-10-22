class Lexer {
    constructor(texto) {
        this.texto = texto;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.errors = [];
    }

    avanzar() {
        if (this.pos < this.texto.length) {
            if (this.texto[this.pos] === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            this.pos++;
        }
    }

    analizar() {
        this.tokens = [];
        this.errors = [];
        this.pos = 0;
        this.line = 1;
        this.column = 1;

        while (this.pos < this.texto.length) {
            let char = this.texto[this.pos];
            let inicioLine = this.line;
            let inicioCol = this.column;

            if (char === " " || char === "\t" || char === "\r") {
                this.avanzar();
                continue;
            }

         
            if (char === "\n") {
                this.avanzar();
                continue;
            }


            if (char === '/' && this.texto[this.pos + 1] === '/') {
                while (this.pos < this.texto.length && this.texto[this.pos] !== '\n') {
                    this.avanzar();
                }
                continue;
            }

            if (char === '/' && this.texto[this.pos + 1] === '*') {
                this.avanzar();
                this.avanzar(); 
                
                while (this.pos < this.texto.length - 1) {
                    if (this.texto[this.pos] === '*' && this.texto[this.pos + 1] === '/') {
                        this.avanzar(); 
                        this.avanzar(); 
                        break;
                    }
                    if (this.texto[this.pos] === '\n') {
                        this.line++;
                        this.column = 1;
                    }
                    this.avanzar();
                }
                continue;
            }

            let simboloProcesado = this.procesarSimbolo();
            if (simboloProcesado) continue;

            if (this.esLetra(char) || char === '_') {
                this.recorrerIdentificador();
                continue;
            }

            if (this.esDigito(char) || (char === '-' && this.esDigito(this.texto[this.pos + 1]))) {
                this.recorrerNumero();
                continue;
            }

            if (char === '"') {
                this.recorrerCadena();
                continue;
            }

            if (char === "'") {
                this.recorrerCaracter();
                continue;
            }

            this.agregarErrorLexico(char, "Carácter no reconocido", this.line, this.column);
            this.avanzar();
        }
        
        return { tokens: this.tokens, errors: this.errors };
    }

    procesarSimbolo() {
        let char = this.texto[this.pos];
        let next = this.texto[this.pos + 1] || "";

        const simboloDoble = char + next;
        if (Symbols[simboloDoble]) {
            this.tokens.push(new Token(Symbols[simboloDoble], simboloDoble, this.line, this.column));
            this.avanzar();
            this.avanzar();
            return true;
        }


        if (Symbols[char]) {
            this.tokens.push(new Token(Symbols[char], char, this.line, this.column));
            this.avanzar();
            return true;
        }

        return false;
    }

    recorrerIdentificador() {
        let inicioCol = this.column;
        let buffer = "";
        
        while (this.pos < this.texto.length &&
               (this.esLetra(this.texto[this.pos]) || 
                this.esDigito(this.texto[this.pos]) || 
                this.texto[this.pos] === '_')) {
            buffer += this.texto[this.pos];
            this.avanzar();
        }

        let tipo = "IDENTIFICADOR";
        if (ReservedWords[buffer]) {
            tipo = ReservedWords[buffer];
        }

        this.tokens.push(new Token(tipo, buffer, this.line, inicioCol));
    }

    recorrerNumero() {
        let inicioCol = this.column;
        let buffer = "";
        let esDecimal = false;
        let tieneError = false;

        if (this.texto[this.pos] === '-') {
            buffer += this.texto[this.pos];
            this.avanzar();
        }

        while (this.pos < this.texto.length &&
               (this.esDigito(this.texto[this.pos]) || this.texto[this.pos] === '.')) {

            if (this.texto[this.pos] === '.') {
                if (esDecimal) {
                    tieneError = true;
                }
                esDecimal = true;
            }

            buffer += this.texto[this.pos];
            this.avanzar();
        }

        if (tieneError || buffer === '-' || buffer === '.') {
            this.agregarErrorLexico(buffer, "Número mal formado", this.line, inicioCol);
        } else {
            const tipo = esDecimal ? "DOUBLE" : "INT";
            this.tokens.push(new Token(tipo, buffer, this.line, inicioCol));
        }
    }

    recorrerCadena() {
        let inicioCol = this.column;
        let buffer = '"';
        this.avanzar(); 

        let cerrada = false;
        
        while (this.pos < this.texto.length) {
            let char = this.texto[this.pos];
            
            if (char === '"') {
                buffer += char;
                this.avanzar();
                cerrada = true;
                break;
            }
            
            if (char === '\n') {
                break;
            }
            
            buffer += char;
            this.avanzar();
        }

        if (cerrada) {
            this.tokens.push(new Token("STRING", buffer, this.line, inicioCol));
        } else {
            this.agregarErrorLexico(buffer, "Cadena sin cerrar", this.line, inicioCol);
        }
    }

    recorrerCaracter() {
        let inicioCol = this.column;
        let buffer = "'";
        this.avanzar();
        if (this.pos >= this.texto.length) {
            this.agregarErrorLexico(buffer, "Carácter mal formado", this.line, inicioCol);
            return;
        }

        buffer += this.texto[this.pos];
        this.avanzar();

        if (this.pos < this.texto.length && this.texto[this.pos] === "'") {
            buffer += this.texto[this.pos];
            this.avanzar();
            this.tokens.push(new Token("CHAR", buffer, this.line, inicioCol));
        } else {
            this.agregarErrorLexico(buffer, "Carácter mal formado", this.line, inicioCol);
        }
    }

    agregarErrorLexico(valor, descripcion, linea, columna) {
        const error = new Error("Léxico", valor, descripcion, linea, columna);
        this.errors.push(error);
        this.tokens.push(new Token("ERROR", valor, linea, columna));
    }

    esLetra(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }

    esDigito(c) {
        return c >= '0' && c <= '9';
    }
}