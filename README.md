# DevTools PWA â Projeto Android (Capacitor)

## Origem
URL: https://insight-dashboard-meulegale1.replit.app

## Estrutura
```
âââ dist/           â Arquivos do PWA (jÃ¡ embutidos)
âââ android/        â Projeto Android Studio
â   âââ app/
â   â   âââ src/main/
â   âââ build.gradle
â   âââ settings.gradle
âââ capacitor.config.ts
âââ README.md
```

## Como compilar o APK

### Requisitos
- Android Studio (https://developer.android.com/studio)
- Java 17+
- Android SDK 34

### Passo a passo
1. Extraia este ZIP
2. Abra o Android Studio â File â Open â pasta `android/`
3. Aguarde Gradle sync (~5 min na primeira vez)
4. **Build â Build Bundle(s)/APK(s) â Build APK(s)**
5. APK gerado: `android/app/build/outputs/apk/debug/app-debug.apk`

### Para instalar no celular
- ConfiguraÃ§Ãµes â SeguranÃ§a â Fontes desconhecidas â
- Transfira o .apk e abra para instalar

### Para assinar (Google Play)
- Build â Generate Signed Bundle/APK
- Crie um keystore e guarde em seguranÃ§a

## ConfiguraÃ§Ã£o
- **Package:** `com.insight.dashboard.meulegale1.replit.app`
- **VersÃ£o:** 1.0.0 (code: 1)
- **Min SDK:** Android 22+
- **OrientaÃ§Ã£o:** portrait
