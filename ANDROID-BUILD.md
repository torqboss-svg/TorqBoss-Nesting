# TorqBoss Nesting — Build Android

## Processo oficial

Nunca copiar manualmente um `dist` antigo para o Android.

O comando oficial para gerar o APK Android é:

    npm run build:android

O processo executa automaticamente:

1. Remove `dist` antigo.
2. Remove `.vercel/output` antigo.
3. Executa o build novo do TanStack/Grok.
4. Verifica se o novo `_shell.html` foi produzido.
5. Identifica os novos:
   - `index-*.js`
   - `routes-*.js`
   - `styles-*.css`
6. Cria um `dist` específico para Capacitor.
7. Executa `npx cap sync android`.
8. Confirma que o Android recebeu exatamente os assets desse build.
9. Executa o Gradle.
10. Gera `TB-Nesting.apk`.

## Regra de segurança

Se qualquer etapa acima falhar, o processo é interrompido e nenhum APK novo é considerado válido.

Isso evita que uma versão antiga do `dist` seja novamente empacotada no APK.

## Fluxo após baixar uma nova versão do Grok

Depois de atualizar o código do Grok no projeto:

    npm run build:android

O APK final estará na raiz:

    TB-Nesting.apk

O Gradle continuará produzindo internamente:

    android/app/build/outputs/apk/debug/app-debug.apk

Esse nome interno não deve ser alterado manualmente. O script cria automaticamente a cópia final `TB-Nesting.apk`.

## Observação

O build web/Vercel continua usando `.vercel/output`.

O `dist` é tratado como uma saída específica para o Capacitor Android.
