class Error {
    constructor(tipo, valor, descripcion, linea, columna) {
        this.tipo = tipo || "Desconocido";
        this.valor = valor || "N/A";
        this.descripcion = descripcion || "Error desconocido";
        this.linea = linea || 1;
        this.columna = columna || 1;
    }
}
