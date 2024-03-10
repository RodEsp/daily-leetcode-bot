import requests
import json

payload = {
    "query": """
        query questionOfToday {
          activeDailyCodingChallengeQuestion {
            date
            userStatus
            link
            question {
              acRate
              difficulty
              freqBar
              frontendQuestionId: questionFrontendId
              isFavor
              paidOnly: isPaidOnly
              status
              title
              titleSlug
              hasVideoSolution
              hasSolution
              topicTags {
                name
                id
                slug
              }
            }
          }
        }
    """,
    "variables": {},
    "operationName": "questionOfToday",
}

headers = {
    "authority": "leetcode.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
}

req = requests.Request("POST", "https://leetcode.com/graphql/", headers=headers, json=payload)
r = req.prepare()
s = requests.Session()
response = s.send(r)

if response.status_code == 200:
    print(json.dumps(response.json()))
else:
    print("Failed to fetch data. Status code:", response.status_code, response.text)
