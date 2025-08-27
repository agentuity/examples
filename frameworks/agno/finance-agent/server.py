from agentuity import serve
from agents.FinanceAgent.agent import run, welcome

if __name__ == "__main__":
    serve(
        agents={
            "FinanceAgent": {
                "run": run,
                "welcome": welcome,
            }
        }
    )
