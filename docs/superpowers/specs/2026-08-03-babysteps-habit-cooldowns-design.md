# BabySteps 随机习惯冷却设计

## 目标

把现有“每个活动每天领取一次”改造成更有生命感的星宝习惯玩法：不同活动领取后进入
一段随机冷却，冷却结束时领取按钮自然重新出现。页面不展示下次可领取时间、倒计时或
冷却时长，避免把游戏机制误解为真实婴儿作息或育儿建议。

本设计延续 Sepolia 课程概念验证、双账本成长星和直接赠送能力。尚未发生真实部署，
因此直接更新待部署合约，不需要代理升级或数据迁移。

## 已确认玩法

| 活动 | 单次奖励 | 随机冷却 | 每个 UTC+8 自然日上限 | 未就绪文案 |
|---|---:|---:|---:|---|
| 喂养陪伴（Meal） | +3 | 3–4 小时 | 6 次 | 星宝现在还不饿 |
| 户外陪伴（Walk） | +5 | 8–12 小时 | 2 次 | 星宝正在休息 |
| 亲子共读（Read） | +7 | 4–6 小时 | 3 次 | 星宝还在回味故事 |

达到当天上限时统一显示“星宝今天已经很充实了”。

这些间隔只控制测试积分领取，不限制或建议现实活动。页面必须持续显示：

> 这是随机游戏状态，不代表真实婴儿的饥饿、睡眠或活动需求。

累计成长值和 StarBuddy 阶段阈值保持不变，便于课程现场演示；达到 Star 后仍可通过
冷却玩法继续获得可赠送成长星。本次不增加新阶段、道具或消费系统。

## 交互原则

### 不显示时间

- 页面不显示 `nextClaimAt`、具体时刻、剩余小时、分钟或倒计时。
- 未到冷却时间时，活动卡片保留，但领取按钮完全不渲染。
- 活动达到当天上限时同样不渲染按钮。
- 链上状态读取失败时不渲染任何活动领取按钮，避免错误地允许操作。
- 只有活动可领取时才渲染可点击按钮；交易签名或确认期间可以保留该按钮但必须禁用，
  防止重复提交。

选择隐藏按钮而不是长期 disabled，是为了让“星宝当前没有这个需求”的状态更自然。
卡片上的拟人文案仍会告诉用户功能没有损坏。

### 静默恢复

前端在钱包连接到 Sepolia 时每 60 秒静默重新读取三个活动的可用性。冷却结束后的
下一次轮询会让按钮自动出现。浏览器时间只用于触发轮询，不用于决定资格；最终资格
始终由 Sepolia 合约的 `block.timestamp` 判定。

用户切换钱包或网络时立即丢弃旧钱包的可用性展示并重新读取，不把旧状态当作新账户
状态。

## 合约状态

用每个钱包、每种活动的进度替换旧的单日布尔标记：

```solidity
struct ActivityProgress {
    uint64 nextClaimAt;
    uint64 totalClaims;
    uint32 utc8DayMarker;
    uint16 claimsToday;
}

mapping(address account => mapping(ActivityType activity => ActivityProgress progress))
    private activityProgress;
```

`utc8DayMarker` 保存 `currentUtc8DayId() + 1`，继续避免 mapping 默认值 `0` 与真实日期
编号冲突。当 marker 与当前 UTC+8 日期不同时，把 `claimsToday` 视为 0；首次成功领取
时写入新 marker。

`nextClaimAt` 仍然是公开链上状态的一部分，即使 Solidity 标记为 private 也可通过
存储分析观察。本产品承诺的是“页面不显示时间”，不是链上保密。

## 合约接口

删除已经不符合语义的 `hasRecordedToday`，新增：

```solidity
function getActivityAvailability(
    address account,
    ActivityType activity
) external view returns (bool available, bool dailyLimitReached);
```

该 getter 故意不返回时间。规则为：

- 若当天已达到活动上限：`available = false`、`dailyLimitReached = true`；
- 否则若 `block.timestamp < nextClaimAt`：两个值都是 false；
- 否则：`available = true`、`dailyLimitReached = false`。

`recordActivity(ActivityType)` 的顺序：

1. 根据 UTC+8 day marker 计算本次使用的 `claimsToday`；
2. 达到当天上限则回滚 `DailyActivityLimitReached`；
3. 未到 `nextClaimAt` 则回滚 `ActivityCoolingDown`；
4. 计算并保存随机冷却、当天次数和总领取次数；
5. 把奖励同时加入累计成长值与可转余额；
6. 发出不含儿童资料和下次领取时间的 `ActivityRecorded`。

错误接口不携带 `nextClaimAt`，避免钱包错误弹窗主动展示时间：

```solidity
error ActivityCoolingDown(address account, ActivityType activity);
error DailyActivityLimitReached(address account, ActivityType activity, uint256 utc8DayId);
```

现有双账本 getter、转账函数、转账事件、便签能力及其语义保持不变。

## 随机冷却

为每种活动定义最小时长与随机跨度：

```text
Meal: 3 hours + [0, 1 hour]
Walk: 8 hours + [0, 4 hours]
Read: 4 hours + [0, 2 hours]
```

成功领取时计算：

```solidity
uint256 entropy = uint256(
    keccak256(
        abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            msg.sender,
            activity,
            progress.totalClaims
        )
    )
);
uint256 cooldown = minimum + (entropy % (span + 1));
```

这不是密码学安全随机数。验证者可能影响 `block.prevrandao`，用户也可通过多钱包绕过
单钱包限制；因此它只能影响无价格课程积分的游戏节奏，不得用于博彩、资产分配、公平
抽奖或真实健康决策。当前范围不接 Chainlink VRF，以避免订阅费、异步回调和额外合约
复杂度。

## 前端数据流

`useGrowth` 继续拥有活动读取与领取交易状态，但把三个 `hasRecordedToday` 读取替换为
三个 `getActivityAvailability` 读取。每项映射为：

```ts
type ActivityAvailability = {
  available: boolean;
  dailyLimitReached: boolean;
};
```

hook 对可用性查询设置 `refetchInterval: 60_000`。所有必需读取成功前，活动状态为
`undefined`，页面不得用默认 `false` 猜测。领取成功 receipt 后刷新累计成长值、成长
阶段、可转余额和三个活动可用性；只拿到 transaction hash 时仍保持确认中。

错误映射新增：

- `ActivityCoolingDown` → “星宝的这个活动还没有准备好。”
- `DailyActivityLimitReached` → “星宝今天已经很充实了。”

错误名称必须兼容 viem 的嵌套 `cause.data.errorName`，不得回显 RPC、账户或内部堆栈。

## 页面设计

活动卡片根据链上状态渲染：

```text
available = true
  → 显示领取按钮

available = false, dailyLimitReached = false
  → 隐藏按钮，显示对应拟人状态

dailyLimitReached = true
  → 隐藏按钮，显示“星宝今天已经很充实了”

state = undefined / read error
  → 隐藏按钮，显示读取或重试状态
```

不渲染 disabled 的冷却按钮，不添加隐藏倒计时到 `aria-label` 或辅助文本。屏幕阅读器
只读出当前状态。领取按钮在钱包签名/链确认期间可以 disabled，并保留已有的签名、
广播、receipt 成功和错误反馈。

“喂养陪伴”是游戏签到名称，不要求填写奶量、时间、喂养方式或儿童身份信息。

## 测试策略

### 合约

- 每种活动第一次可领取，随后在最短冷却前必定不可领取。
- Meal 最晚 4 小时、Walk 最晚 12 小时、Read 最晚 6 小时后必定重新可领取。
- 生成的冷却始终落在各自闭区间内；测试不依赖某一个随机结果。
- 在 UTC+8 同一天达到 6/2/3 次后回滚并保持所有积分、余额和进度不变。
- 北京时间跨日会重置当天次数，但不会绕过仍未结束的冷却。
- UTC 午夜但北京时间同日不会重置次数。
- 重复领取继续正确增加累计成长值和可转余额；转账与便签状态保持独立。
- 事件和错误不包含下次领取时间或任何字符串。

### Hook 与页面

- 三个可用性读取只在正确钱包和 Sepolia 上启用，并每 60 秒轮询。
- 未完成全部读取时不显示任何领取按钮。
- 冷却、当天上限和可领取三种状态映射正确。
- 冷却卡片不包含具体时间、倒计时、小时或分钟文本。
- 冷却时按钮不存在；可领取时出现；交易中按钮存在但 disabled。
- receipt 成功后刷新所有七项状态：累计值、阶段、可转余额和三项可用性，以及当前
  活动相关状态；具体查询键数量以实现中的唯一查询为准，不重复刷新同一键。
- 钱包切换、拒签、reverted receipt 和嵌套自定义错误继续安全处理。

## 验收状态

QA 必须单独记录：本地冷却合约、前端隐藏按钮行为、自动化、浏览器静默恢复、Sepolia
部署、Etherscan 验证和真实冷却交互。真实验收不能等待最短 3 小时来冒充完成；可在
Sepolia 首次领取后验证按钮隐藏和链上错误，重新出现只能在真实冷却结束后直接观察，
或明确保持待验收。
