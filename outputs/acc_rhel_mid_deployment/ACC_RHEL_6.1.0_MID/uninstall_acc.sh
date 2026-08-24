#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  printf 'Run as root: sudo bash uninstall_acc.sh\n' >&2
  exit 1
fi

printf '%s\n' 'This removes the ACC RPM and service but preserves /etc/servicenow configuration.'
read -r -p 'Continue? [y/N]: ' answer
[[ "${answer}" =~ ^[Yy]$ ]] || exit 0

systemctl disable --now acc.service 2>/dev/null || true

if command -v dnf >/dev/null 2>&1; then
  dnf -y remove agent-client-collector
elif command -v yum >/dev/null 2>&1; then
  yum -y remove agent-client-collector
else
  rpm -e agent-client-collector
fi

rm -f /etc/sudoers.d/01_servicenow
printf '%s\n' 'ACC was removed. Existing configuration and backups were preserved.'
