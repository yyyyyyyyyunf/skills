# 每个项目通过配置接入 AFK

`setup-agent-workflow` 应让项目通过必要入口、prompt 和项目配置接入 Sandcastle AFK，通用调度、校验和恢复逻辑应复用已有能力，避免每个项目生成并维护一套专用执行程序。先判断现有 Sandcastle 能力能否满足已约定行为，再根据核实的缺陷或必要能力缺口修改 skills 或 Sandcastle fork；demo 中的 `afk-run.mjs` 是调查和验证的依据，不预设为后续项目的标准架构。
