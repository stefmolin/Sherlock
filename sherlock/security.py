import requests

def is_valid_user(login, password):
  if not login or login == '' or not password or password == '':
    # if the login/password wasn't entered, return false
    return False
  else:
    headers = {'X-OpenAM-Username': login.split("@")[0] + '@company.com', 'X-OpenAM-Password': password, 'Content-Type': 'application/json'}
    http_path = "<Authentification URL>"
    response = requests.post(http_path,  headers = headers)
    if response.ok:
      return True
    else:
      return False
