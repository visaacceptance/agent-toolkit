import os
import httpx
from openai import OpenAI

def test_openai_integration():
    # Load environment variables
    
    # Get OpenAI API key from environment
    api_key = ''
    if not api_key:
        raise ValueError("Please set OPENAI_API_KEY in your .env file")
    
    # Create an OpenAI client with SSL verification disabled
    client = OpenAI(
        api_key=api_key,
        base_url="https://model-service-preview.genai.visa.com/v1",
        http_client=httpx.Client(verify=False)
    )

    # A simple tool definition for weather
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get current temperature for a given location.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City and country e.g. Bogotá, Colombia"
                        }
                    },
                    "required": ["location"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }
    ]

    # A second tool definition for cybersource usage
    # so we can pass them to openai's tools param
    cybsTools = [
        {
            "type": "function",
            "function": {
                "name": "search_transactions",
                "description": "Search for transactions in Cybersource by providing an advanced query string, e.g. 'submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY]'",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Cybersource advanced query"
                        }
                    },
                    "required": ["query"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }
    ]
    
    try:
        # Test with the weather tool
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "What is the weather like in Paris today?"}],
            tools=tools
        )
        print("Weather calls:", completion.choices[0].message.tool_calls)

        # Test with the cybersource tool
        cybsCompletion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Give me my cybersource transactions for past day"}],
            tools=cybsTools
        )
        print("Cybersource calls:", cybsCompletion.choices[0].message.tool_calls)

    except Exception as e:
        print(f"Error testing OpenAI API: {str(e)}")
        raise

if __name__ == "__main__":
    print("Current directory:", os.getcwd())
    print("Env file exists:", os.path.exists('.env'))
    print("OpenAI API Key:", os.getenv("OPENAI_API_KEY", "Not found"))
    test_openai_integration()
