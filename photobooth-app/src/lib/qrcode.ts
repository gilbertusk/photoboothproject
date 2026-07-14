import QRCode from 'qrcode'

export async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}
