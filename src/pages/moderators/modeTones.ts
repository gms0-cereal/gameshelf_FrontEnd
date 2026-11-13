import type { Tone } from "../../lib/moderationApi";

export function priorityTone(priority: string): Tone {
  switch (priority) {
    case "High":
      return "red";
    case "Medium":
      return "amber";
    default:
      return "purple";
  }
}

export function reportStatusTone(status: string): Tone {
  switch (status) {
    case "Resolved":
      return "green";
    case "Under review":
      return "purple";
    case "Dismissed":
      return "red";
    default: // "Pending"
      return "amber";
  }
}