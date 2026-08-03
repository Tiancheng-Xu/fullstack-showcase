# BabySteps 链上成长积分概念验证设计

**日期：** 2026-08-03

**状态：** 设计稿已完成，等待用户集中审阅；实现保持暂停

**定位：** 在周日“链上记事本”最低作业要求之上，增加一个面向宝爸宝妈、爷爷奶奶的 BabyCoin 产品概念验证。成长积分真实记录在 Sepolia 合约中，但不做可交易代币。

## 1. 结论

采用“两层验收、一个应用”的方案：

1. **作业基础层：** 保留链上记事本的 `getNote`、`setNote`、`clearNote`，独立完成 Vite + React、wagmi、Hardhat、Sepolia、Etherscan 验证和前后端交互。
2. **BabySteps 加分层：** 在同一合约上增加活动打卡、链上不可转让成长积分、每日重复领取限制和数字纪念品解锁状态。

任何加分功能失败都不得被用来掩盖作业基础层未完成。状态文档必须分别记录基础作业和 BabySteps 增强功能。

## 2. 产品故事

产品暂名 **BabySteps · 成长星球**。

一个 Sepolia 钱包在概念验证中代表一个家庭。家庭完成孩子的日常成长活动后，由钱包签名记录活动并获得成长积分：

```text
选择成长活动
  → 写一条不含敏感信息的公开成长便签
  → MetaMask 签名
  → Sepolia 确认交易
  → 合约增加不可转让积分
  → 前端刷新积分与最新便签
  → 达到门槛后解锁数字成长徽章预览
```

这次验证的是“活动可以形成链上积分和数字纪念品资格”，不是完整的商业 BabyCoin。

## 3. 最低作业门槛

以下项目全部是硬性完成条件：

- 独立 Vite + React + TypeScript 前端。
- 前端使用 wagmi 连接 MetaMask。
- 使用 Hardhat 3 开发、编译和测试 Solidity 合约。
- 使用专用测试账户在 Sepolia 部署。
- 使用测试网水龙头测试币支付 Gas。
- 在 Sepolia Etherscan 完成源码开源验证。
- 完成连接、切换网络、读取、写入、清空、等待 receipt 和刷新恢复。
- 记录公开合约地址、部署/交互交易哈希和验证链接；不记录任何秘密。

BabySteps 增强功能只能在这些条件之上增加成果。

## 4. 概念验证范围

### 4.1 活动与积分

首版固定三种活动：

| 活动 | 合约枚举 | 单次积分 | 产品含义 |
|---|---|---:|---|
| 遛娃 | `Walk` | 5 | 户外陪伴与运动 |
| 好好吃饭 | `Meal` | 3 | 日常照护 |
| 健康里程碑 | `Health` | 10 | 仅记录通用成长节点，不记录疫苗或医疗详情 |

每个钱包对每种活动按 UTC 自然日只能领取一次。不同活动在同一天可以分别领取，避免为了演示必须等待一天。

数字成长徽章默认在累计 **15 分**时解锁，因此同一天完成 `Health + Walk` 即可走通完整演示。

### 4.2 积分性质

成长积分：

- 记录在 Sepolia 智能合约。
- 与钱包地址绑定。
- 不实现 ERC-20。
- 不可转让、不可交易、不可提现。
- 不承诺价格或升值。
- 不能由 owner 任意增发或扣减。
- 清空最新便签不会删除已经获得的积分。

“BabyCoin”是产品概念名称；界面使用“成长积分”，避免把课程演示描述成金融资产。

### 4.3 数字产品

达到 15 分后，前端解锁一张通用的 **星宝成长徽章**：

- 使用原创的通用卡通形象，不使用真实孩子照片。
- 形象只作为前端可视化预览，不在本次铸造成 NFT。
- 不上传姓名、生日、医疗记录或照片。
- 页面明确标注“未来可扩展为可选择铸造的数字纪念品”。

真实照片生成、IPFS、NFT、品牌装备和二级市场全部属于后续路线图。

## 5. 智能合约设计

继续使用 `OnchainNotebook`，保留已经实现和测试的基础接口：

```solidity
function getNote(address author) external view returns (string memory);
function setNote(string calldata note) external;
function clearNote() external;
```

增加：

```solidity
enum ActivityType {
    Walk,
    Meal,
    Health
}

error ActivityAlreadyRecordedToday(
    address family,
    ActivityType activity,
    uint256 dayId
);

event ActivityRecorded(
    address indexed family,
    ActivityType indexed activity,
    uint256 indexed dayId,
    uint256 reward,
    uint256 totalPoints,
    string note
);

function recordActivity(
    ActivityType activity,
    string calldata note
) external;

function getGrowthPoints(address family) external view returns (uint256);

function hasRecordedToday(
    address family,
    ActivityType activity
) external view returns (bool);

function isGrowthBadgeUnlocked(address family) external view returns (bool);
```

内部状态：

```solidity
mapping(address => uint256) private growthPoints;
mapping(address => mapping(ActivityType => uint256)) private lastRecordedDay;
```

规则：

- `dayId = block.timestamp / 1 days`，明确使用 UTC 链上日期。
- `recordActivity` 同样执行 280 UTF-8 字节上限。
- 成功打卡会把传入便签设为该钱包的最新链上便签。
- 只有 `recordActivity` 增加积分；普通 `setNote` 不增加积分，防止用基础记事本反复刷分。
- 同钱包、同活动、同 UTC 日再次打卡以自定义错误回滚。
- 不同钱包拥有独立积分和每日状态。
- `clearNote` 只删除最新便签，不减少积分、不清除每日领取记录。
- 合约不接收 ETH、不实现 owner、不提供管理员增减积分、不升级。

## 6. 前端设计

视觉方向采用“成长学习册”：奶油纸张背景、墨蓝正文、嫩芽绿和暖橙点缀。它有亲子温度，但不呈现真实儿童档案系统的假象。

单栏页面顺序：

1. **产品说明：** BabySteps、Sepolia 测试网、测试币无真实价值。
2. **隐私提示：** 链上内容公开，禁止填写孩子姓名、照片、生日、学校、疫苗或医疗详情。
3. **钱包卡：** MetaMask 安装、连接、缩略地址、网络与切换 Sepolia。
4. **成长积分卡：** 当前积分、`当前 / 15` 进度和徽章锁定状态。
5. **活动卡：** 遛娃、好好吃饭、健康里程碑；显示积分和今日是否已完成。
6. **成长便签：** 280 UTF-8 字节计数和公开内容提醒。
7. **操作：** “记录活动并获得积分”和“仅保存成长便签”。
8. **最新链上便签：** 独立读取、重试和清空操作。
9. **交易证据：** 等待钱包签名、等待链上确认、成功/失败和 Sepolia Etherscan 链接。
10. **成长徽章：** 15 分前显示解锁条件，达到后展示星宝成长徽章预览。

## 7. 数据流

### 基础记事本

```text
输入便签
  → setNote
  → MetaMask 签名
  → receipt success
  → 重新读取 getNote
```

### 活动打卡

```text
选择 ActivityType + 输入便签
  → 前端检查钱包、Sepolia、280 字节和今日状态
  → simulate recordActivity
  → MetaMask 签名
  → 等待 receipt
  → 精确刷新 getNote / getGrowthPoints / hasRecordedToday
  → 按链上积分计算徽章是否解锁
```

钱包返回交易哈希只代表已广播。只有 receipt 成功后才能显示“已获得积分”。

## 8. 错误与防作弊边界

- 未安装钱包、未连接和错误网络分别显示引导。
- RPC 读取失败不能伪装成 0 分或空便签。
- 用户拒绝连接或签名时保留草稿。
- 签名等待和链上确认期间禁止重复提交。
- 今日已经领取的活动在前端禁用；合约再次强制回滚，不能只依赖前端。
- 超过 280 UTF-8 字节时前端禁止提交，合约再次强制。
- 本概念验证只能降低钱包重复领取，不能证明真实世界确实完成了遛娃、吃饭或健康活动。
- 不上传票据、不接医疗机构、不接定位、不尝试建立真实世界预言机。

## 9. 测试

合约现有记事本测试必须全部保留，并增加：

- 三种活动分别获得 5、3、10 分。
- 同钱包同活动同 UTC 日重复打卡回滚。
- 同钱包同日可以打卡不同活动。
- 不同钱包领取状态和积分隔离。
- `recordActivity` 更新最新便签并发出完整事件。
- `recordActivity` 同样遵守 280/281 UTF-8 字节边界。
- 普通 `setNote` 不增加积分。
- `clearNote` 不减少积分、不重置每日领取。
- 14 分未解锁、15 分及以上解锁。

前端测试增加：

- 今日活动状态和按钮禁用。
- 三种积分文案与累计进度。
- 钱包签名和链上确认阶段分离。
- receipt 后精确刷新四类读取。
- 重复领取、超长、读失败和拒绝签名的可理解提示。
- 15 分前后的徽章锁定/解锁状态。
- 原始作业的保存、刷新恢复、覆盖和清空仍单独通过。

## 10. Sepolia 验收

只有以下证据全部存在才能完成：

1. Hardhat 自动化和前端测试通过。
2. Ignition 将同一版本合约部署到 Sepolia。
3. Etherscan Contract 页显示源码已验证和 ABI。
4. 基础 `setNote`、刷新读取、覆盖、`clearNote` 闭环通过。
5. 两种不同活动成功累计至少 15 分。
6. 同日重复同活动在前端被阻止，并由自动化合约测试证明链上会回滚。
7. 刷新后积分、最新便签和徽章解锁状态均从链上恢复。
8. QA 将仓库提交、合约地址、部署交易、交互交易和验证链接关联起来。

## 11. 明确不做

- ERC-20 BabyCoin、转账、提现、价格或交易市场。
- ERC-721/NFT 铸造。
- 真实孩子照片生成、IPFS 上传或医疗数据。
- 品牌购买凭证、随机空投、优惠券和商业结算。
- 家庭多人角色、祖辈子账户、社交登录或托管钱包。
- GPS、设备数据、医院签名或活动真实性验证。
- 主网部署和生产发布。

## 12. 默认决策与待用户审阅项

为了不中断设计，本稿采用以下默认值；用户回来后可以集中修改：

1. 产品名：`BabySteps · 成长星球`。
2. 活动：遛娃、好好吃饭、健康里程碑。
3. 奖励：5、3、10 分。
4. 每种活动每个 UTC 日一次。
5. 15 分解锁星宝成长徽章预览。
6. 清空便签不扣积分。
7. 概念验证不使用真实孩子照片，不铸造 NFT。

若这些默认值不修改，后续实施计划按本稿执行。

## 13. 同学作业取长补短

本设计参考了用户提供的三份公开作业，但不复制其源码：

- `Tearl/notepad-dapp`：采用钱包签名与链上确认分阶段、receipt 后刷新、错误网络门禁和 Etherscan 交易链接；不采用多笔记数组、owner 暂停和仅靠前端限制长度。
- `ai183club/web3-examine-myself`：采用 hook 管理读取/写入/确认边界和部署后地址可追溯思想；不采用 RainbowKit、WalletConnect 或静默配置回退。
- `panyongxu1002/chainnote-dapp`：采用 UTF-8 字节计数、删除确认和读取/空态/配置错误分离；不采用会随历史线性增长的多笔记扫描。

交付时必须保证仓库提交、前端构建所用地址、Sepolia 合约、部署交易和 Etherscan 已验证源码属于同一次可追溯发布，不能用不对应的生产页面代替证据。
