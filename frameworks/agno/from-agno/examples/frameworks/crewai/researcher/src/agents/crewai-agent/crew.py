from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from langchain_openai import ChatOpenAI


@CrewBase
class MyCrew:
    """MyCrew for researching and reporting on topics"""

    # Learn more about YAML configuration files here:
    # Agents: https://docs.crewai.com/concepts/agents#yaml-configuration-recommended
    # Tasks: https://docs.crewai.com/concepts/tasks#yaml-configuration-recommended
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def researcher(self) -> Agent:
        """Creates a researcher agent that specializes in finding information"""
        return Agent(
            config=self.agents_config["researcher"],
            llm=ChatOpenAI(model="gpt-4o-mini"),
            verbose=True
        )

    @agent
    def reporting_analyst(self) -> Agent:
        """Creates a reporting analyst agent that specializes in creating reports"""
        return Agent(
            config=self.agents_config["reporting_analyst"],
            llm=ChatOpenAI(model="gpt-4o-mini"),
            verbose=True
        )

    @task
    def research_task(self) -> Task:
        """Creates a research task for the researcher agent"""
        return Task(
            config=self.tasks_config["research_task"],
        )

    @task
    def reporting_task(self) -> Task:
        """Creates a reporting task for the reporting analyst agent"""
        return Task(
            config=self.tasks_config["reporting_task"],
            output_file="report.md"
        )

    @crew
    def crew(self) -> Crew:
        """Creates the research and reporting crew"""
        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,    # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
        )
