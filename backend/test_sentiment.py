from textblob import TextBlob

text = "I love this project!"
blob = TextBlob(text)
print(blob.sentiment)
