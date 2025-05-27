from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

@CrewBase
class Concierge:
    """Concierge crew"""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def intent_analyzer(self) -> Agent:
        return Agent(config=self.agents_config["intent_analyzer"], verbose=True)

    @agent
    def local_guide(self) -> Agent:
        return Agent(config=self.agents_config["local_guide"], verbose=True)

    @task
    def local_guide_task(self, query: str = "") -> Task:
        config = self.tasks_config["local_guide_task"].copy()
        config["description"] = config["description"].format(query=query)
        
        return Task(config=config)

    @crew
    def crew(self, query: str) -> Crew:
        return Crew(
            agents=[self.local_guide()],
            tasks=[self.local_guide_task(query)],
            process=Process.hierarchical,
            manager_agent=self.intent_analyzer(),
            verbose=True,
        )
