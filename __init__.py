import time
import os
import logging
import argparse
import yaml
import signal

from flask import Flask
app = Flask(__name__)
app.secret_key = 'This is a secret'

from sherlock import web_app

# Logging configuration
FORMAT = '[%(levelname)s] [ %(name)s ] %(message)s'
logging.basicConfig(level=logging.DEBUG, format=FORMAT)
logger = logging.getLogger(os.path.basename(__file__))

if __name__ == "__main__":
  def handler(signum, frame):
    logger.info("SIGTERM received")
    # close out connections
    metis_db.close_connections()
    logger.info("Cleanup complete")

  signal.signal(signal.SIGTERM, handler)

  # starting app (accessible externally through port 5000)
  logger.info('Launching the web app.')
  #app.run(host='0.0.0.0', port=5000)
  app.run(debug=True)
