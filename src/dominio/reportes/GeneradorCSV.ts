// Generador de CSV - Dominio (utilidad compartida por los reportes)

const escaparCelda = (valor: unknown): string => {
  const texto = valor === null || valor === undefined ? '' : String(valor)
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

export const generarCSV = (encabezados: string[], filas: (string | number)[][]): string => {
  const lineas = [encabezados.map(escaparCelda).join(',')]
  filas.forEach((fila) => {
    lineas.push(fila.map(escaparCelda).join(','))
  })
  // BOM al inicio para que Excel detecte UTF-8 correctamente (acentos, ñ)
  return '\uFEFF' + lineas.join('\r\n')
}

export const descargarCSV = (nombreArchivo: string, contenido: string): void => {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
