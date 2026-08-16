// Componente Escaner QR - Interfaz
// Envuelve la libreria html5-qrcode con el mismo comportamiento que
// tenia el legacy (js/app.js): camara trasera, debounce de 2.5s para
// evitar lecturas dobles del mismo codigo.

import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface EscanerQRProps {
  activo: boolean
  onLectura: (textoDecodificado: string) => void
}

const CONTENEDOR_ID = 'qr-reader-asistencia'

export const EscanerQR = ({ activo, onLectura }: EscanerQRProps) => {
  const lectorRef = useRef<Html5Qrcode | null>(null)
  const ultimoRef = useRef<{ texto: string; t: number }>({ texto: '', t: 0 })
  const onLecturaRef = useRef(onLectura)
  onLecturaRef.current = onLectura

  useEffect(() => {
    if (!activo) return

    const lector = new Html5Qrcode(CONTENEDOR_ID)
    lectorRef.current = lector
    //let detenido = false

    lector
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (textoDecodificado) => {
          const ahora = Date.now()
          if (
            textoDecodificado === ultimoRef.current.texto &&
            ahora - ultimoRef.current.t < 2500
          ) {
            return // evita procesar el mismo codigo dos veces seguidas
          }
          ultimoRef.current = { texto: textoDecodificado, t: ahora }
          onLecturaRef.current(textoDecodificado)
        },
        () => {
          // Frames sin QR detectado - es normal, no es un error real.
        }
      )
      .catch((err) => {
        console.error('EscanerQR: no se pudo iniciar la camara', err)
      })

    return () => {
      //detenido = true
      lector
        .stop()
        .catch(() => {})
        .finally(() => {
          try {
            lector.clear()
          } catch {
            // noop
          }
        })
    }
  }, [activo])

  if (!activo) return null

  return (
    <div>
      <div id={CONTENEDOR_ID} className="qr-reader" />
      <p className="qr-ayuda">
        Apunta la cámara al código QR de la credencial del alumno. El registro
        se guarda automáticamente al detectarlo.
      </p>
    </div>
  )
}
