# AFK workflow 实施计划

本文件记录已批准的范围与实施顺序；当前状态以 [实施进度](afk-workflow-progress.md) 为准。

依据：[已约定的修复方向与验收要求](afk-workflow-reliability.md)。本文件是跨仓库实施计划，P0–P8 是工作包编号，不是已发布的 issue ID。当前 skills 仓库没有 tracker 配置，Sandcastle fork 的 tracker 文档仍指向上游；本次不据此向上游发布 issue。

## 改动归属与最终使用方式

| 位置 | 负责的行为 | 项目如何使用 |
| --- | --- | --- |
| Sandcastle fork | 进程终止、活动与时限、每轮生命周期、候选提交合入、产物保存与恢复记录 | 原生 `run()` 和声明式配置；通用能力不依赖 Backlog 或 acceptance 的业务名称 |
| 当前 skills 仓库 | Workflow 协议、队列与终结化核验、setup 配置、implement/acceptance 衔接 | 随 skill 安装的共享命令，所有项目复用同一份实现 |
| 项目 | Agent/provider、tracker、任务范围、验收入口、证据路径、执行边界 | 官方入口、prompt 和项目配置；不生成专用外层循环、恢复程序或大段检查代码 |
| 临时试验项目 | 验证 setup 与真实 AFK 完整链路 | 使用构建后的本地 fork 包及本次 skills 版本 |

共享命令拟放在 `skills/engineering/setup-agent-workflow/scripts/`，使用 Node 标准库和项目已有 tracker CLI。它提供单次 `prepare`、`verify` 操作：读取队列并返回本轮工作上下文，或核验本轮结果并返回决策。Sandcastle 拥有循环、子进程和 Git 生命周期；共享命令不调用 `run()`、不循环重试、不承担合并与 worktree 清理。无需新增独立 runner/package。

机器读取的项目参数只有一份权威配置，`docs/agents/runner.md` 解释配置并指向它。具体文件名与公开 API 命名在 P4–P5 沿用现有风格确定，不影响本计划的行为边界。共享命令路径在 setup 时验证；容器内需要的完整 skills 按既有安装或只读挂载方式提供，不能依赖仅在宿主有效的 symlink。

## 执行时序

1. 宿主读取本次运行的配置与约定，检查环境、目标分支状态和未处理现场。
2. 原生循环生成新的 iteration/attempt 身份，调用共享 `prepare` 从明确的工作范围选择一票。已耗尽或全部阻塞时，记录 `no-work` 或 `blocked` 并结束，不为说明空队列再启动一次 agent。
3. 为选定工作创建任务分支与 worktree，建立持久证据目录映射，将本轮身份、选定 ticket 和路径传入 prompt。Agent 认领指定任务并执行 `implement`。
4. Agent 结束后确认其执行进程已经停止；需要同步的 provider 将候选提交同步到宿主任务分支。读取并验证本轮结果，保全所需证据，然后调用共享 `verify`。
5. 只有核验通过，才将被核验的候选提交合入目标分支。核验到合入之间如果候选提交、目标分支或约定发生变化，停止并保留现场，不能把未经验证的新 merge 结果当成已验收交付。
6. 确认目标分支持久化、所需证据可读与清理结果，写入宿主持久运行记录，随后才分配下一轮。任何步骤失败都留下原因与恢复引用。

完成信号只影响停止意图，不绕过第 4–6 步。`held`、`incomplete`、格式错误和检查进程错误分别记录；都不能合入或启动下一票。`no-work` 与 `blocked` 也需要与宿主队列读取结果一致。

本轮先实现串行 AFK。配置和已约定验收要求在本轮开始时固定，agent 输出不能重新定义核验规则。这个执行约束不等于 `noSandbox` 提供宿主权限隔离。

## 工作包与依赖

| 工作包 | 交付 | 阻塞项 |
| --- | --- | --- |
| P0 | 开发环境、验收配置与可复现基线 | 无 |
| P1 | 超时、取消与提前结束实际终止执行 | P0 |
| P2 | 活动观测与静默任务时限明确可用 | P1 |
| P3 | 证据和所有保留现场可恢复 | P0 |
| P4 | 单轮任务可在合并前接受或保留 | P1、P3 |
| P5 | Skills 共享命令核验真实 workflow 完成状态 | P4 |
| P6 | 原生多轮循环按核验结果推进和结束 | P4、P5 |
| P7 | Setup 产出可复用原生配置，并修正 Backlog 约定 | P2、P6 |
| P8 | 临时新项目真实 AFK，通过后完成交付验证 | P7 |

建议执行顺序：P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8。表中的依赖是实际阻塞关系，顺序是本次实现建议；P3 不需要等待 P2。每个工作包完成实现、评审和对应验收后再推进依赖它的工作。

### P0 — 建立可执行的开发与验收环境

在各修改仓库建立独立开发分支并记录起点，保留本次已有的未提交设计文档。安装 Sandcastle 锁定依赖，运行现有测试、typecheck 和构建；依赖安装失败或既有测试失败要留下原始原因。

进入 P0 前，skills 与 Sandcastle 都缺少 `docs/agents/acceptance.md`。P0 通过 `setup-agent-workflow` 的配置流程补齐它们：复用本次已同意的方法与仓库现有命令，声明共享命令测试由本次交付提供。无需重新采访已定的行为，也不为修改中的 runner 开启自举 AFK。

- **AC-P0.1**：基线命令与测试案例数可复现；未运行和失败项没有被记为通过。
- **AC-P0.2**：用现有 `SandboxService`/provider fake seam 与临时 Git 仓库准备公共 fixtures；涉及进程的 fixtures 只创建并回收自身拥有的进程。
- **AC-P0.3**：`acceptance-plan` 能将后续工作包要求绑定到真实命令、fixture 和证据目录；环境问题与本包可交付的准备工作分开记录。
- **Proof**：现有测试结果、环境版本、可运行的 fixture smoke check 与计划文件。新增行为不需要历史截图或性能 baseline；现有回归断言用于证明保留行为。

### P1 — 取消等待时实际停止执行

覆盖 D10，从 public abort/timeout 经过 Effect 与 sandbox handle，最终到进程或 provider 的终止机制。优先修复本次实际使用的 `noSandbox`；共享接口改动同时检查内建 providers 的取消传播与关闭错误。

- **AC-P1.1**：idle timeout、外部 abort、completion timeout 都不会留下该 invocation 的进程继续写入文件。
- **AC-P1.2**：先尝试正常终止，必要时升级；等待退出确认。无法确认终止时明确报告状态未知，阻止合并、清理仍在写入的目录和下一轮。
- **AC-P1.3**：正常完成与 trailing output 保留原有行为；结束后的取消不会误杀无关或后续 invocation。
- **Proof**：真实 shell → 子进程 → 后代进程 fixtures，观察 PID/退出和返回后的写入；同时覆盖拒绝终止与 completion signal 后仍存活的场景。只检查 Promise 抛错或 `subprocess.killed` 不足以证明终止。
- **主要入口**：`src/SandboxProvider.ts`、`src/SandboxFactory.ts`、`src/sandboxes/no-sandbox.ts`、`src/Orchestrator.ts`；复用相应 tests，并检查 `shutdownRegistry` 与 provider close 路径。
- **边界**：本机验证 macOS；保留 Windows 分支及既有 provider 接口兼容性。不能完成终止保证的 provider 必须明确暴露能力缺口，不能忽略关闭错误后继续。

Node 官方文档明确区分“发出 kill 信号”与“进程已经退出”，并说明杀死 shell 父进程不一定终止其后代；实现与测试应据此覆盖整个 invocation 的执行树。[Node child_process](https://nodejs.org/api/child_process.html#subprocesskillsignal)

### P2 — 区分活动、静默与总时限

覆盖 D9。将原始 stdout/stderr 的活动观测与 agent 输出解析分开，未换行输出也可反映活动。保留清晰的 idle 限制，同时提供独立的本轮绝对期限。

- **AC-P2.1**：stdout 未换行、stderr 持续输出或无法解析的输出仍会刷新活动记录，绝对期限不被刷新。
- **AC-P2.2**：完全静默的工具可以使用显式配置的执行时限；启用该模式时有有限的绝对期限。不能仅因子进程存在而无限续期。
- **AC-P2.3**：在配置期限内正常完成的静默任务成功；超过期限的任务通过 P1 真实终止。错误区分 idle、绝对期限与 completion timeout。
- **Proof**：短时可控进程与 fake clock 测试；在 agent CLI 不提供可靠 heartbeat 时，验证显式的有界静默模式，不凭假想的活动信号判断进展。
- **主要入口**：`Orchestrator.ts`、`SandboxProvider.ts`、`sandboxes/no-sandbox.ts`、`run.ts` 及 provider 共用 exec 接口。

### P3 — 保全证据与恢复信息

覆盖 D3、D6。保留每轮恢复引用，并给项目提供可声明的持久证据路径。优先复用已有 mount、宿主路径和 copy 能力；为 `noSandbox` 补齐必要的目录映射，避免只靠 prompt 要求 agent 写绝对路径。

- **AC-P3.1**：第一轮保留的 worktree 不因后一轮干净或报错而从结果/错误中消失；旧单路径字段的兼容含义明确。
- **AC-P3.2**：`acceptance/runs/` 等声明的 gitignored 证据目录在工作目录清理后仍能从宿主引用读取。不同 attempt 的路径互不覆盖。
- **AC-P3.3**：映射、复制或记录保存失败时保留可恢复源并报错；不会替换已有用户目录或因源“Git 干净”而删除仅存在于其中的必要产物。
- **AC-P3.4**：持久运行记录包含已完成轮次、候选/已合入提交、错误和恢复路径；记录失败阻止继续。
- **Proof**：临时仓库中的多轮成功/失败组合，实际删除可清理 worktree 后读取证据，以及文件操作故障注入。
- **主要入口**：`SandboxFactory.ts`、`WorktreeManager.ts`、`Orchestrator.ts`、`run.ts`、`errors.ts`、现有 provider mounts/copy 方法。
- **Provider 范围**：本次真实链路为 `noSandbox`；bind-mount 优先复用现有 mount。isolated provider 如不能用现有导出能力满足同一约定，启用该模式时应在启动前报告不支持，不假称已完成跨 provider 验证。

### P4 — 单轮合并前核验

先交付一条窄的端到端路径：一次 agent 执行结束，宿主检查接受则合入，检查保留则留下 source branch/worktree 并停止。新增能力显式启用，保持未启用时已有公开行为；启用后不能选择会直接改目标工作区的 `head` 策略。

- **AC-P4.1**：检查发生在进程停止、必要同步及证据保全之后，合并/分支删除/worktree 清理之前。检查可以读取本轮完整结果和候选提交。
- **AC-P4.2**：检查接受时合入被核验的候选 HEAD；检查保留或失败时，目标分支不接收这次交付，source branch 和恢复所需现场留下，包括 Git 干净的现场。
- **AC-P4.3**：候选 HEAD 或目标 HEAD 在检查后变化时停止；合并失败不会转成成功，也不会删掉候选分支。
- **AC-P4.4**：检查命令有时限并使用 P1 的取消机制；错误、协议无效、保留决定分别返回，不能把所有非零退出码当成正常 held。
- **Proof**：`SandboxLifecycle` + 临时仓库 + fake agent 的真实 Git 状态断言，包括同步顺序、clean held、检查进程失败和目标分支变化。
- **主要入口**：`SandboxLifecycle.ts`、`SandboxFactory.ts`、`run.ts`、`createWorktree.ts`。检查不能只挂在现有 `orchestrate()` 循环末尾；`wt.run()` 也必须遵循同一约定。
- **协议产物**：确定原生检查上下文与通用决策字段，包含宿主生成的本轮身份、分支/候选 HEAD、持久目录、结果引用和保留/继续意图。业务 outcome 保持可透传，Sandcastle 不内置 tracker 语义。

### P5 — 共享 workflow 核验命令

实现 skills 中唯一一份 `prepare`/`verify` 逻辑，并让 `implement`、`acceptance` 与它共享明确的完成记录格式。第一条完整集成路径使用 Backlog.md，其他 tracker 的现有手工 workflow 保持可用；未实现的自动核验不能静默退化成只相信 agent 的完成声明。

- **AC-P5.1**：`prepare` 按明确工作范围、triage 冲突、assignee、依赖与可读性选一票；父 spec 默认排除。读取失败、`no-work`、`blocked` 分别表示。宿主选定身份传给 agent，返回时必须匹配。
- **AC-P5.2**：`verify` 拒绝缺失、格式错误、旧 attempt、错误 ticket、空必需证据集合和不可读引用。
- **AC-P5.3**：在候选提交中核对 tracker 终态、验收报告与所声明的代码状态；报告的实现 revision 必须属于候选历史，验收后不能夹带未经验证的实现变化。仅在 Git object 库中找到某个 commit 不算持久化证明。
- **AC-P5.4**：报告与证据有可机器核验的最小关联记录，绑定 ticket/attempt、验收 verdict、实现 revision 和必需 artifact 引用；记录进入候选提交。机器记录与报告矛盾时拒绝，不能用 agent 自报的 `completed` 替代报告。
- **AC-P5.5**：宿主负责结构、身份、引用和实际持久化的一致性检查；验收 skill 负责按既定标准判断交付。检查器不会重新发明产品验收标准。
- **Proof**：Node 内置 test runner + 临时 Git/Backlog fixtures；将已发现的空 artifacts、无关 commit、父 spec 假阻塞作为反例。完成任务经 `complete` 收纳后仍可核验，依赖仍满足。
- **主要入口**：新共享脚本与 tests、`implement/SKILL.md`、`acceptance` 的 report/result 格式、`setup-agent-workflow/runner.md` 和 result 协议 reference。CLI 通过 argv 调用，项目参数不拼成可执行 shell 文本。

### P6 — 原生多轮循环完成两票并正确停止

将 P4 的单轮决定、P5 的共享命令与 Sandcastle 内建循环接通。每轮开始前调用 prepare，创建新身份；每轮结束后先完成核验、合入、清理和记录，再考虑下一轮。

- **AC-P6.1**：两张可执行任务按次序完成并合入，先前任务不被重复选择，随后经宿主队列核验正常结束。
- **AC-P6.2**：第一轮 held、缺少结果、证据失败、记录失败或清理失败时，没有第二次 agent/worktree 分配。迭代上限与队列耗尽有不同结束原因。
- **AC-P6.3**：逐轮结果可定位到正确 attempt、任务分支和提交；后轮错误不抹掉前轮记录。完整检查输入不受显示用 stdout tail 截断影响。
- **AC-P6.4**：逐轮检查能在合并前使用结构化结果；复用现有 `Output` 提取/校验能力，不重新实现宽松的日志猜测器。保留旧单轮 `RunResult.output` 语义，为新模式定义明确的逐轮结果与错误行为；提取失败停止，不隐式重开一次任务。
- **Proof**：原生 `run()` + fake agent/真实本地假进程 + 共享命令 + 临时 Backlog 仓库，验证真实调度顺序与调用数量。
- **主要入口**：`Orchestrator.ts`、`run.ts`、`createWorktree.ts`、`PromptArgumentSubstitution.ts`、`extractStructuredOutput.ts`。修改时明确更新 ADR 0010 的单轮 output 限制及 ADR 0019 的进程泄漏说明。

### P7 — Setup 配置与 Backlog 规则

更新 setup，使新项目安装/连接已具备能力的 Sandcastle 与完整 skills，通过原生入口启动 P6 链路。将旧外层循环要求迁移为版本/能力检查和配置规则。

- **AC-P7.1**：新项目只获得入口、prompt 和项目参数，核验调用已安装的共享脚本；没有复制一套外层循环、Git 恢复器或 checker 源码。共享脚本不可用时在启动前报告准备缺口。
- **AC-P7.2**：显式配置合入策略、活动/总时限和持久证据路径；绑定正确的 agent/provider、skill 路径及 `promptFile`。旧版本缺少必要能力时提示升级，保持未验证，不自动生成旧 wrapper 充数。
- **AC-P7.3**：Backlog 模板区分 Done、complete/cleanup、archive；遵循已选择的定期收纳策略；readiness 使用真实 CLI 字段或 task detail。
- **AC-P7.4**：setup 重跑保留已定模型、认证方式和项目验收要求，迁移重复流程规则；旧日志、保留 worktree 和证据不因迁移被删除。
- **Proof**：在新项目 fixture 和带旧配置 fixture 中执行配置验证；使用真实 CLI 验证 Backlog 生命周期。Prompt-driven setup 通过后续真实配置过程验收，不以文案匹配测试代替行为证明。
- **主要入口**：`setup-agent-workflow/SKILL.md`、`references/sandcastle.md`、`references/unattended-execution.md`、`runner.md`、`issue-tracker-backlog-md.md`。相应指令按 `writing-for-agents` 与现有仓库约定编写。

### P8 — 打包、真实试验与修复回归

构建 fork 后使用 `npm pack` 的本地包，在临时新项目中安装；确认实际 import 到的是本次构建，记录 tarball 与源 commit/未提交状态。只使用包的公开入口，避免 source link 掩盖 exports 或打包缺陷。

- **AC-P8.1**：从一个临时新项目执行 setup，再由 Kimi + noSandbox + Backlog 完成两张小任务；第二张依赖第一张，以观察已合入任务解锁后续任务。任务选择小型、可快速验收的行为，沿用该项目选定的验收方法；UI 任务仍使用已约定的 UI 证明。
- **AC-P8.2**：真实记录能对上版本、attempt、ticket、source/target 提交、报告与持久证据；末尾 `no-work` 正常结束。完整 required 场景都已运行并通过。
- **AC-P8.3**：已有 `workflow-e2e-demo` 保留为历史回归来源；使用其配置的副本证明升级迁移，没有操作正式项目或其任务队列。
- **AC-P8.4**：新发现的问题有归属、可复现证据与修复记录；先重跑受影响的便宜测试，再重跑真实完整链路。全部约定项通过、发现的问题处理完，才结束本轮验证。
- **Proof**：真实运行报告、低成本故障测试报告、包检查与最后一次完整回归。Token/耗时按运行记录保留，不额外发起真实 agent 运行去证明已由确定性测试证明的细节。
- **执行环境**：沿用现有 Kimi 安装和已选择的认证/模型渠道，启动前重新确认可用性；本机存在凭据不代表此次试验已验证认证成功。端口、数据与 artifact 根使用临时项目自己的配置。

## 当前检查结果与实施门槛

| 对象 | 本次观测 |
| --- | --- |
| skills 起点 | `0ebb852f1a46614e0aafe43813221291afdbcc6c`，当前已有未提交的 settle 文档 |
| Sandcastle fork 起点 | `e99f832f26dc9d245c019a9ddd19fa5dee792427`，0.12.0，工作区干净；没有 `node_modules` |
| 旧 demo 起点 | `cc0f342fb12ffd3ea170983d979ddf3017af4c24`，工作区干净 |
| 本机 CLI | Node 24.21.0、npm 11.19.0、pnpm 12.3.4、Backlog 1.51.0、Kimi 0.42.0 |
| skills 完整性 | `bash .githooks/pre-commit` 通过 |
| 旧 demo 回归 | `node --test --test-reporter=spec scripts/afk-run.test.mjs`：33 passed，0 failed，0 skipped；包含临时仓库用例 |
| Sandcastle 回归/typecheck/build | 未运行，P0 安装依赖后执行；现有源码核对不等于测试通过 |
| 修复后的真实 AFK | 未运行，P8 执行；当前绿色 demo 测试不覆盖新发现的全部缺陷 |

常用工程命令在各自仓库执行：

```sh
# Sandcastle：P0 先按 package-lock.json 安装并确认工具版本
npm ci
npm run typecheck
npm run build
npm test

# Skills：仓库已有完整性检查
bash .githooks/pre-commit

# P5 新增共享命令测试后执行；此入口当前尚不存在
node --test skills/engineering/setup-agent-workflow/scripts/*.test.mjs
```

Sandcastle 修改先运行受影响文件的 Vitest 用例，再运行其要求的工程检查。Public 行为改动更新 README，按仓库规则添加 changeset；实现 bugfix 与新增能力分开描述，检查已有 changeset 避免重复。本计划不包含向 npm 发布、向上游发送消息或迁移正式项目。

每包进入实现前按 `implement` → `acceptance-plan` 绑定该包合同；完成实现后独立 code review，再执行 acceptance，保留 passed/held 与证据。本计划的工作包由当前会话执行，不作为 `ready-for-agent` 队列，也不为修改中的 runner 开启 AFK 自举。工程命令和执行顺序以各仓库的 `docs/agents/acceptance.md` 为准。

当前会话可写 skills 仓库与临时目录；Sandcastle fork 和旧 demo 位于其外。到实际写入 fork、安装依赖时，通过运行环境的权限机制取得所需写入权限；规划与只读核对不受此影响。
