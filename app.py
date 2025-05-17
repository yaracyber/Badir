import os
import logging
from flask import Flask, render_template

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "badir_default_secret")

# Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/donate')
def donate():
    return render_template('donate.html')

@app.route('/technology')
def technology():
    return render_template('technology.html')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
