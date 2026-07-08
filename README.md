下面按图片顺序逐行翻译。

**图片 1：你发给 Adz 的提问**
Hi Adz,  
你好 Adz，

I would like to ask for your advice on how to collect and manage electronic certificate information.  
我想请教一下，应该如何收集和管理电子证书信息。

The candidate options we are currently considering are MECM and ServiceNow, including ACC.  
我们目前考虑的候选方案是 MECM 和 ServiceNow，包括 ACC。

We would like to confirm whether these options can collect certificate metadata from endpoints and servers,  
我们想确认这些方案是否可以从终端和服务器收集证书元数据，

and whether the collected data can be used for asset management or CI management.  
以及收集到的数据是否可以用于资产管理或 CI 管理。

Specifically, we would like to confirm:  
具体来说，我们想确认以下几点：

Whether MECM standard Hardware Inventory can collect certificate information, or whether PowerShell / WMI extension would be required  
MECM 标准的 Hardware Inventory 是否可以收集证书信息，或者是否需要通过 PowerShell / WMI 扩展来实现。

Whether ServiceNow Discovery, ACC, and/or CMDB can collect and manage this information  
ServiceNow Discovery、ACC 以及/或者 CMDB 是否可以收集并管理这些信息。

Which metadata fields can be collected, such as Subject, Issuer, Thumbprint, Serial Number, validity period, SAN, EKU, certificate store location, etc.  
可以收集哪些元数据字段，例如 Subject、Issuer、Thumbprint、Serial Number、有效期、SAN、EKU、证书存储位置等。

Whether expiry monitoring, notification, and reporting can be implemented  
是否可以实现到期监控、通知和报表。

The scope is limited to certificate metadata only.  
范围仅限于证书元数据。

We do not intend to collect private keys or the certificate files themselves.  
我们不打算收集私钥，也不打算收集证书文件本身。

Any insights would be appreciated.  
如果您能提供任何建议，我们将非常感谢。

Thanks, Kei  
谢谢，Kei。

**图片 2：Adz 的回复**
Hi Kei-san,  
Kei 先生，你好，

The simple answer is that we can do that with SSL/TLS certificate Discovery (ITOM Discovery)  
简单来说，我们可以通过 SSL/TLS certificate Discovery，也就是 ITOM Discovery 来实现。

or direct API calls to the certificate authority for Digicert/Entrust/GoDaddy/Sectigo.  
或者也可以通过直接调用证书颁发机构的 API 来实现，例如 DigiCert、Entrust、GoDaddy、Sectigo。

The standard behaviour will discover the following data:  
标准功能会发现/采集以下数据：

certificate id, revocation_status, subject, issuer, sans/, is_self_signed, is_ca, valid_from, valid_to,  
certificate id、吊销状态、Subject、Issuer、SAN、是否自签名、是否 CA、有效开始日期、有效结束日期，

signature_algorithm, fingerprint_algorithm, key_size, serial_number, and version  
签名算法、指纹算法、密钥长度、序列号和版本。

Expiry monitoring / notifications / reporting can all be implemented,  
到期监控、通知、报表都可以实现，

and even automated renewal workflows can be implemented in some circumstances.  
在某些情况下，甚至可以实现自动续期流程。

While I typically wouldn’t see certificates falling under Asset Management,  
不过通常我不会把证书归类到 Asset Management 下面，

they definitely are used in Configuration Management.  
但它们确实会用于 Configuration Management，也就是配置管理。

The ServiceNow product is “Certificate Inventory and Management”,  
ServiceNow 对应的产品是 “Certificate Inventory and Management”。

the documentation on it is here: Certificate Inventory and Management ... Docs | ServiceNow  
相关文档链接在这里：Certificate Inventory and Management 的 ServiceNow Docs。

Agent Client Collector can be configured to run the same Discovery patterns as well  
Agent Client Collector 也可以配置为运行相同的 Discovery Pattern。

Run Certificate Discovery via ACC-V ... Docs | ServiceNow  
也就是通过 ACC-V 执行 Certificate Discovery，相关文档链接在这里。

**图片 2 下方 / 图片 3：Adz 另一个回复**
Michael Dul I just realised you’re already in this group.  
Michael Dul，我刚意识到你已经在这个群里了。

We have some questions that I’d like to get your thoughts on when you have a moment  
我们有几个问题，想在你有空的时候听听你的意见。

1. The team is working on creating a sandbox environment in Azure where they can spin up devices to test discovery against.  
1. 团队正在 Azure 中创建一个沙箱环境，他们可以在里面启动一些设备，用来测试 Discovery。

Assumption is that once that’s ready, we can get Discovery up and running in the dev instance of ServiceNow to target it.  
目前的假设是，一旦这个环境准备好，我们就可以在 ServiceNow 的开发实例中启动 Discovery，并把它作为目标进行扫描。

Any concerns?  
你觉得这个方案有什么问题或风险吗？

2. Service Mapping.  
2. 关于 Service Mapping。

My thinking is that Service Mapping is a roadmap item for after phase 2 and is not targeted for January 2027.  
我的理解是，Service Mapping 是 Phase 2 之后的路线图项目，并不是以 2027 年 1 月为目标。

Correct or incorrect?  
这个理解对还是不对？

3. Credential Management - current working assumption is that we will store credentials in ServiceNow rather than an external credential store like CyberArk,  
3. 关于 Credential Management，目前的工作假设是：我们会把凭据信息存储在 ServiceNow 中，而不是存储在 CyberArk 这类外部凭据库中。

and the team have not heard any requirement for external credential storage but will check internally with ITSD.  
团队目前还没有听说有必须使用外部凭据库的要求，不过会和 ITSD 内部确认。

Have you heard anything that might suggest a challenge to that assumption?  
你有没有听到什么信息，可能会推翻或挑战这个假设？

**图片 3 / 图片 4：Adz 对山本的确认问题**
Hi 山本拓弥 / YAMAMOTO, TAKUYA-san I have a clarification question  
山本拓弥先生，你好，我有一个想确认的问题。

[GAM] ITOM Cross-Team Alignment.pptx  
关于这个 `[GAM] ITOM Cross-Team Alignment.pptx` 文件。

On slide 5 here we have the test environment layout showing the Yokohama DC and the Azure environment.  
第 5 页里有测试环境的布局图，显示了 Yokohama DC 和 Azure 环境。

Is the DC and Azure shared across many Hitachi companies,  
这里的 DC 和 Azure 是多个 Hitachi 公司共同使用的吗？

or do different companies have their own datacentre sites and Azure accounts?  
还是说不同公司各自拥有自己的数据中心站点和 Azure 账号？
