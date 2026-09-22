# Build nativo (iOS / Android) — Oxyvra Biossegurança

## 1. Preparar
```bash
npm run build            # gera dist/client (assets) e dist/server (SSR)
npx cap add android      # apenas na primeira vez
npx cap add ios          # apenas na primeira vez (macOS + Xcode)
npx cap sync
```

> O app é renderizado no servidor (TanStack Start). O shell nativo carrega a versão
> publicada definida em `capacitor.config.ts`
> (`https://oxyvra-shine-team.lovable.app` por padrão). Publique antes de gerar o build
> das lojas. Para apontar para outro ambiente ou usar hot-reload na rede local:
> `CAP_SERVER_URL=http://192.168.0.10:8080 npx cap sync`
>
> A fila offline (`oxyvra-offline.ts`) continua guardando os registros no aparelho e
> sincronizando quando a conexão volta.


## 2. Ícones e splash
Fontes: `public/icon-512.png` (ícone) e `public/splash.png` (splash 1280x1280).
```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#0B2238' --splashBackgroundColor '#0B2238'
```

## 3. Permissões nativas (justificativas para as lojas)

Arquivos prontos para copiar:
- Android → `native/AndroidManifest.permissions.xml` (colar dentro de
  `android/app/src/main/AndroidManifest.xml`, após `<manifest>` e antes de `<application>`)
- iOS → `native/Info.plist.permissions.xml` (colar dentro do `<dict>` principal de
  `ios/App/App/Info.plist`)

Permissões usadas e onde:
| Permissão | Onde é usada | Obrigatória |
| --- | --- | --- |
| Câmera | leitura do QR Code do ambiente e foto de evidência com marca d'água | sim, para registrar limpeza |
| Localização (em uso) | geofencing de 150 m para validar presença na unidade | sim, para validar o registro |
| Internet | sincronização com a nuvem (o app funciona offline com fila) | sim |

Não usamos: galeria de fotos, microfone, contatos, localização em segundo plano,
identificadores de publicidade.

### Texto para Google Play / App Store
- **Câmera**: obrigatória para capturar a evidência fotográfica com marca d'água
  no momento da execução do serviço (não há acesso à galeria).
- **Localização precisa (apenas em uso)**: valida por geofencing (raio de 150 m) que o
  colaborador está fisicamente na unidade auditada. Não há rastreamento em segundo plano.
- Nenhum dado é usado para publicidade. Ver Política de Privacidade em `/privacidade`.

### Comportamento quando o usuário nega
O app não trava: exibe mensagem explicando como reativar nas configurações e permite
tentar novamente. Registros sem GPS/foto ficam marcados como não conformes na auditoria.

## 4. Conta de revisão (Google Play)
- E-mail: `google.test@oxyvra.com`
- Senha: `TesteGooglePlay123!`
- Acesso completo com dados fictícios (1 unidade demo, relatórios e checklist).

## 5. Rodar
```bash
npx cap run android
npx cap run ios
```
