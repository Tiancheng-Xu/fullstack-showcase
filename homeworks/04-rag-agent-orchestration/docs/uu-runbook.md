# UU NVIDIA CUDA training runbook

## 当前状态

`未开始`。2026-08-02 只完成本地准备；不得在本轮启动或操作 UU。

## 明日启动前确认

在点击 UU 设备启动按钮前，逐项向用户说明并确认：

- 设备：4070Ti/5070 云真机；
- 费用：450 U币/小时；
- 当前已知余额：1900 U币；
- 硬上限：4 小时、1800 U币；
- 停止线：3 小时 40 分开始下载，最迟 3 小时 50 分关机；
- 目的：在 NVIDIA GPU + CUDA 上完成 Qwen3-8B QLoRA 和 Adapter 验证。

没有当次明确确认，不得启动设备。

## NVIDIA/CUDA 预检

上传前只允许选择已经在 Mac 通过白名单和 SHA-256 验证的 ZIP。远程先核对 ZIP 哈希，再解压并运行：

```powershell
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv,noheader
Get-PSDrive -PSProvider FileSystem | Select-Object Name,Free,Used
py --version
```

随后安装 Python 3.11、PyTorch 2.11.0 CUDA 12.8 和 LlamaFactory 0.9.5，运行 `training/preflight.py`。CUDA 不可用、显存低于 11 GiB、磁盘低于 35 GiB、BF16 不支持或 PyTorch 版本不符时立即停止，不开始训练。

## 训练与停止

首次训练使用 `training/configs/qwen3-8b-smoke.yaml`。训练结束后必须完成冻结测试集评测、Adapter 白名单打包、下载和本地哈希核验，最后确认 UU 状态回到“未运行”。
