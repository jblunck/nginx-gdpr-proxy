ARG NGINX_VERSION=1.19.2
FROM nginx:${NGINX_VERSION} AS builder

ARG NGINX_VERSION
ARG MODULE_VERSION=3.3

RUN set -x \
# create nginx user/group first, to be consistent throughout docker variants
    && addgroup --system --gid 101 nginx \
    && adduser --system --disabled-login --ingroup nginx --no-create-home --home /nonexistent --gecos "nginx user" --shell /bin/false --uid 101 nginx \
    && apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y gnupg1 ca-certificates \
    && \
    NGINX_GPGKEY=573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62; \
    found=''; \
    for server in \
        ha.pool.sks-keyservers.net \
        hkp://keyserver.ubuntu.com:80 \
        hkp://p80.pool.sks-keyservers.net:80 \
        pgp.mit.edu \
    ; do \
        echo "Fetching GPG key $NGINX_GPGKEY from $server"; \
        apt-key adv --keyserver "$server" --keyserver-options timeout=10 --recv-keys "$NGINX_GPGKEY" && found=yes && break; \
    done; \
    test -z "$found" && echo >&2 "error: failed to fetch GPG key $NGINX_GPGKEY" && exit 1; \
    apt-get remove --purge --auto-remove -y gnupg1 && rm -rf /var/lib/apt/lists/* \
    && dpkgArch="$(dpkg --print-architecture)" \
    && nginxPackages=" \
        nginx=${NGINX_VERSION}-${PKG_RELEASE} \
        nginx-module-xslt=${NGINX_VERSION}-${PKG_RELEASE} \
        nginx-module-geoip=${NGINX_VERSION}-${PKG_RELEASE} \
        nginx-module-image-filter=${NGINX_VERSION}-${PKG_RELEASE} \
        nginx-module-njs=${NGINX_VERSION}.${NJS_VERSION}-${PKG_RELEASE} \
    " \
    && echo "deb-src https://nginx.org/packages/mainline/debian/ buster nginx" >> /etc/apt/sources.list.d/nginx.list \
    \
# save list of currently-installed packages so build dependencies can be cleanly removed later
    && savedAptMark="$(apt-mark showmanual)" \
    \
# build .deb files from upstream's source packages (which are verified by apt-get)
    && apt-get update \
    && apt-get build-dep -y $nginxPackages \
    \
# new directory for storing sources and .deb files
    && tempDir="$(mktemp -d)" \
    && chmod 777 "$tempDir" \
# (777 to ensure APT's "_apt" user can access it too)
    \
    && ( \
        cd "$tempDir" \
        && DEB_BUILD_OPTIONS="nocheck parallel=$(nproc)" \
            apt-get source $nginxPackages \
	&& apt-get -y install libmaxminddb-dev \
	&& curl -L "https://github.com/leev/ngx_http_geoip2_module/archive/$MODULE_VERSION.tar.gz" --output ngx_http_geoip2_module-$MODULE_VERSION.tar.gz --silent \
	&& tar -xzvf ngx_http_geoip2_module-$MODULE_VERSION.tar.gz \
	&& CONFARGS=$(nginx -V 2>&1 | sed -n -e 's/^.*arguments: //p') \
	&& cd nginx-${NGINX_VERSION} \
	&& eval ./configure $CONFARGS --add-dynamic-module=../ngx_http_geoip2_module-$MODULE_VERSION \
	&& make modules \
	&& cp objs/ngx_http_geoip2_module.so objs/ngx_stream_geoip2_module.so /usr/lib/nginx/modules/ \
    )

FROM nginx:${NGINX_VERSION}
COPY --from=builder /usr/lib/x86_64-linux-gnu/libmaxminddb.so.0* /usr/lib/x86_64-linux-gnu/
COPY --from=builder /usr/lib/nginx/modules/ngx_http_geoip2_module.so /usr/lib/nginx/modules/ngx_stream_geoip2_module.so /usr/lib/nginx/modules/
