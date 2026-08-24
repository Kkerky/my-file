#!/usr/bin/env bash
set -Eeuo pipefail

ACC_CONFIG="/etc/servicenow/agent-client-collector/acc.yml"
FAILED="false"

if [[ "${EUID}" -ne 0 ]]; then
  printf 'Run as root: sudo bash verify_acc.sh\n' >&2
  exit 1
fi

printf '%s\n' '=== ACC package ==='
if rpm -q agent-client-collector; then
  :
else
  printf 'NG: agent-client-collector RPM is not installed.\n' >&2
  FAILED="true"
fi

printf '%s\n' '=== ACC service ==='
if systemctl is-enabled --quiet acc.service; then
  printf 'OK: acc.service is enabled.\n'
else
  printf 'NG: acc.service is not enabled.\n' >&2
  FAILED="true"
fi

if systemctl is-active --quiet acc.service; then
  printf 'OK: acc.service is active.\n'
else
  printf 'NG: acc.service is not active.\n' >&2
  FAILED="true"
fi

printf '%s\n' '=== ACC configuration ==='
if [[ -r "${ACC_CONFIG}" ]]; then
  awk '
    /^backend-url:/ { print; show_backend=1; next }
    show_backend && /^[[:space:]]*-[[:space:]]/ { print; show_backend=0; next }
    /^(connect-without-mid|insecure-skip-tls-verify):/ { print }
    /^api-key:/ { print "api-key: <configured value hidden>" }
  ' "${ACC_CONFIG}"
else
  printf 'NG: Cannot read %s\n' "${ACC_CONFIG}" >&2
  FAILED="true"
fi

printf '%s\n' '=== Recent service log ==='
journalctl -u acc.service -n 20 --no-pager || true

if [[ "${FAILED}" == "true" ]]; then
  exit 1
fi

printf '%s\n' 'Verification completed successfully.'
