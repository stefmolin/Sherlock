FROM ubuntu:xenial
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip
RUN pip3 install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir \
    flask==0.12.2 \
    requests==2.18.4
RUN pip3 install --no-cache-dir \
    uwsgi==2.0.17
WORKDIR /usr/src/app
COPY . .
RUN chmod -R a+rwx .
ENTRYPOINT [ "./entrypoint.sh" ]
