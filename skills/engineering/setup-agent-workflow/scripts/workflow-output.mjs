/** Standard Schema v1: passed directly to Sandcastle Output.object(). */
export const workflowOutputSchema = {
  "~standard": {
    version: 1,
    vendor: "setup-agent-workflow",
    validate(value) {
      const issues = [];
      if (!value || typeof value !== "object" || Array.isArray(value))
        return { issues: [{ message: "Missing workflow output object" }] };
      for (const key of ["attemptId", "ticketId"])
        if (typeof value[key] !== "string" || !value[key])
          issues.push({ message: `Missing ${key} identity` });
      if (!["completed", "held", "incomplete"].includes(value.outcome))
        issues.push({ message: "Invalid workflow outcome" });
      if (
        value.unresolved !== undefined &&
        (!Array.isArray(value.unresolved) ||
          value.unresolved.some(
            (item) => typeof item !== "string" || !item.trim(),
          ))
      )
        issues.push({ message: "unresolved must be a list of strings" });
      if (value.outcome === "completed") {
        if (typeof value.receiptPath !== "string" || !value.receiptPath)
          issues.push({ message: "Completed output requires receiptPath" });
        if (value.unresolved?.length)
          issues.push({ message: "Completed output has unresolved steps" });
      } else if (!value.unresolved?.length) {
        issues.push({
          message: "Retained outcome requires nonempty unresolved steps",
        });
      }
      return issues.length ? { issues } : { value };
    },
  },
};
