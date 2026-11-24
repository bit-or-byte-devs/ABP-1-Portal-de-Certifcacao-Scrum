#!/usr/bin/env bash
set -euo pipefail

if (( $# > 1 )); then
  printf 'Uso: %s [IPv4 da rede local]\n' "${0##*/}" >&2
  exit 2
fi

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

lan_ip=${1:-}
if [[ -z "$lan_ip" ]]; then
  # Consulta a rota do host sem enviar tráfego pela rede.
  rota=$(ip -4 route get 1.1.1.1 2>/dev/null || true)
  lan_ip=$(awk '{ for (i = 1; i < NF; i++) if ($i == "src") { print $(i+1); exit } }' <<< "$rota")
fi

enderecos=$(ip -o -4 addr show scope global)
if [[ -z "$lan_ip" ]] || ! awk -v alvo="$lan_ip" '
  { split($4, endereco, "/"); if (endereco[1] == alvo) encontrado = 1 }
  END { exit !encontrado }
' <<< "$enderecos"; then
  printf 'Informe um IPv4 atribuído à interface de rede usada pelo celular.\n' >&2
  exit 2
fi

porta=$(docker compose config --environment | awk -F= '$1 == "APP_PORT" { print $2 }')
export PUBLIC_BASE_URL="http://$lan_ip:${porta:-3000}"
docker compose up -d --build
printf 'Portal na rede local: %s/pages/index.html\n' "$PUBLIC_BASE_URL"
