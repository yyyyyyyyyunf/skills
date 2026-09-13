import {
  check,
  command,
  committedFile,
  git,
  regularFile,
  sha256,
  under,
} from "./workflow-io.mjs";

export function backlogReader(cwd, config) {
  const revision = git(cwd, "rev-parse", "HEAD");
  const cache = new Map();
  const read = (...args) =>
    command(cwd, [...config.tracker.command, ...args])
      .toString("utf8")
      .trim();
  for (const key of ["checkActiveBranches", "remoteOperations"])
    check(
      read("config", "get", key) === "false",
      `Unattended Backlog reads require ${key}: false`,
    );
  const json = (kind, ...args) => {
    const value = JSON.parse(read(...args, "--json"));
    check(
      value.schemaVersion === 1 && value.kind === kind,
      `Unsupported Backlog ${kind} response`,
    );
    return value;
  };
  const detail = (id) => {
    check(
      typeof id === "string" && /^[A-Za-z]+-\d+(?:\.\d+)*$/i.test(id),
      `Invalid Backlog ticket ID: ${id}`,
    );
    if (cache.has(id.toUpperCase())) return cache.get(id.toUpperCase());
    const task = json("task-view", "task", "view", id).task;
    check(
      task &&
        task.id.toUpperCase() === id.toUpperCase() &&
        Array.isArray(task.labels) &&
        Array.isArray(task.assignees) &&
        Array.isArray(task.subtasks) &&
        Array.isArray(task.dependencies) &&
        Array.isArray(task.acceptanceCriteria) &&
        Array.isArray(task.definitionOfDone),
      `Incomplete Backlog task detail: ${id}`,
    );
    check(
      under(task.path, [
        `${config.tracker.directory}/tasks`,
        `${config.tracker.directory}/completed`,
      ]),
      `Ticket ${id} is not in tasks or completed`,
    );
    // CLI fields must come from this committed checkout, including completed tasks.
    const bytes = committedFile(cwd, revision, task.path);
    check(
      bytes.equals(regularFile(cwd, task.path)),
      `Tracker file is not committed: ${task.path}`,
    );
    cache.set(id.toUpperCase(), task);
    return task;
  };
  const scoped = () => {
    const scope = config.queue.scope;
    if (scope.taskIds) return scope.taskIds.map(detail);
    const tasks = json("task-list", "task", "list").tasks;
    check(Array.isArray(tasks), "Incomplete Backlog task list");
    check(
      tasks.every(
        (task) =>
          task &&
          typeof task.id === "string" &&
          typeof task.status === "string" &&
          Array.isArray(task.labels) &&
          (task.parentTaskId === null || typeof task.parentTaskId === "string"),
      ),
      "Malformed Backlog task list entry",
    );
    // Backlog can silently omit malformed YAML. Reconcile every committed
    // task file before interpreting a label/parent scope as empty.
    const paths = command(cwd, [
      "git",
      "ls-tree",
      "-r",
      "-z",
      "--name-only",
      revision,
      "--",
      `${config.tracker.directory}/tasks`,
      `${config.tracker.directory}/completed`,
    ])
      .toString("utf8")
      .split("\0")
      .filter((path) => path.endsWith(".md"));
    const activePaths = new Set();
    for (const path of paths) {
      const match = /\/([A-Za-z]+-\d+(?:\.\d+)*) - [^/]+\.md$/i.exec(path);
      check(match, `Unrecognized task inventory path: ${path}`);
      const task = detail(match[1]);
      check(task.path === path, `Ambiguous task inventory record: ${path}`);
      if (under(path, [`${config.tracker.directory}/completed`]))
        check(
          config.queue.doneStatuses.includes(task.status),
          `Collected task is not terminal: ${task.id}`,
        );
      else activePaths.add(path);
    }
    const listed = tasks.map((task) => detail(task.id));
    check(
      listed.length === activePaths.size &&
        listed.every((task) => activePaths.has(task.path)),
      "Backlog task list does not match committed task inventory",
    );
    return listed.filter((task) =>
      scope.labels
        ? scope.labels.every((label) => task.labels?.includes(label))
        : task.parentTaskId?.toUpperCase() === scope.parentTaskId.toUpperCase(),
    );
  };
  return { detail, scoped };
}

export function taskContract(task) {
  return sha256(
    JSON.stringify({
      id: task.id,
      title: task.title,
      description: task.description,
      parentTaskId: task.parentTaskId,
      dependencies: task.dependencies,
      acceptanceCriteria: task.acceptanceCriteria.map((item) => item.text),
      definitionOfDone: task.definitionOfDone.map((item) => item.text),
      references: task.references,
      documentation: task.documentation,
    }),
  );
}

export function prepare(ctx, config, configPath) {
  check(
    git(ctx.hostRepoDir, "rev-parse", "HEAD") === ctx.targetCommit,
    "Target revision changed before prepare",
  );
  const reader = backlogReader(ctx.hostRepoDir, config);
  const q = config.queue;
  const remaining = reader
    .scoped()
    .filter(
      (task) =>
        !q.doneStatuses.includes(task.status) &&
        !task.subtasks.length &&
        !task.labels.some((label) => q.excludeLabels.includes(label)),
    );
  const blockers = [];
  const eligible = remaining
    .filter((task) => {
      const dependencies = task.dependencies.map(reader.detail);
      const readiness = task.readiness;
      check(
        readiness &&
          typeof readiness.isReady === "boolean" &&
          typeof readiness.isBlocked === "boolean" &&
          Array.isArray(readiness.blockingDependencies) &&
          Array.isArray(readiness.missingDependencies),
        `Missing readiness details for ${task.id}`,
      );
      const reasons = [];
      if (!q.readyStatuses.includes(task.status))
        reasons.push(`status: ${task.status}`);
      if (
        !task.labels.includes(q.readyLabel) ||
        task.labels.some((label) => q.conflictingLabels.includes(label))
      )
        reasons.push("triage role");
      if (task.assignees.some((actor) => actor !== q.actor))
        reasons.push("assignee");
      if (
        !readiness.isReady ||
        readiness.isBlocked ||
        readiness.blockingDependencies.length ||
        readiness.missingDependencies.length ||
        dependencies.some(
          (dependency) => !q.doneStatuses.includes(dependency.status),
        )
      )
        reasons.push("readiness/dependencies");
      if (!task.acceptanceCriteria.length)
        reasons.push("missing acceptance criteria");
      if (reasons.length) blockers.push({ ticketId: task.id, reasons });
      return reasons.length === 0;
    })
    .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  if (!eligible.length)
    return {
      version: 1,
      decision: remaining.length ? "blocked" : "no-work",
      metadata: { blockers },
    };
  const task = eligible[0];
  const parentContracts = [];
  const seen = new Set([task.id]);
  let parentId = task.parentTaskId;
  while (parentId) {
    check(!seen.has(parentId) && seen.size < 128, "Invalid parent task chain");
    seen.add(parentId);
    const parent = reader.detail(parentId);
    parentContracts.push({ ticketId: parent.id, sha256: taskContract(parent) });
    parentId = parent.parentTaskId;
  }
  const contractFiles = [...new Set([configPath, ...config.contractPaths])].map(
    (path) => ({
      path,
      sha256: sha256(committedFile(ctx.hostRepoDir, ctx.targetCommit, path)),
    }),
  );
  return {
    version: 1,
    decision: "run",
    metadata: {
      ticketId: task.id,
      taskPath: task.path,
      taskContract: taskContract(task),
      dependencyContracts: task.dependencies.map((id) => {
        const dependency = reader.detail(id);
        return { ticketId: dependency.id, sha256: taskContract(dependency) };
      }),
      parentContracts,
      contractFiles,
    },
  };
}
