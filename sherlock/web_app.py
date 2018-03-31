from flask import Flask, render_template, redirect, url_for, request, session, flash, escape, Markup
from sherlock.security import is_valid_user
from datetime import datetime
import os
import logging
try:
  from __main__ import app
except ImportError:
  from __init__ import app

logger = logging.getLogger('Sherlock')

def clear_session(exhausted_kpi_evolutions=False):
  if os.environ.get('DEPLOYMENT_ENVIRONMENT') == 'testing':
    # if we are testing, clear all the session variables
    for key in list(session):
     session.pop(key, None)
  else:
    # production environment, just clear username for logout
    session.pop('username', None)

@app.route('/test')
def test():
    return render_template('cards_test.html')

@app.route("/")
@app.route("/login", methods=['POST', 'GET'])
def login():
  # check if the user already has a session
  if 'username' in session:
    # flash(Markup('Logged in as {user}. <a href="{switch}">Not you?</a>'.format(user=escape(session['username']), switch=url_for('logout', switch_user=1))))
    return redirect(url_for('homepage'))
  else:
    # no session detected, show log in
    error = None
    if request.method == 'POST':
      username = request.form['username'].split("@")[0]
      if is_valid_user(login=username, password=request.form['password']):
        # successful login, set session
        logger.info('{user} has logged in'.format(user=username))
        session['username'] = username
        return redirect(url_for('homepage'))
      else:
        # unsuccessful login attempt, display error and allow another attempt
        error = 'Wrong username/password. Please try again.'
        return render_template('login.html', error=error)
    else:
      return render_template('login.html')

@app.route("/home")
def homepage():
    if 'username' in session:
        return render_template('homepage.html')
    else:
        return redirect(url_for('login'))

@app.route("/logout")
def logout():
    if 'username' in session:
        username = session['username']
        clear_session()
        logger.info('{user} logged out'.format(user=username))
        return render_template('logout.html', username=username)
    else:
        return redirect(url_for('login'))
