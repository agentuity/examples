import { Step, Workflow } from "@mastra/core";
import { z } from "zod";

const getFixtures = new Step({
  id: "get-fixtures",
  description: "Fetch match fixtures English Premier League matches",
  inputSchema: z.object({
    date: z.string()
  }),
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{
      date: string;
    }>("trigger");

    if (!triggerData) {
      throw new Error("Trigger data not found");
    }

    const { date } = triggerData;
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${date}&l=English_Premier_League`);
    const { events } = await response.json();
    
    return {
      fixtures: events
    };
  }
});

export const soccerWorkflow = new Workflow({
  name: "soccer-workflow",
  triggerSchema: z.object({
    date: z.string().describe("The date to get fixtures for in YYYY-MM-DD format")
  })
})
.step(getFixtures);
