// ==================== CLASE TOKEN ====================
class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

// ==================== PALABRAS RESERVADAS ====================
const ReservedWords = {
    "public": "PALABRA_RESERVADA",
    "class": "PALABRA_RESERVADA",
    "static": "PALABRA_RESERVADA",
    "void": "PALABRA_RESERVADA",
    "main": "PALABRA_RESERVADA",
    "String": "STRING_TYPE",
    "args": "ARGS",
    "int": "INT_TYPE",
    "double": "DOUBLE_TYPE",
    "char": "CHAR_TYPE",
    "boolean": "BOOLEAN_TYPE",
    "true": "TRUE",
    "false": "FALSE",
    "if": "IF",
    "else": "ELSE",
    "for": "FOR",
    "while": "WHILE",
    "System": "SYSTEM",
    "out": "OUT",
    "println": "PRINTLN"
};

// ==================== SÍMBOLOS ====================
const Symbols = {
    "{": "LLAVE_IZQ",
    "}": "LLAVE_DER",
    "(": "PAR_IZQ",
    ")": "PAR_DER",
    "[": "CORCHETE_IZQ",
    "]": "CORCHETE_DER",
    ";": "SEMICOLON",
    ",": "COMMA",
    ".": "DOT",
    "==": "EQUAL_EQUAL",
    "!=": "NOT_EQUAL",
    ">=": "GREATER_EQUAL",
    "<=": "LESS_EQUAL",
    "++": "INCREMENT",
    "--": "DECREMENT",
    "&&": "AND",
    "||": "OR",
    "=": "EQUAL",
    "+": "PLUS",
    "-": "MINUS",
    "*": "MULTIPLY",
    "/": "DIVIDE",
    ">": "GREATER",
    "<": "LESS"
};