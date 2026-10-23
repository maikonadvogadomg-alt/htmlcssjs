#!/bin/sh
# Cria o atalho "CodeLens" para abrir com UM toque na tela inicial do celular
# (precisa do app "Termux:Widget", do mesmo lugar de onde veio o Termux — F-Droid).
PASTA="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.shortcuts"
cat > "$HOME/.shortcuts/CodeLens" <<FIM
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock 2>/dev/null
cd "$PASTA" && sh iniciar.sh
FIM
chmod +x "$HOME/.shortcuts/CodeLens"
echo ""
echo "  ✅ Atalho criado. Instale o app Termux:Widget, segure na tela inicial → Widgets → Termux:Widget → CodeLens."
echo ""
