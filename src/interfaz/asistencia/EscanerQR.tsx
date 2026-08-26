// Componente Escaner QR - Interfaz
// La libreria 'html5-qrcode' (pesa ~340 KB) se carga de forma diferida
// con import() dinamico dentro del efecto, solo cuando el modo QR se
// activa. Un docente que use solo el pase de lista manual nunca
// descarga esos 340 KB.

import { useEffect, useRef } from 'react'
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode'

interface EscanerQRProps {
  activo: boolean
  onLectura: (textoDecodificado: string) => void
}

const CONTENEDOR_ID = 'qr-reader-asistencia'

export const EscanerQR = ({ activo, onLectura }: EscanerQRProps) => {
  const ultimoRef = useRef<{ texto: string; t: number }>({ texto: '', t: 0 })
  const onLecturaRef = useRef(onLectura)
  onLecturaRef.current = onLectura

  useEffect(() => {
    if (!activo) return

    let cancelado = false
    let lector: Html5QrcodeType | null = null

    const iniciar = async () => {
      const { Html5Qrcode } = await import('html5-qrcode') // carga diferida

      await new Promise((resolve) => setTimeout(resolve, 50))
      if (cancelado) return

      lector = new Html5Qrcode(CONTENEDOR_ID)

      try {
        await lector.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (textoDecodificado) => {
            const ahora = Date.now()
            if (
              textoDecodificado === ultimoRef.current.texto &&
              ahora - ultimoRef.current.t < 2500
            ) {
              return
            }
            ultimoRef.current = { texto: textoDecodificado, t: ahora }
            onLecturaRef.current(textoDecodificado)
          },
          () => {
            // Frames sin QR detectado - normal, no es un error real.
          }
        )
      } catch (err) {
        if (!cancelado) {
          console.error('EscanerQR: no se pudo iniciar la camara', err)
        }
      }
    }

    iniciar()

    return () => {
      cancelado = true
      if (lector) {
        lector
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              lector?.clear()
            } catch {
              // noop
            }
          })
      }
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
