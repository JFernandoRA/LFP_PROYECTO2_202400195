let lexer;
let parser;
let traductor;

function generarTraduccion() {
    const codigoJava = document.getElementById('javaEditor').value;

    document.getElementById('pythonOutput').value = "";
    limpiarReportes();

    if (!codigoJava.trim()) {
        document.getElementById('pythonOutput').value = "// No hay código Java para traducir.";
        return;
    }

    lexer = new Lexer(codigoJava);
    const resultadoLexico = lexer.analizar();

    actualizarContadorTokens(resultadoLexico.tokens.length);

    generarReporteTokens(resultadoLexico.tokens);

    if (resultadoLexico.errors.length > 0) {
        mostrarErroresLexicos(resultadoLexico.errors);
    }

    // Análisis Sintáctico - SIEMPRE se ejecuta, incluso con errores léxicos
    parser = new Parser(resultadoLexico.tokens);
    const resultadoSintactico = parser.analizar();

    // SIEMPRE mostrar errores sintácticos si existen
    if (resultadoSintactico.errors.length > 0) {
        mostrarErroresSintacticos(resultadoSintactico.errors);
    }

    // Decidir si generar Python o mostrar errores
    const hayErroresLexicos = resultadoLexico.errors.length > 0;
    const hayErroresSintacticos = resultadoSintactico.errors.length > 0;

    if (hayErroresLexicos || hayErroresSintacticos) {
        let mensajeError = "// ";
        if (hayErroresLexicos && hayErroresSintacticos) {
            mensajeError += "ERRORES LÉXICOS Y SINTÁCTICOS DETECTADOS";
        } else if (hayErroresLexicos) {
            mensajeError += "ERRORES LÉXICOS DETECTADOS";
        } else {
            mensajeError += "ERRORES SINTÁCTICOS DETECTADOS";
        }
        mensajeError += "\n// No se puede generar Python hasta corregir los errores.";
        document.getElementById('pythonOutput').value = mensajeError;
    } else {
        // SOLO si no hay errores, generar Python
        traductor = new Traductor();
        const resultadoTraduccion = traductor.traducir(resultadoSintactico.ast);
        document.getElementById('pythonOutput').value = resultadoTraduccion.codigo;
    }
}

function verTokens() {
    const codigoJava = document.getElementById('javaEditor').value;

    if (!codigoJava.trim()) {
        alert("No hay código Java para analizar.");
        return;
    }

    lexer = new Lexer(codigoJava);
    const resultado = lexer.analizar();

    actualizarContadorTokens(resultado.tokens.length);

    // SIEMPRE mostrar tokens
    generarReporteTokens(resultado.tokens);
    
    // Si hay errores léxicos, mostrarlos también
    if (resultado.errors.length > 0) {
        mostrarErroresLexicos(resultado.errors);
    }
}

function mostrarErroresLexicos(errores) {
    const reportesDiv = document.getElementById('reportes');
    let html = '<h3>Reporte de Errores Léxicos</h3>';
    html += '<table><tr><th>No.</th><th>Error</th><th>Descripción</th><th>Línea</th><th>Columna</th></tr>';

    if (errores.length === 0) {
        html += '<tr><td colspan="5">No hay errores léxicos</td></tr>';
    } else {
        errores.forEach((error, indice) => {
            html += `<tr class="error-row">
                <td>${indice + 1}</td>
                <td>${escapeHtml(error.valor)}</td>
                <td>${escapeHtml(error.descripcion)}</td>
                <td>${error.linea}</td>
                <td>${error.columna}</td>
            </tr>`;
        });
    }

    html += '</table>';
    
    // Agregar al contenido existente
    const contenidoActual = reportesDiv.innerHTML;
    reportesDiv.innerHTML = contenidoActual + html;
}


function mostrarErroresSintacticos(errores) {
    const reportesDiv = document.getElementById('reportes');
    let html = '<h3>Reporte de Errores Sintácticos</h3>';
    html += '<table><tr><th>No.</th><th>Error</th><th>Descripción</th><th>Línea</th><th>Columna</th></tr>';

    if (errores.length === 0) {
        html += '<tr><td colspan="5">No hay errores sintácticos</td></tr>';
    } else {
        errores.forEach((error, indice) => {
            html += `<tr class="error-row">
                <td>${indice + 1}</td>
                <td>${escapeHtml(error.valor)}</td>
                <td>${escapeHtml(error.descripcion)}</td>
                <td>${error.linea}</td>
                <td>${error.columna}</td>
            </tr>`;
        });
    }

    html += '</table>';
    
    // Agregar al contenido existente
    const contenidoActual = reportesDiv.innerHTML;
    reportesDiv.innerHTML = contenidoActual + html;
}

function generarReporteTokens(tokens) {
    const reportesDiv = document.getElementById('reportes');
    let html = '<h3>Reporte de Tokens</h3>';
    
    // Tabla de tokens
    html += '<table><tr><th>No.</th><th>Lexema</th><th>Tipo</th><th>Línea</th><th>Columna</th></tr>';

    if (tokens.length === 0) {
        html += '<tr><td colspan="5">No hay tokens</td></tr>';
    } else {
        tokens.forEach((token, indice) => {
            const clase = token.type === "ERROR" ? 'class="error-row"' : '';
            html += `<tr ${clase}>
                <td>${indice + 1}</td>
                <td>${escapeHtml(token.value)}</td>
                <td>${token.type}</td>
                <td>${token.line}</td>
                <td>${token.column}</td>
            </tr>`;
        });
    }

    html += '</table>';
    reportesDiv.innerHTML = html;
}

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function limpiarReportes() {
    document.getElementById('reportes').innerHTML = "";
}

function actualizarContadorTokens(cantidad) {
    document.getElementById('tokenCount').textContent = `Tokens generados: ${cantidad}`;
}

function nuevoArchivo() {
    if (confirm("¿Estás seguro de que quieres crear un nuevo archivo? Se perderán los cambios no guardados.")) {
        document.getElementById('javaEditor').value = "";
        document.getElementById('pythonOutput').value = "";
        limpiarReportes();
        actualizarContadorTokens(0);
    }
}

function abrirArchivo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.java';

    input.onchange = function(event) {
        const archivo = event.target.files[0];
        if (archivo) {
            const lector = new FileReader();
            lector.onload = function(e) {
                document.getElementById('javaEditor').value = e.target.result;
                // Limpiar output cuando se carga nuevo archivo
                document.getElementById('pythonOutput').value = "";
                limpiarReportes();
                actualizarContadorTokens(0);
            };
            lector.readAsText(archivo);
        }
    };
    input.click();
}

function guardarJava() {
    const contenido = document.getElementById('javaEditor').value;
    if (!contenido.trim()) {
        alert("No hay código Java para guardar.");
        return;
    }
    guardarArchivo(contenido, 'programa.java', 'text/plain');
}

function guardarPython() {
    const contenido = document.getElementById('pythonOutput').value;

    // VERIFICACIÓN ESTRICTA - No guardar si hay errores
    if (!contenido.trim()) {
        alert("No hay código Python generado para guardar.");
        return;
    }

    if (contenido.includes('ERRORES') ||
        contenido.includes('Errores') ||
        contenido.includes('Error:') ||
        contenido.includes('No se puede generar') ||
        contenido.startsWith('//')) {
        alert("NO SE PUEDE GUARDAR: Hay errores en el código Java. Corrija los errores y genere la traducción primero.");
        return;
    }

    // Verificar que es código Python válido (contiene la cabecera esperada)
    if (!contenido.includes('# Traducido de Java a Python')) {
        alert('No hay una traducción válida para guardar. Genere la traducción primero.');
        return;
    }

    guardarArchivo(contenido, 'programa_traducido.py', 'text/plain');
}

function guardarArchivo(contenido, nombre, tipo) {
    try {
        const blob = new Blob([contenido], { type: tipo });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error al guardar el archivo: ' + error.message);
    }
}

function simularEjecucion() {
    const codigoPython = document.getElementById('pythonOutput').value;

    if (!codigoPython.trim() || codigoPython.includes('ERRORES') || codigoPython.includes('Errores')) {
        alert('No hay código Python válido para simular ejecución. Genere una traducción exitosa primero.');
        return;
    }

    // Simulación básica - mostrar el código Python en un alert
    alert("SIMULACIÓN DE EJECUCIÓN:\n\nEl siguiente código Python estaría listo para ejecutar:\n\n" + codigoPython);
}

function mostrarAcercaDe() {
    alert('JavaBridge - Traductor de Java a Python:\n\n' +
    'Desarrollado para el curso de Lenguajes Formales y de Programación\n\n' +
    'Universidad: Universidad de San Carlos de Guatemala\n' +
    'Facultad: Facultad de Ingeniería\n' +
    'Carrera: Ingeniería en Ciencias y Sistemas\n\n' +
    'Autor: José Fernando Ramirez Ambrocio\n' +
    'Carné: 202400195\n\n' +
    'Funcionalidades:\n' +
    '• Análisis Léxico Manual\n' +
    '• Análisis Sintáctico Manual\n' +
    '• Traducción Java → Python\n' +
    '• Reportes HTML de Tokens y Errores\n' +
    '• Interfaz Web Completa');
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Código inicial ya está en el textarea
    actualizarContadorTokens(0);
});