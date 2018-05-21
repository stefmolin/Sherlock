import time
import os
import logging

from flask import Flask
app = Flask(__name__)
app.secret_key = 'This is a secret'

from sherlock import web_app

# Logging configuration
FORMAT = '[%(levelname)s] [ %(name)s ] %(message)s'
logging.basicConfig(level=logging.INFO, format=FORMAT)
logger = logging.getLogger(os.path.basename(__file__))

if __name__ == "__main__":
  logger.info('Launching the web app.')
  app.run(host='0.0.0.0', port=80)
