ACC 6.1.0 RHEL 手动部署包（MID Server 连接方式）
================================================

1. 用途
-------

本包用于把 ACC RPM 和安装脚本传送到 RHEL 系列 x86_64 主机，由 Linux 管理员在目标主机上执行安装、配置 MID Server 连接并启动 ACC。

这不是 MECM 原生 Linux 应用部署包。当前受支持的 MECM/Configuration Manager 已不再提供 Linux/UNIX 客户端，因此 MECM 不能像管理 Windows PC 那样，直接通过其客户端在 RHEL 上执行部署。本包适用于客户已有文件传输、跳板机、运维平台或其他内部机制，可将安装材料放到 RHEL 后再执行脚本的场景。

2. 包含内容
-----------

- agent-client-collector-6.1.0-x86_64.rpm：ACC 6.1.0 RPM。
- install_acc.sh：安装、配置 MID Server、启动服务。
- verify_acc.sh：检查 RPM、服务和主要配置。
- uninstall_acc.sh：卸载 ACC，但保留配置和备份。
- config/01_servicenow：ACC 基础采集所需的 sudoers 示例。
- SHA256SUMS：确认 RPM 在传输过程中没有发生变化。

3. 前提条件
-----------

1) 目标主机为 RHEL 或兼容的 RPM 系统，CPU 架构为 x86_64。
2) 使用 root 或具有 sudo 权限的管理员执行。
3) 目标主机可以访问 MID Server 的 ACC WebSocket 端口，默认通常为 TCP 8800。
4) MID Server 已启用 ACC Listener/Web Server，并准备好以下信息：
   - MID WebSocket URL，例如 wss://10.0.0.10:8800/ws/events
   - ACC API Key
5) 正式环境使用 wss 时，目标主机必须信任 MID Server 的服务器证书。

4. 标准安装步骤
---------------

    tar -xzf ACC_RHEL_6.1.0_MID_ManualDeployment.tar.gz
    cd ACC_RHEL_6.1.0_MID
    sudo bash install_acc.sh
    sudo bash verify_acc.sh

安装脚本会要求输入 MID WebSocket URL 和 ACC API Key。API Key 的输入不会显示在屏幕上，也没有预先写入安装包。

也可以预先指定 URL：

    sudo bash install_acc.sh \
      --backend-url 'wss://10.0.0.10:8800/ws/events'

若内部自动化系统可以把 API Key 安全地放入 root 专用文件，可执行：

    sudo bash install_acc.sh \
      --backend-url 'wss://10.0.0.10:8800/ws/events' \
      --api-key-file /root/acc-api-key.txt

安装后应立即安全删除该临时 Key 文件。

5. PoC 自签名证书
-----------------

默认启用 TLS 证书校验。如果 PoC 的 MID Server 使用尚未受目标主机信任的自签名证书，可以临时执行：

    sudo bash install_acc.sh \
      --backend-url 'wss://10.0.0.10:8800/ws/events' \
      --insecure-skip-tls-verify

该参数会关闭证书校验，仅适用于隔离的 PoC。正式环境应导入受信任证书并重新安装或修改配置，将 insecure-skip-tls-verify 恢复为 false。

6. 验证与故障排查
-----------------

    sudo bash verify_acc.sh
    sudo systemctl status acc --no-pager
    sudo journalctl -u acc.service -n 100 --no-pager

同时在 ServiceNow 中确认 ACC Agent/MID 侧记录和连接状态。仅看到 Linux 服务为 active，不代表 ServiceNow 端已经完成连接和 CI 更新。

7. 安全和变更注意事项
-------------------

- 不要把 API Key 写进脚本、MECM 参数、Git 或普通共享目录。
- config/01_servicenow 是基于官方 Linux ACC 安装说明整理的基础 sudoers 示例，导入生产环境前必须由 Linux/安全团队审核。
- 本包没有放宽 ACC 自升级所需的全部命令权限，因此不要据此宣称 ACC 自动升级已完成验证。
- SHA256SUMS 只能确认本次传输后的 RPM 与制作本包时相同，不能替代 ServiceNow 发布签名验证。正式发布前应同时下载 ServiceNow 提供的 RPM signatures，并按官方步骤验证来源。
- 先在 1 台测试主机执行，再小批量部署，最后扩大范围。

8. 本包 RPM 校验值
-----------------

CF0A4A4EAB70CFF19E03BF59A9CAD68FDA75E53F57EA81915001B39109C4D221

9. 参考资料
-----------

ServiceNow: Install ACC on Linux
https://www.servicenow.com/docs/r/it-operations-management/agent-client-collector/install-acc-linux.html

ServiceNow: Configure ACC with a MID Server
https://www.servicenow.com/docs/r/it-operations-management/agent-client-collector/configure-acc-with-mid.html

ServiceNow: Configure the ACC web server on a MID Server
https://www.servicenow.com/docs/r/it-operations-management/agent-client-collector/acc-configure-web-server.html

ServiceNow: ACC deployment checklist
https://www.servicenow.com/docs/r/it-operations-management/agent-client-collector/acc-deployment-checklist.html

Microsoft: Removed and deprecated Configuration Manager client features
https://learn.microsoft.com/en-us/intune/configmgr/core/plan-design/changes/deprecated/removed-and-deprecated-client
