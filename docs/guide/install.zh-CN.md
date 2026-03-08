# 安装 omo claw

这份说明是给 AI coding agent 和人工操作员使用的。

## 目标

安装 `omo claw`，初始化本地 runtime，注册 OpenClaw 插件，并确认 bridge 处于健康状态。

## 关键标识

- 仓库：`https://github.com/Her-xanadu/omo-claw.git`
- 插件 id：`omo-claw`
- 插件名称：`omo claw`
- Gateway 方法：`omo-claw.status`
- 状态命令：`omo_claw_status`

## 推荐安装路径

### 方案 1：macOS + Homebrew

```bash
brew tap Her-xanadu/omo-claw https://github.com/Her-xanadu/omo-claw
brew install --HEAD omo-claw
omo-claw-install /path/to/your/openclaw/plugins/omo-claw
```

### 方案 2：npm + GitHub

```bash
npm install -g github:Her-xanadu/omo-claw
omo-claw-install /path/to/your/openclaw/plugins/omo-claw
```

### 方案 3：直接 git clone

```bash
git clone https://github.com/Her-xanadu/omo-claw.git
cd omo-claw
./scripts/setup-local.sh
```

## agent 需要完成的动作

1. 把仓库安装到用户的 OpenClaw 插件工作区；如果无法判断工作区，就退回到 `./omo-claw`。
2. 在仓库内执行 `./scripts/setup-local.sh`。
3. 让 OpenClaw 注册 `openclaw.plugin.json`。
4. 在 context-engine 配置里使用插件 id `omo-claw`。
5. 启动 `./integration/bridge-runtime/bridge-launcher.sh`。
6. 运行 `./tests/live/runtime-health.smoke.sh` 做验证。
7. 回报最终插件 id、Gateway 方法、状态命令和健康检查结果。

## 运行时验证

期望的 smoke 返回：

```json
{"healthy": true, "version": "1.2.21"}
```
