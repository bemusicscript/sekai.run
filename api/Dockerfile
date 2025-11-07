FROM node:current-trixie AS node
FROM python:3

ENV DEBIAN_FRONTEND=noninteractive
RUN mkdir -p /usr/src/app /usr/src/app

# Install node
COPY --from=node /usr/local/ /usr/local/
ENV PATH="/usr/local/bin:/usr/local/lib/node_modules/.bin:${PATH}"
RUN corepack enable || true

# Install python and its dependencies
WORKDIR /usr/src/app
COPY ./app/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install cron, sudo
RUN apt update && \
    apt upgrade -y && \
    apt install -y --no-install-recommends \
        cron \
        tzdata \
        sudo \
        rsyslog \
        ca-certificates \
        build-essential && \
    apt autoclean -y

# downgrade rsyslog privileges
RUN sed -i '/imklog/s/^/#/' /etc/rsyslog.conf

# Set timezone to GMT+9
RUN  ln -fs /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata
ENV TZ="Asia/Tokyo"
WORKDIR /usr/src

USER root
EXPOSE 5000

CMD ["/init"]
