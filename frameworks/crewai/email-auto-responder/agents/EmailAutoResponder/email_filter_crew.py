from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from langchain_community.tools.gmail.get_thread import GmailGetThread
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_openai import ChatOpenAI

from agents.EmailAutoResponder.tools.create_draft import create_draft

@CrewBase
class EmailFilterCrew:
    """Email Filter Crew"""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    llm = ChatOpenAI(model="gpt-4o")

    @agent
    def email_filter_agent(self) -> Agent:
        search_tool = TavilySearchResults()
        return Agent(
            config=self.agents_config["email_filter_agent"],
            tools=[search_tool],
            llm=self.llm,
            verbose=True,
            allow_delegation=True,
        )

    @agent
    def email_action_agent(self) -> Agent:
        gmail = GmailGetThread()
        return Agent(
            config=self.agents_config["email_action_agent"],
            tools=[gmail],
            llm=self.llm,
            verbose=True,
            allow_delegation=True,
        )

    @agent
    def email_response_writer(self) -> Agent:
        return Agent(
            config=self.agents_config["email_response_writer"],
            tools=[create_draft],
            llm=self.llm,
            verbose=True,
            allow_delegation=True,
        )

    @task
    def filter_emails_task(self) -> Task:
        return Task(
            config=self.tasks_config["filter_emails_task"],
            agent=self.email_filter_agent(),
        )

    @task
    def action_required_emails_task(self) -> Task:
        return Task(
            config=self.tasks_config["action_required_emails_task"],
            agent=self.email_action_agent(),
        )

    @task
    def draft_responses_task(self) -> Task:
        return Task(
            config=self.tasks_config["draft_responses_task"],
            agent=self.email_response_writer(),
            context=[self.filter_emails_task(), self.action_required_emails_task()],
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
