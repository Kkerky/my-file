# ServiceNow Unclassed Hardware 到 Service/负责人的方案评估

## 1. 文档目的

本文用于评估以下目标的可实现性：

> 从 Credential-less Discovery 创建的 `Unclassed Hardware` CI 出发，找到与其相关的 Service，再取得该 Service 的 `Managed by Group`、`Owned by` 或 `Support Group`。

本文中的 Unclassed Hardware 指：

```text
cmdb_ci.sys_class_name = cmdb_ci_unclassed_hardware
```

不是 CI 名称或列表分组名称。

## 2. 必须先明确的基本事实

### 2.1 不要使用 Name/IP 作为表之间的关联键

即使 CI 当前显示：

```text
name = 10.0.0.7
```

也应先取得该 CI 的 `sys_id`，后续所有查询都使用 `sys_id`。

原因：

- Credential-less Discovery 在无法取得主机名时才可能使用 IP 作为 Name。
- 后续有凭据 Discovery 成功后，Name 和 Class 都可能更新。
- 同一个设备可能有多个 IP。
- IP 可能发生变化或被重复使用。
- 使用 Name/IP 关联容易产生错配和重复。

### 2.2 Service 记录和服务成员关系不是一回事

- `cmdb_ci_service`：保存 Service CI 本身，例如名称、分类、负责人、支持组和业务重要性。
- `svc_ci_assoc`：保存 Application Service 与组成该服务的 CI 之间的直接成员关联。
- `cmdb_rel_ci`：保存 CI 之间的技术拓扑关系。
- `sn_vul_m2m_ci_services`：保存 Vulnerability Response 计算出的“CI 影响哪些 Service”的派生结果。

### 2.3 负责人字段需要提前确定优先规则

常见字段：

| 显示名称 | 字段 | 语义 |
|---|---|---|
| Managed by Group | `managed_by_group` | 负责管理该 Service 的组 |
| Support Group | `support_group` | 负责日常支持或事件处理的组 |
| Owned by | `owned_by` | 对 Service 负责的个人 |

建议自动分派时优先使用“组”而不是个人。一个可讨论的默认顺序为：

```text
managed_by_group → support_group → owned_by → 默认处理组
```

这不是 ServiceNow 强制规则，必须由客户确认业务定义。

---

# 方案 1：通过 sn_vul_m2m_ci_services 查找 Service

## 1.1 数据路径

```text
cmdb_ci_unclassed_hardware
        ↓ CI sys_id
sn_vul_m2m_ci_services
        ↓ Service
cmdb_ci_service
        ↓
managed_by_group / support_group / owned_by
```

## 1.2 该表的真实用途

`sn_vul_m2m_ci_services` 是 Vulnerability Response 的 Related Services/Related Business Services 表。

它不是 Service Mapping 的原始关系表。Vulnerability Response 的 `Set related CI services` 定时任务计算某个 CI 影响的 Service，并把结果保存到该表，供以下功能使用：

- Vulnerable Item 风险评分
- 受影响服务查询
- 使用 Service 的 Business Criticality 参与风险计算
- 按 Service 的 Support Group 分派漏洞整改工作

因此，这张表更接近“计算结果缓存”，不是 CMDB 关系的权威来源。

## 1.3 必须满足的先决条件

1. 客户已安装并启用 Vulnerability Response。
2. 目标 CI 已被 Vulnerability Response 的 Discovered Item/Vulnerable Item 流程识别。
3. CMDB 中已经存在可用于计算的 Service 和 CI 拓扑或服务成员关系。
4. `Set related CI services` 定时任务已成功处理该 CI。
5. 目标 Service 已填写 `managed_by_group`、`support_group` 或 `owned_by`。
6. 结果未超过服务计算的最大深度和最大数量限制。
7. 最重要：目标 CI Class 没有被服务计算排除。

## 1.4 对本次 Unclassed Hardware 的关键阻塞

ServiceNow 官方文档说明，系统属性：

```text
sn_sec_cmn.ignoreCIClassForService
```

默认包含：

```text
cmdb_ci_unclassed_hardware
cmdb_ci_incomplete_ip
sn_sec_cmn_unmatched_ci
```

这意味着在标准配置下，`cmdb_ci_unclassed_hardware` 通常会被 Related Services 计算跳过。

因此：

> 对本次目标 Class，方案 1 在 Out-of-Box 默认配置下通常不能作为主方案。

如果客户实例中已经存在对应记录，需要检查：

- 是否修改过 `sn_sec_cmn.ignoreCIClassForService`
- 记录是否由旧版本、定制逻辑或手工方式产生
- 记录的更新时间是否可靠
- 表中的“是否由 Service Mapping 添加”标志

不建议仅为了得到结果就直接删除默认排除项。变更前需要评估：

- Unclassed Hardware 的数据质量
- 服务误关联风险
- 定时任务处理量和性能
- Vulnerability Response 升级兼容性

## 1.5 具体实施方法

### 无代码验证

1. 在 `cmdb_ci` 中找到目标记录。
2. 确认：
   - `sys_id`
   - `sys_class_name = cmdb_ci_unclassed_hardware`
   - `discovery_source`
   - Name/IP
3. 打开 `sn_vul_m2m_ci_services.list`。
4. 使用条件构造器设置：
   - Configuration item = 目标 CI
5. 查看返回的 Service。
6. 打开 Service，检查：
   - Class
   - Service classification
   - Operational status
   - Business criticality
   - Managed by Group
   - Support Group
   - Owned by
7. 检查 `Set related CI services` 最近是否成功执行。
8. 如果 CMDB 服务关系刚发生变化，运行官方提供的：
   - `Full refresh related CI services for VI`

### 自动化查询

自动化逻辑应按字段引用查询，不要按 Name/IP 关联：

```text
输入：CI sys_id
查询：sn_vul_m2m_ci_services 中 Configuration item = CI sys_id
输出：所有关联 Service
过滤：允许的 Service classification、Operational status
选择：按照客户确认的服务优先规则
返回：managed_by_group / support_group / owned_by
```

字段内部名称应在客户实例的 Dictionary 中确认后再编码，避免版本或插件差异。

## 1.6 验证标准

方案 1 只有在以下条件都成立时才能被接受：

- 表中存在该 CI 的记录。
- 记录由有效定时任务生成，而不是过期遗留数据。
- Service 能在 CMDB 中追溯到合理关系。
- Service 的 Class 和 Classification 符合客户需求。
- Service 负责人字段不为空。
- 多个 Service 时存在明确选择规则。

## 1.7 优点与风险

优点：

- 查询简单，适合 Vulnerability Response 的风险和分派流程。
- 已经预先计算，不需要查询时递归 CMDB。
- 可以直接使用 Service Criticality 和 Support Group。

风险：

- 对 `cmdb_ci_unclassed_hardware` 默认可能没有结果。
- 数据存在定时刷新延迟。
- 结果受最大深度、最大数量和排除 Class 属性限制。
- 是派生结果，不应作为 Service Mapping/CMDB 的唯一权威来源。

## 1.8 方案 1 结论

```text
技术上可行，但对本次 Class 默认受阻。
适合作为 Vulnerability Response 场景的辅助查询和验证，不适合作为首选权威方案。
```

---

# 方案 2：通过 svc_ci_assoc 查找 Application Service

## 2.1 数据路径

```text
cmdb_ci_unclassed_hardware
        ↓ CI sys_id
svc_ci_assoc.Configuration Item Id
        ↓ Service Id
cmdb_ci_service / cmdb_ci_service_auto 子类
        ↓
managed_by_group / support_group / owned_by
```

## 2.2 该表的真实用途

ServiceNow 官方定义：

> `svc_ci_assoc` 用于绑定 Application Service 和 CI，以跟踪每个 Application Service 包含哪些 CI。

因此，它表达的是：

```text
这个 CI 是这个 Application Service 的组成成员
```

这是三个方案中语义最直接的关联。

## 2.3 必须满足的先决条件

1. CMDB 中已存在 Application Service。
2. 该 Application Service 已通过一种有效 Population Method 填充，例如：
   - Top-down Discovery
   - Manual
   - Tags
   - Dynamic CI Group
   - Dynamic Service
3. 目标 Unclassed Hardware CI 已被纳入该 Application Service。
4. Application Service 数据不是空服务或未完成映射状态。
5. Service 已填写负责人或支持组。
6. 如果使用 Top-down Discovery：
   - Service Mapping 已安装和正确配置
   - 已定义 Entry Point
   - MID Server 可访问目标
   - Pattern 能识别入口应用和连接
7. 客户已定义一个 CI 同时属于多个 Application Service 时的选择规则。

必须注意：

> Credential-less Discovery 创建 CI，不等于该 CI 自动进入 `svc_ci_assoc`。

只有 Service Mapping、手工服务维护或其他 Application Service Population Method 将 CI 纳入服务后，才可能有记录。

## 2.4 具体实施方法

### 无代码验证

1. 在 `cmdb_ci` 中取得目标 CI 的 `sys_id`。
2. 打开 `svc_ci_assoc.list`。
3. 使用条件构造器设置：
   - Configuration Item Id = 目标 CI
4. 查看返回的 Service Id。
5. 打开 Service，确认：
   - `sys_class_name`
   - Service classification = 预期类型
   - Operational status
   - Managed by Group / Support Group / Owned by
6. 打开 Application Service 页面并执行 `List CIs` 或 `View Service CIs`，确认目标 CI 确实是服务成员。
7. 如果是 Top-down 服务，检查 Service Map 中该 CI 的位置和连接路径。

### 自动化查询

`svc_ci_assoc` 的官方关键字段为：

```text
Configuration Item Id：引用 cmdb_ci
Service Id：引用 cmdb_ci_service
```

建议逻辑：

```text
输入：CI sys_id
查询：svc_ci_assoc.Configuration Item Id = CI sys_id
取得：Service Id
过滤：Service classification、Class、Operational status
输出：managed_by_group / support_group / owned_by
```

如果没有记录，不应直接向 `svc_ci_assoc` 表插入数据。应通过受支持方式维护 Application Service，例如：

- Application Service UI 的 Manual Population
- Service Mapping Top-down Discovery
- Application Service API
- 官方 `addCI()` 等 Application Service API

直接写表可能被服务重算覆盖，也可能造成地图和服务成员不一致。

## 2.5 多个 Service 的处理规则

一个共享服务器、数据库或网络组件可能属于多个 Application Service。

不能简单选择第一条记录。建议与客户确认以下筛选顺序：

1. 只保留 Operational 的 Service。
2. 只保留需要的 Service Classification。
3. Production 优先于 Test/Development。
4. 直接成员优先于后续推导的受影响服务。
5. 无法唯一选择时，返回所有候选 Service，由人工确认。

## 2.6 验证标准

- `svc_ci_assoc` 中存在目标 CI 的记录。
- Application Service 页面中的 CI 列表也能看到该 CI。
- Service Map 或 Manual Population 能解释该 CI 为什么属于该服务。
- Service 记录负责人字段有效。
- 关联不是测试、废弃或错误手工数据。

## 2.7 优点与风险

优点：

- 语义最直接。
- 不依赖 Vulnerability Response。
- 不需要查询时遍历整个 `cmdb_rel_ci`。
- 适合直接回答“CI 属于哪个 Application Service”。

风险：

- 如果 Service Mapping 没有成功或服务从未维护，表中没有结果。
- Unclassed Hardware 信息较少，可能无法被 Top-down Discovery 正确纳入。
- 手工维护可能发生过期或误关联。
- 一个 CI 可能返回多个 Application Service。

## 2.8 方案 2 结论

```text
三个单一方案中最可靠，推荐作为第一查询路径。
前提是目标 CI 已真实成为 Application Service 的成员。
```

---

# 方案 3：通过 cmdb_rel_ci/CIUtils 推导受影响 Service

## 3.1 数据路径

`cmdb_rel_ci` 通常不是一次查询就能从硬件直接得到 Service。

实际路径可能类似：

```text
Unclassed Hardware
    ← Runs on / Hosted on
Application CI
    ← Depends on / Used by
Application Service 或其他 Service
```

或者需要经过多层 CI：

```text
Hardware → Application → Database → Service
```

## 3.2 该表的真实用途

`cmdb_rel_ci` 保存 CI 之间的技术关系，核心字段包括：

```text
parent
child
type
```

示例：

```text
Application Runs on Hardware
Service Depends on Application
```

它表达技术拓扑，不直接保证“该 CI 是某个 Application Service 的成员”。

## 3.3 必须满足的先决条件

1. 目标 CI 已有有效的 `cmdb_rel_ci` 关系。
2. 关系方向正确，Parent/Child 没有建反。
3. 关系类型符合 CMDB 建模规范。
4. 从目标 CI 到 Service 之间存在可遍历路径。
5. Discovery、Service Mapping 或人工维护已建立足够完整的拓扑。
6. 已定义允许遍历的关系类型和最大深度。
7. 已定义共享基础设施的排除规则。
8. 已执行 Relationship Health/治理检查，避免使用错误或陈旧关系。

对只有 IP Name 和少量 Nmap 信息的 Unclassed Hardware，通常缺少应用、进程和连接关系，因此这个方案很可能没有结果。

## 3.4 推荐实施方法：使用 CIUtils

不建议自行无限递归 `cmdb_rel_ci`。ServiceNow 官方 Vulnerability Response 示例使用：

```javascript
var ciu = new global.CIUtils();
var services = ciu.servicesAffectedByCI(ciSysId, {
    maxDepth: maxDepthValue,
    maxSize: maxSizeValue
});
```

然后使用返回的 Service sys_id 查询 `cmdb_ci_service`。

这种方式的优点：

- 使用 ServiceNow 已有的受影响服务计算逻辑。
- 可以限制最大深度和最大结果数。
- 比自行编写无边界递归更容易控制。

仍需注意：它返回的是“受影响 Service”，不一定是 CI 的直接 Application Service 成员。

## 3.5 备选实施方法：受控遍历 cmdb_rel_ci

如果客户确实需要自定义关系路径，应实现有边界的广度优先搜索：

```text
起点：目标 CI sys_id
读取：parent = 当前 CI 或 child = 当前 CI 的关系
限制：允许的 Relationship Type
限制：最大深度，例如 3～5
限制：最大节点数
去重：记录已访问 CI，防止循环
终止：找到 cmdb_ci_service 或其目标子类
输出：完整路径和命中的 Service
```

必须保留可审计路径，例如：

```text
CI A --Runs on--> CI B --Used by--> Service C
```

如果只返回 Service 而不返回关系路径，客户无法判断结果是否合理。

## 3.6 必须控制的误判

以下共享 CI 很容易把一个硬件推导到大量 Service：

- DNS
- Active Directory
- 监控系统
- 共享数据库
- 共享消息队列
- 负载均衡器
- 网络设备

因此必须：

- 设置最大深度和最大结果数。
- 使用 Relationship Type 白名单。
- 排除已知的共享基础设施，或降低其结果可信度。
- 对多个 Service 返回候选列表，而不是强制选一个。

## 3.7 验证标准

- 能展示从目标 CI 到 Service 的完整关系路径。
- 每条关系的方向、类型和 Class 合理。
- 路径没有依赖错误或陈旧关系。
- 结果未因共享基础设施扩散到大量无关 Service。
- Service 负责人字段有效。
- 结果可与 `svc_ci_assoc`、Service Map 或服务所有者确认。

## 3.8 优点与风险

优点：

- 在没有直接服务成员关系时，可以推导受影响 Service。
- 可以利用已有 CMDB 技术拓扑。
- 适合影响分析和补充查询。

风险：

- 不一定代表直接应用归属。
- 可能需要多层遍历。
- 容易因共享组件产生多个或错误 Service。
- 对关系质量和性能要求高。
- 对只有基本 IP 信息的 Unclassed Hardware，成功率可能很低。

## 3.9 方案 3 结论

```text
可以作为兜底和影响分析方案，不建议作为第一查询路径。
优先使用 CIUtils；如果自定义遍历，必须限制关系类型、深度、数量并输出完整路径。
```

---

# 4. 推荐的最终实施顺序

## 4.1 推荐流程

```text
步骤 1：使用 CI sys_id 查询 svc_ci_assoc
        ↓
有结果：作为直接 Application Service 成员，高可信度
        ↓ 无结果
步骤 2：查询 sn_vul_m2m_ci_services
        ↓
仅在 VR 已启用、记录新鲜且 Class 未被排除时采用
        ↓ 无结果
步骤 3：使用 CIUtils.servicesAffectedByCI()
        ↓
作为间接受影响 Service，必须保留关系路径和较低可信度
        ↓ 无结果
步骤 4：返回“CMDB 无法确定应用归属”
```

不应把“没有结果”强行转换成某个 Application Service。

## 4.2 结果可信度

| 来源 | 含义 | 建议可信度 |
|---|---|---:|
| `svc_ci_assoc` | CI 是 Application Service 的直接成员 | 高 |
| `sn_vul_m2m_ci_services` | VR 计算出的受影响 Service 缓存 | 中 |
| `CIUtils`/`cmdb_rel_ci` | 根据技术拓扑推导的受影响 Service | 中到低 |
| 仅按 IP Range 推断 | 网络范围归属，不是应用归属 | 低 |

## 4.3 客户会议中需要确认的问题

1. 客户要找的是应用负责人、服务负责人、网络负责人，还是 CI 运维负责人？
2. 最终应返回个人 `owned_by`，还是组 `managed_by_group`/`support_group`？
3. 一个 CI 对应多个 Service 时如何选择？
4. 是否只允许 Application Service，还是 Business/Technical Service 也可以？
5. 是否只考虑 Production 和 Operational Service？
6. 是否允许使用间接影响关系，还是只接受直接服务成员？
7. 客户是否修改了 `sn_sec_cmn.ignoreCIClassForService`？
8. `Set related CI services` 和 Service Mapping 最近是否成功运行？
9. Unclassed Hardware 是否只是临时状态，后续是否会补齐 Discovery 凭据？
10. 没有任何 Service 结果时，应进入哪个默认处理组？

# 5. 最终建议

建议正式方案定义为：

> 以 `svc_ci_assoc` 的直接 Application Service 成员关系为首选；以 `sn_vul_m2m_ci_services` 的 Vulnerability Response 派生结果作为有条件的辅助；以 `CIUtils/cmdb_rel_ci` 的受控影响分析作为兜底。任何结果都必须使用 CI `sys_id` 查询，并对多个 Service、负责人字段为空、陈旧关系和共享基础设施制定明确处理规则。

对于 `cmdb_ci_unclassed_hardware`：

- 方案 1 默认存在官方 Class 排除条件。
- 方案 2 最可靠，但要求 CI 已被纳入 Application Service。
- 方案 3 可以补充，但取决于 CMDB 关系质量。
- 三者都没有结果时，应明确返回“无法确定”，而不是仅根据 IP 推断应用负责人。

# 6. ServiceNow 官方参考文献

## 6.1 CMDB、Service 和 svc_ci_assoc

ServiceNow Zurich ServiceNow AI Platform Capabilities：

https://www.servicenow.com/docs/v/u/downloads/pdfs/en-US/zurich-enus-servicenow-platform.pdf

重点页：

- 第 35～43 页：CMDB Service 表、`cmdb_ci_service`、`svc_ci_assoc` 定义和关键字段
- 第 72 页：Service CI 的 Teams、Managed by Group、Support Group
- 第 85～86 页：CMDB Relationship Governance
- 第 1069～1073 页：Application Service 和 Population Methods
- 第 1108～1109 页：Application Service API、`addCI()` 和创建前提

## 6.2 Credential-less Discovery、Service Mapping 和 cmdb_rel_ci

ServiceNow Zurich IT Operations Management：

https://www.servicenow.com/docs/v/u/downloads/pdfs/en-US/zurich-enus-it-operations-management.pdf

重点页：

- 第 753 页：Horizontal Discovery 与 Top-down Discovery 的区别
- 第 1048～1056 页：Credential-less Discovery、Unclassed/Hardware CI 和应用识别
- 第 1452～1456 页：Service Mapping Entry Point、Application Service 和发现流程
- 第 1770 页：Application Service 的完整 CI 列表
- 第 3173 页：`svc_ci_assoc` 与 `cmdb_rel_ci` 在 Service Map 中的作用

## 6.3 sn_vul_m2m_ci_services、CIUtils 和服务计算

ServiceNow Zurich Security Management：

https://www.servicenow.com/docs/v/u/downloads/pdfs/en-US/zurich-enus-security-management.pdf

重点页：

- 第 209～210 页：`sn_vul_m2m_ci_services` 用于 CI 与受影响 Service 的映射和风险计算
- 第 402～403 页：`Set related CI services`、最大深度/数量、Class 排除属性和 Full Refresh
- 第 424 页：该表用于受影响服务查询，并包含 Service Mapping 来源标志
- 第 459～461 页：官方使用 `CIUtils.servicesAffectedByCI()` 和 Service Support Group 的分派示例
- 第 556～557 页：Vulnerability Response 的 Service Classification 配置

> 文档基于 Zurich 版本。客户实例若为其他版本，应在实施前对照该版本的 Dictionary、插件版本、系统属性和 Scheduled Job 再确认。
