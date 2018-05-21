#!/bin/sh
uwsgi --http 0.0.0.0:80 --manage-script-name --module app --callable app
