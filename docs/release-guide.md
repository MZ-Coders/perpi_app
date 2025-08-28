# Guia de Release - Perpi App

Este guia descreve o processo para gerar arquivos APK e AAB para o aplicativo Perpi, seja para testes ou para publicação nas lojas de aplicativos (Google Play Store e Apple App Store).

> Documento criado em 28 de agosto de 2025 para o projeto Perpi App (MZ-Coders/perpi_app)

## Configuração Atual do Projeto

O projeto já possui as seguintes configurações:

- **Package Android**: `com.perpi.market` (definido em app.json)
- **ID do Projeto EAS**: `ce0e7752-c6a6-4418-b877-719170d90d38` (definido em app.json)
- **Configuração EAS**: Perfis para development, preview, production e apk (definidos em eas.json)
- **Versão Atual**: 1.0.0

## Requisitos Prévios

- Node.js e npm/yarn instalados
- Android Studio (para builds Android)
- Xcode (para builds iOS, apenas em Mac)
- Conta no Expo (opcional, para EAS Build)
- Conta de desenvolvedor na Google Play e/ou Apple App Store (para publicação)

## Configurações Iniciais

### 1. Versão do App

Atualize a versão do aplicativo no arquivo `app.json`:

```json
{
  "expo": {
    "name": "perpi",
    "version": "1.0.0", // Incremente conforme necessário (ex: "1.0.1")
    ...
  }
}
```

### 2. Configuração da Chave de Assinatura (Android)

Para uma distribuição oficial, você precisa de uma chave de assinatura. Se você ainda não tem uma:

1. Gere uma chave usando o keytool:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure as credenciais no arquivo `android/gradle.properties`:
   ```properties
   MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=*****
   MYAPP_UPLOAD_KEY_PASSWORD=*****
   ```

3. Modifique `android/app/build.gradle` para usar essas credenciais:
   ```gradle
   signingConfigs {
       release {
           storeFile file(MYAPP_UPLOAD_STORE_FILE)
           storePassword MYAPP_UPLOAD_STORE_PASSWORD
           keyAlias MYAPP_UPLOAD_KEY_ALIAS
           keyPassword MYAPP_UPLOAD_KEY_PASSWORD
       }
   }
   buildTypes {
       release {
           ...
           signingConfig signingConfigs.release
       }
   }
   ```

## Métodos de Build

### Método 1: Build Local com Gradle (Android)

Este método gera um APK diretamente através do Gradle, sem depender do EAS Build. **Este foi o método utilizado na primeira release do Perpi App**.

1. Navegue até a pasta do projeto:
   ```bash
   cd /Users/joaomuchunja/Documents/euler/perpi_app
   ```

2. Execute o comando de build:
   ```bash
   cd android && ./gradlew assembleRelease
   ```

3. Aguarde a conclusão do build. O APK gerado estará disponível em:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

Para gerar um Android App Bundle (AAB) para a Google Play:
```bash
cd android && ./gradlew bundleRelease
```

O arquivo AAB estará em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Método 2: EAS Build (Recomendado)

O Expo Application Services (EAS) simplifica o processo de build e permite construir para iOS sem um Mac.

1. Certifique-se de estar logado na sua conta Expo:
   ```bash
   npx eas login
   ```

2. Configure o projeto para EAS Build (se ainda não configurado):
   ```bash
   npx eas build:configure
   ```

3. Para gerar um APK para testes:
   ```bash
   npx eas build -p android --profile apk
   ```

4. Para gerar um AAB para a Play Store:
   ```bash
   npx eas build -p android --profile production
   ```

5. Para iOS (requer conta Apple Developer):
   ```bash
   npx eas build -p ios --profile production
   ```

## Distribuição

### Google Play Store

1. Acesse o [Google Play Console](https://play.google.com/console)
2. Selecione o app ou crie um novo
3. Vá para "Produção" > "Criar versão"
4. Faça upload do arquivo AAB
5. Preencha as informações da versão
6. Envie para revisão

### App Store (iOS)

1. Acesse o [App Store Connect](https://appstoreconnect.apple.com/)
2. Selecione seu app ou crie um novo
3. Crie uma nova versão
4. Faça upload do arquivo IPA (pode ser feito via Transporter)
5. Preencha os metadados
6. Envie para revisão

## Build Mais Recente

O último build foi realizado em 28/08/2025 utilizando o método Gradle local:

```bash
cd /Users/joaomuchunja/Documents/euler/perpi_app/android && ./gradlew assembleRelease
```

O APK foi gerado em:
```
/Users/joaomuchunja/Documents/euler/perpi_app/android/app/build/outputs/apk/release/app-release.apk
```

### Notas Importantes sobre o Projeto Perpi

1. **Configuração EAS**: O arquivo `eas.json` já está configurado com perfis para diferentes tipos de build. Para usar o EAS Build, é necessário estar logado com a conta correta que tem acesso ao projeto.

2. **Autenticação**: Se você encontrar erros de autenticação ao usar EAS, verifique sua conta com:
   ```bash
   npx eas whoami
   ```
   
   Se necessário, faça login na conta correta:
   ```bash
   npx eas login
   ```

3. **Keystore**: O projeto atualmente usa a keystore de debug para assinatura. Para distribuição oficial, é recomendado configurar uma keystore de produção.

4. **Dependências Nativas**: O projeto utiliza vários pacotes que necessitam de configuração nativa, como `expo-location` e `react-native-maps`. Certifique-se de que as permissões no AndroidManifest.xml estão corretamente configuradas após atualizações.

## Solução de Problemas

### Erros comuns de assinatura Android

Se você encontrar erros relacionados à assinatura do APK:

1. Verifique se as credenciais no `gradle.properties` estão corretas
2. Execute `./gradlew clean` antes de tentar novamente
3. Garanta que o arquivo keystore está no local correto

### Problemas com EAS Build

Se o EAS Build falhar:

1. Verifique os logs de erro fornecidos pelo EAS
2. Garanta que sua conta tem permissões no projeto
3. Verifique a configuração do arquivo `eas.json`
4. Execute `npx eas-cli diagnostics` para verificar problemas

## Recomendações

1. **Sempre teste o APK/IPA** antes de enviar para as lojas
2. **Mantenha sua keystore segura** - a perda da keystore impede atualizações futuras do app
3. **Siga um sistema de versões consistente** - Recomenda-se Semantic Versioning (MAJOR.MINOR.PATCH)
4. **Automatize o processo** - Considere criar scripts ou usar CI/CD para automatizar os builds

## Comandos Rápidos para o Perpi App

### Android

Gerar APK:
```bash
cd /Users/joaomuchunja/Documents/euler/perpi_app/android && ./gradlew assembleRelease
```

Gerar Bundle (AAB):
```bash
cd /Users/joaomuchunja/Documents/euler/perpi_app/android && ./gradlew bundleRelease
```

Instalar APK via ADB em um dispositivo conectado:
```bash
adb install /Users/joaomuchunja/Documents/euler/perpi_app/android/app/build/outputs/apk/release/app-release.apk
```

Limpar builds anteriores:
```bash
cd /Users/joaomuchunja/Documents/euler/perpi_app/android && ./gradlew clean
```

### EAS (quando configurado corretamente)

Construir APK para testes:
```bash
npx eas build -p android --profile apk
```

Construir AAB para Google Play:
```bash
npx eas build -p android --profile production
```

Construir para iOS:
```bash
npx eas build -p ios --profile production
```

## Recursos Adicionais

- [Documentação do EAS Build](https://docs.expo.dev/build/introduction/)
- [Publicação na Google Play](https://developer.android.com/studio/publish)
- [Publicação na App Store](https://developer.apple.com/app-store/submissions/)
- [React Native - Assinando seu App](https://reactnative.dev/docs/signed-apk-android)
