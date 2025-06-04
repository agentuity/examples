import os
import datetime
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, ScrapeWebsiteTool
from dotenv import load_dotenv

load_dotenv()

serper_api_key = os.getenv("SERPER_API_KEY")
if not serper_api_key:
    raise ValueError("SERPER_API_KEY environment variable is required but not set")

search_tool = SerperDevTool(api_key=serper_api_key)
scraper_tool = ScrapeWebsiteTool()

def build_crew(topic, company_name, company_description, style_description):
    time_stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')

    researcher = Agent(
        role='Senior Research Analyst',
        goal=f"Identify and analyze recent articles (as of {time_stamp}) about {topic}, focusing on trends, challenges, and opportunities in the field.",
        backstory=f"You are an experienced research analyst with a strong background in {topic} sectors. You have a keen ability to sift through large volumes of information, extract relevant insights, and identify emerging trends in {topic}.",
        verbose=True,
        allow_delegation=False,
        tools=[search_tool, scraper_tool],
    )

    social_writer = Agent(
        role='Social Media Content Writer',
        goal=f"Create unique and engaging social media posts for LinkedIn, based on the research findings about {topic}.",
        backstory=f"You are a skilled content creator with a talent for crafting compelling narratives that resonate with diverse audiences. You have a deep understanding of various social media platforms and know how to tailor content to each platform's unique style and audience expectations. Your focus is {topic}.",
        verbose=True,
        allow_delegation=False
    )

    senior_editor = Agent(
        role='Senior Editor',
        goal=f"Review and finalize the written social media content on {topic}, ensuring it meets the company's standards, guidelines, and aligns with the latest industry trends.",
        backstory=f"You are a veteran editor with decades of experience in publishing and content creation. You have a keen eye for detail, a strong understanding of brand voice, and a passion for producing high-quality, impactful content in the {topic} space.",
        verbose=True,
        allow_delegation=False
    )

    research_links = Task(
        description=f"Conduct a comprehensive analysis of the latest articles from leading publications in the U.S. regarding the subject of {topic}. Identify key trends, relevant current events, notable trends, and potential industry impacts.",
        expected_output="""Full analysis report including all relevant articles with their associated link, headline, publication name, a summary of the article content in bullet points, and 2-3 key quotes from the article.""",
        agent=researcher,
        tools=[search_tool, scraper_tool],
        output_file=f'outputs/research_results_{topic}_{time_stamp}.md',
        create_directory=True
    )

    write_social_posts = Task(
        description=f"""
    Using the insights provided, craft an **engaging 2-3 non-repetitiveparagraph LinkedIn post** for each article from the perspective of {company_name} ({company_description}).  
    **Tone / style:** {style_description}; clear, tech-savvy, no hype, no exclamation points; no hyperlinks inside the body copy.

    **MANDATORY FORMAT – every post must look *exactly* like this:**

    [Body paragraph(s) here]

    #hashtag1 #hashtag2 #hashtag3  
    [Read more](<article_url>)

    **Hard constraints**
    1. Body paragraph(s) may NOT contain any links, hashtags, or numbered lists.
    2. After the blank line, output **2–3** topical hashtags on **one line**, separated by spaces.
    3. On the very next line, output a CTA phrase (choose ‘Read more’, ‘Learn more’, or ‘Discover how’) and hyperlink **only that phrase** to the article’s URL.
    4. Do not add any extra lines or characters before or after the pattern above.
    """,
        expected_output=(
            "A set of LinkedIn-ready posts. Each post ends with exactly one line of 2–3 "
            "hashtags, then one CTA line where only the CTA text is hyperlinked."
        ),
        agent=social_writer
    )


    edit_content = Task(
        description=f"Review all written social media content for accuracy, alignment with our brand voice, and overall quality. Ensure that the content is engaging, informative, and positions our company as a thought leader in {topic}. Avoid overuse of exclamation and hashtags.",
        expected_output="""A finalized document containing:
        - Edited and approved social media posts for LinkedIn (one post for each article identified in research)
        - A list of reference links to the original articles
        - Brief summaries of the selected articles
        - Any additional notes or suggestions for future content on this topic""",
        agent=senior_editor,
        output_file=f'outputs/final_report_{topic}_{time_stamp}.md',
        context=[research_links, write_social_posts]
    )

    crew = Crew(
        agents=[researcher, social_writer, senior_editor],
        tasks=[research_links, write_social_posts, edit_content],
        verbose=True,
        process=Process.sequential
    )

    return crew
