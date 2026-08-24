#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RPM_FILE="${SCRIPT_DIR}/agent-client-collector-6.1.0-x86_64.rpm"
ACC_BIN="/usr/share/servicenow/agent-client-collector/bin/acc"
ACC_CONFIG="/etc/servicenow/agent-client-collector/acc.yml"
SUDOERS_SOURCE="${SCRIPT_DIR}/config/01_servicenow"
SUDOERS_TARGET="/etc/sudoers.d/01_servicenow"

BACKEND_URL=""
API_KEY_FILE=""
INSECURE_SKIP_TLS_VERIFY="false"
SKIP_SUDOERS="false"

usage() {
  cat <<'EOF'
Usage:
  sudo bash install_acc.sh [options]

Options:
  --backend-url URL              MID WebSocket URL, for example:
                                 wss://10.0.0.10:8800/ws/events
  --api-key-file PATH            Read the ACC API key from a protected file.
                                 If omitted, the script prompts securely.
  --insecure-skip-tls-verify     PoC only: do not verify the MID TLS certificate.
  --skip-sudoers                 Do not install the ACC sudoers policy.
  -h, --help                     Show this help.

The API key is never written into this deployment package.
EOF
}

log() {
  printf '[ACC installer] %s\n' "$*"
}

die() {
  printf '[ACC installer] ERROR: %s\n' "$*" >&2
  exit 1
}

require_root() {
  [[ "${EUID}" -eq 0 ]] || die "Run this script as root: sudo bash install_acc.sh"
}

check_platform() {
  [[ "$(uname -m)" == "x86_64" ]] || die "This package supports x86_64 only."
  [[ -r /etc/os-release ]] || die "Cannot identify the operating system."

  # shellcheck disable=SC1091
  . /etc/os-release
  local family="${ID:-} ${ID_LIKE:-}"
  if [[ ! "${family}" =~ (rhel|fedora|centos|rocky|almalinux) ]]; then
    die "This package is for RHEL-compatible RPM systems. Detected: ${PRETTY_NAME:-unknown}"
  fi

  command -v rpm >/dev/null 2>&1 || die "The rpm command is required."
  command -v systemctl >/dev/null 2>&1 || die "systemd/systemctl is required."
  command -v sha256sum >/dev/null 2>&1 || die "sha256sum is required."
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --backend-url)
        [[ $# -ge 2 ]] || die "--backend-url requires a value."
        BACKEND_URL="$2"
        shift 2
        ;;
      --api-key-file)
        [[ $# -ge 2 ]] || die "--api-key-file requires a path."
        API_KEY_FILE="$2"
        shift 2
        ;;
      --insecure-skip-tls-verify)
        INSECURE_SKIP_TLS_VERIFY="true"
        shift
        ;;
      --skip-sudoers)
        SKIP_SUDOERS="true"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Unknown option: $1"
        ;;
    esac
  done
}

collect_connection_settings() {
  if [[ -z "${BACKEND_URL}" ]]; then
    read -r -p 'MID WebSocket URL (wss://MID:8800/ws/events): ' BACKEND_URL
  fi

  [[ "${BACKEND_URL}" =~ ^wss?://[^[:space:]]+$ ]] || \
    die "Invalid MID WebSocket URL. Expected wss://MID:PORT/ws/events"

  if [[ -n "${API_KEY_FILE}" ]]; then
    [[ -r "${API_KEY_FILE}" ]] || die "Cannot read API key file: ${API_KEY_FILE}"
    API_KEY="$(tr -d '\r\n' < "${API_KEY_FILE}")"
  else
    read -r -s -p 'ACC API key: ' API_KEY
    printf '\n'
  fi

  [[ -n "${API_KEY}" ]] || die "The ACC API key cannot be empty."
}

verify_package() {
  [[ -f "${RPM_FILE}" ]] || die "RPM not found: ${RPM_FILE}"
  [[ -f "${SCRIPT_DIR}/SHA256SUMS" ]] || die "SHA256SUMS is missing."

  log "Verifying the RPM checksum."
  (
    cd "${SCRIPT_DIR}"
    sha256sum --check --strict SHA256SUMS
  ) || die "Checksum verification failed. Do not install this copy."
}

backup_existing_config() {
  if [[ -f "${ACC_CONFIG}" ]]; then
    local backup
    backup="${ACC_CONFIG}.backup.$(date +%Y%m%d%H%M%S)"
    cp -p "${ACC_CONFIG}" "${backup}"
    log "Existing ACC configuration backed up to ${backup}"
  fi
}

install_rpm() {
  log "Installing or upgrading Agent Client Collector."
  if command -v dnf >/dev/null 2>&1; then
    dnf -y install "${RPM_FILE}"
  elif command -v yum >/dev/null 2>&1; then
    yum -y localinstall "${RPM_FILE}"
  else
    rpm -Uvh --replacepkgs "${RPM_FILE}"
  fi

  [[ -x "${ACC_BIN}" ]] || die "ACC executable was not installed at ${ACC_BIN}"
  [[ -f "${ACC_CONFIG}" ]] || die "ACC configuration was not installed at ${ACC_CONFIG}"
}

configure_acc() {
  log "Configuring the MID Server connection."

  systemctl stop acc.service 2>/dev/null || true
  sed -i -E 's|^[[:space:]]*connect-without-mid:[[:space:]].*$|connect-without-mid: false|' "${ACC_CONFIG}"
  sed -i -E "s|^[[:space:]]*insecure-skip-tls-verify:[[:space:]].*$|insecure-skip-tls-verify: ${INSECURE_SKIP_TLS_VERIFY}|" "${ACC_CONFIG}"

  # ServiceNow's ACC CLI writes backend-url and api-key into acc.yml. The key is
  # encrypted by ACC during initial startup; it is not printed by this script.
  "${ACC_BIN}" gateway mid -b "${BACKEND_URL}" -a "${API_KEY}"
  unset API_KEY
}

install_sudoers_policy() {
  if [[ "${SKIP_SUDOERS}" == "true" ]]; then
    log "Skipping the ACC sudoers policy by request."
    return
  fi

  [[ -f "${SUDOERS_SOURCE}" ]] || die "Sudoers policy not found: ${SUDOERS_SOURCE}"
  command -v visudo >/dev/null 2>&1 || die "visudo is required to validate the sudoers policy."

  install -o root -g root -m 0440 "${SUDOERS_SOURCE}" "${SUDOERS_TARGET}.tmp"
  if visudo -cf "${SUDOERS_TARGET}.tmp" >/dev/null; then
    mv -f "${SUDOERS_TARGET}.tmp" "${SUDOERS_TARGET}"
    log "Installed and validated ${SUDOERS_TARGET}"
  else
    rm -f "${SUDOERS_TARGET}.tmp"
    die "The ACC sudoers policy did not pass visudo validation."
  fi
}

start_acc() {
  log "Enabling and starting the ACC service."
  systemctl daemon-reload
  systemctl enable acc.service
  systemctl restart acc.service

  sleep 3
  if systemctl is-active --quiet acc.service; then
    log "ACC service is active."
  else
    systemctl --no-pager --full status acc.service || true
    die "ACC service did not become active. Review: journalctl -u acc.service"
  fi
}

main() {
  parse_args "$@"
  require_root
  check_platform
  collect_connection_settings
  verify_package
  backup_existing_config
  install_rpm
  configure_acc
  install_sudoers_policy
  start_acc

  log "Installation completed. Run: sudo bash ${SCRIPT_DIR}/verify_acc.sh"
  if [[ "${INSECURE_SKIP_TLS_VERIFY}" == "true" ]]; then
    log "WARNING: TLS certificate verification is disabled. Use this only for PoC testing."
  fi
}

main "$@"
