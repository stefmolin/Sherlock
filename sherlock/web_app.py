from flask import Flask, render_template, redirect, url_for, request, session, flash, escape, Markup
from sherlock.security import is_valid_user
from datetime import datetime, timedelta, date
import os
import logging
try:
  from __main__ import app
except ImportError:
  from app import app

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
    return redirect(url_for('parameter_entry'))
  else:
    # no session detected, show log in
    error = None
    if request.method == 'POST':
      username = request.form['username'].split("@")[0]
      if is_valid_user(login=username, password=request.form['password']):
        # successful login, set session
        logger.info('{user} has logged in'.format(user=username))
        session['username'] = username
        return redirect(url_for('parameter_entry'))
      else:
        # unsuccessful login attempt, display error and allow another attempt
        error = 'Wrong username/password. Please try again.'
        return render_template('login.html', error=error)
    else:
      return render_template('login.html')

@app.route("/parameter_entry")
def parameter_entry():
    if 'username' in session:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        if start_date and not end_date:
            end_date = str(date.today() - timedelta(1))
        elif not start_date and end_date:
            start_date = datetime.strftime((datetime.strptime(end_date, '%Y-%m-%d') - timedelta(15)), '%Y-%m-%d')
        return render_template('parameter_entry.html',
                                partner_id=request.args.get('partner_id') or 'undefined',
                                client_id=request.args.get('client_id') or 'undefined',
                                start_date=start_date,
                                end_date=end_date,
                                metric=request.args.get('kpi') or 'undefined')
    else:
        return redirect(url_for('login'))

@app.route("/investigate", methods=["POST"])
def investigate():
    if 'username' in session:
        partner_id = request.form['partner_id']
        client_id = request.form['client_id']
        campaign_id = request.form['campaign_selector']
        start_date = request.form['start_date']
        end_date = request.form['end_date']
        metric = request.form['metric']
        return render_template('investigate.html',
                                partner_id=partner_id,
                                client_id=client_id,
                                campaign_id=campaign_id,
                                start_date=start_date,
                                end_date=end_date,
                                metric=metric)
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
