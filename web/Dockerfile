FROM trafex/php-nginx:latest
WORKDIR /var/www/html

# Install nodejs
RUN echo "?"
USER root
RUN apk add --no-cache \
    php84-pecl-redis \
    nodejs \
    npm

# Install js confuser
RUN npm install -g js-confuser --prefix /var/www/npm
RUN chown nobody:nogroup /var/log/php84

# Switch to use a non-root user from here on
USER nobody

# Expose the port nginx is reachable on
EXPOSE 8080

# Let supervisord start nginx & php-fpm
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
