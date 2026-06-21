# WalDrive 竞品深度对比 — 实证调研（2026-06-20）

> 方法：三路并行 subagent，`git clone` 代码实测 + 跑 live demo + 抓提交页。每条结论标「代码实证 / 仅宣称 / 查不到」。
> 来源限制：DeepSurge 项目列表在登录墙后（查不到）；GitHub `sui-overflow-2026` topic 覆盖不全，主要用 gh 按时间扫 2026-03 后新建的 Walrus 仓库。Suisei / Barzakh / opengalaxy 仍查不到。

---

## 一、直接对手

### Arbor — 威胁中高
- **定位**：「Git for AI agents」——agent artifact 内容寻址存 Walrus，Sui Move 管版本/分支/合并/provenance DAG。
- **实证**：单作者 7 天 15 commits、~3200 LOC。链上模型比我们深——ArtifactNode frozen 不可变、`parents: vector<ID>` 支持 N-way merge DAG、Repository 内嵌 writer 白名单 + k-of-n 审批 + 分权（proposer 不能自批）。testnet 包已发布（`0x15e07f…cf30`）。**Move 测试仅 2 个**。
- **live demo**：`arbor-seven.vercel.app` 是真 dApp，从链上 events 重建 provenance timeline + content-addressed diff（「identical」检测），三个 agent 地址跑通 create→commit→fork→propose→merge。浏览器钱包（dapp-kit），非进程内 keypair。
- **揭穿点**：宣称用 `@mysten/walrus` SDK，但实际写路径仍是公共 publisher HTTP PUT（SDK 只用来做 blobId↔u256 编码）——和我们一样不是 WAL-funded 上传。MemWal（`examples/memwal.ts` 旁路、env-gated no-op）和 Seal（`Arbor-seal-policy/`，README 自认 stretch、未接进 client）都是**连了没接进核心**，装饰性。
- **无 MCP/CLI**，只有 SDK + 单 web 页。

### Mnemo — 威胁中
- **定位**：AI 对话记忆层。把任意 AI 工具 base URL 指向 Mnemo proxy，对话被动捕获 → 加密 → 存 Walrus → Sui 索引 → 跨工具语义搜索。卖点是 on-chain dead-man's switch 继承。
- **强宣称核实（全部代码实证为真）**：
  - Seal 加密 — **属实但间接**：Move 里有真 `seal_approve`（owner/delegate/heir 三条件访问策略），但 `@mysten/seal` 不在任何 package.json，加密执行外包给外部 MemWal relayer，本 repo 只提供链上策略层。
  - fork MemWal — **属实**：`timix648/MemWal` 真实存在，Move 模块/函数签名对齐上游。
  - 61 个 Move 测试 — **属实，实测 `sui move test` → 61 passed / 0 failed**。这是它最硬的一项。
  - zkLogin gasless — **属实**：web 用 `@mysten/enoki`，Google 登录 + sponsorTransaction。
- **形态**：5 个微服务（Python FastAPI ×3 + TS ×2）+ 外部 relayer + Postgres/pgvector/Redis，运维重，~10.2k LOC。
- **demo**：`mnemo-zeta.vercel.app` 在登录墙后（zkLogin），墙后功能未能验证。视频 `youtu.be/72J1FkYaExc`（内容未看）。入口是**被动 HTTP proxy**，无 MCP/CLI/SDK。
- **定位与我们错开**：它存对话记忆/继承，我们是 agent 数据网盘。

### Deploy by Suize — 威胁中
- **定位**：agent 一键把静态站点部署到 Walrus，返回 `<id>.suize.site`，每字节 integrity-verified。Suize「AI agent 支付 rail」体系下的一个 merchant 产品。
- **实证**：真产品，10 站点在线（含 `suize-mcp-session-test` / CLI 入口痕迹），闭源 SaaS（GitHub/npm 搜不到仓库）。
- **agent 自服务付费闭环（实证）**：`POST api.suize.io/deploy` 裸请求回 **402（x402 challenge）** → agent 用自有 key 签 **gasless USDC** 付款重试 → 得 live URL。机器可读契约 `deploy.suize.io/llms.txt`。「address is the account」，无浏览器/无 gas/无 API key。
- **自动续期（实证）**：链上 Subscription object + push 模型——到期前后端对账户所有订阅站点续 Walrus 存储，续期需用户私钥签 gasless USDC。定价 $0.50/deploy、订阅 **$19.99/月**。
- **对我们的意义**：定位是网站部署非网盘，**不正面撞型**，但把「自动续期」做成了已上线付费产品，且 x402 + gasless USDC + llms.txt 正是我们「agent 付费」还停在叙事阶段的东西。

---

## 二、新发现：SuiEdge Memory Gateway —— 最像 WalDrive 的新对手 ⚠️

`DaviRain-Su/suiedge-memory-gateway`

- **定位**：wallet-owned memory/artifact gateway for agents——Sui object 锚 ownership/version/access + Walrus 存 artifact + REST & **MCP** + Next.js dashboard 看 timeline。
- **完成度高（实证）**：193 文件 / 16 commit，含完整 REST + **MCP（artifact/context tools）** + 3 个 Move 合约 + Move 测试 + AI SDK + dashboard。
- **架构与 WalDrive 逐项同构**，且**用 Seal 加密 + access policy + 版本 + 撤销**——正面踩中我们「不加密、未对齐 MemWal」两个短板。
- **它的空白 = 我们的护城河**：它是 gateway/控制面（REST+MCP 为主）+ web dashboard，**没有桌面原生 console 的浏览/预览/搜索/拖拽流畅交互**——而这正是 WalDrive 的 pitch。

---

## 三、赛道态势（gh 扫新建 Walrus 仓库 + 筛 WalDrive 形状）

| 名字 | 定位 | 完成度 | 与 WalDrive 重叠 | 新威胁 |
|---|---|---|---|---|
| **SuiEdge Memory Gateway** | wallet-owned artifact gateway + Sui object + MCP + dashboard + Seal | 高（193 文件/16 commit/MCP/3 Move） | **高** | **是·最像** |
| ChronicleOs | 多 agent R&D lab，Walrus 当 shared FS + MemWal + dashboard | 中（无 Move、无 MCP） | 中 | 中 |
| synaptic-protocol | agent 可验证数据市场，AES-256 | 中（8 commit/4 Move） | 中 | 中 |
| M2A / Memory2Agents | 多 agent 编排 + MemWal + MCP + Studio | 低存疑（仅 1 commit、0 tsx） | 中 | 低 |
| Quadra data layer | Walrus JSON DB + SDK，Seal 私有 | 中（库/HTTP） | 低 | 低 |
| wdoublesync_cli | CLI 同步本地文件夹到 Walrus | 低（单 CLI） | 中（撞 CLI 入口） | 低 |
| vanishvault / walrussign / Provenance / tatum Data Room | 自毁存储 / PDF 签名 / 存证 / 数据室 | 单点 demo | 低 | 低 |
| avow / tape / ProofCapsule | money-moving agent 审计存证 | 中–高 | 低（金融审计） | 低 |
| Suisei / Barzakh / opengalaxy | — | 查不到 | — | 未证实 |

> 排除：dendam / world-cup-oracle / beluga 等属「Walrus Memory World Cup / Sessions S4」活动，非 Overflow。

**总判断**：赛道很拥挤且重度同质——「agent memory/artifact 存 Walrus + 可验证 + 加密」是主流叙事，MemWal/Seal 几乎人手一个。但**全赛道没有第二个做桌面原生 app + 三入口（MCP/CLI/skill）**。

---

## 四、被竞品「做出来」验证的 WalDrive 短板

不是我们臆想，是对手已落地、会在评审前形成对比：

1. **不加密** — Mnemo（Seal 策略）、SuiEdge（Seal + access policy）、synaptic（AES-256）都做了。是 idea #032「可验证数据」的隐含期待。
2. **会过期** — Deploy by Suize 把「自动续期」做成已上线付费产品。
3. **未对齐 MemWal** — Mnemo fork、ChronicleOs、M2A、SuiEdge 都对齐了。
4. **agent 付费仍停在叙事** — Deploy 的 x402 + gasless USDC + llms.txt 是已落地范本。

**反超机会**：Arbor / Mnemo / SuiEdge 的 Seal/MemWal 不少是「连了没接进核心」（装饰性）。WalDrive 若真把 Seal 加密接进上传主路径 + 真做自动续期，就能在评审前以「实装」反超它们的「宣称」。

---

## 五、护城河（仍成立）

唯一有成品级**桌面原生 console** + **三入口（MCP + CLI + npx skill）** + **文件管理广度**（folder/tag/version/trash/preview/search/share）的项目。竞品全是 dev-tool / 库 / web dashboard / 被动 proxy / mock / headless。最像的 SuiEdge 也缺浏览/预览/搜索/拖拽的流畅交互——而流畅交互正是 WalDrive 的 pitch。

---

## 六、可偷的点（按性价比）

| 借鉴 | 来源 | 性价比 | 说明 |
|---|---|---|---|
| **Seal 加密接进上传主路径** | Mnemo / SuiEdge | 高 | 补最大短板；对手多是装饰性，实装即反超 |
| **到期前自动续 Walrus 存储**（链上订阅对象） | Deploy by Suize | 高 | 补「过期」短板 |
| **provenance timeline + content-addressed diff UI** | Arbor | 中 | 低成本高展示度，抄进 PreviewModal |
| **「MemWal 记 agent 知道什么 / 我们存 agent 做了什么」二分叙事** | Arbor | 高（纯叙事） | 把「网盘」抬成「agent 产出物的可验证层」 |
| **真做 merge/branch DAG**（`create_version` → 多父 DAG） | Arbor | 中 | 叙事对齐 provenance |
| **x402 + gasless USDC + llms.txt agent 自服务付费** | Deploy by Suize | 中 | 把「agent 付费」从叙事变 demo |
| MemWal 对齐（Move 模块/key-id 对齐官方） | Mnemo | 中（叙事） | 「我们也接 MemWal」 |
