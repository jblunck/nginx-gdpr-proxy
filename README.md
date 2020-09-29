# Masking of IP addresses in NGINX Reverse Proxy

To comply with GDPR regulation requirements it's often necessary to prevent
client IP addresses from being persisted in the form of messages written to
log files. This reverse proxy is masking the lowest 8-bits of the remote address
and places it into the 'X-Forwarded-For' header of the request before it's
being forwarded to the backend server.

## Getting Geolocation information database in MMDB format

The reverse proxy supports enriching the requests with IP Geolocation by DB-IP.
One can download the free IP to City Lite database from:

https://db-ip.com/db/download/ip-to-city-lite

```
$ mmdblookup --file proxy/dbip-city-lite-2020-09.mmdb --ip 8.8.8.8

  {
    "city":
      {
        "names":
          {
            "en":
              "Mountain View" <utf8_string>
          }
      }

[ ... ]
```

## Example

```
$ docker-compose up
Starting nginx-reverse-proxy_backend1_1 ... done
Starting nginx-reverse-proxy_web_1      ... done
Starting nginx-reverse-proxy_proxy_1    ... done
Attaching to nginx-reverse-proxy_backend1_1, nginx-reverse-proxy_proxy_1, nginx-reverse-proxy_web_1
...
```

Pointing your browser to http://localhost:8080 returns the following access log
entries (backend1_1 reports `192.168.96.0` in `X-Forwarded-For` header):
```
backend1_1  | 192.168.96.3 - - [29/Sep/2020:09:50:16 +0000] "GET /favicon.ico HTTP/1.0" 200 1406 "http://localhost:8080/" "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:81.0) Gecko/20100101 Firefox/81.0" "192.168.96.0"
proxy_1     | 192.168.96.1 - - [29/Sep/2020:09:50:16 +0000] "GET /favicon.ico HTTP/1.1" 200 1406 "http://localhost:8080/" "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:81.0) Gecko/20100101 Firefox/81.0"
```

Hitting the webapp via curl at http://localhost:8080/identity
```
$ curl http://localhost:8080/identity
{
  "x-forwarded-for": "192.168.96.0",
  "x-geoip-city_build_epoch": "1598918608",
  "x-geoip-is_in_european_union": "false",
  "host": "web:3000",
  "connection": "close",
  "user-agent": "curl/7.69.1",
  "accept": "*/*"
}
```

... returns the following access log entries:
```
proxy_1     | 192.168.96.1 - - [29/Sep/2020:09:51:56 +0000] "GET /identity HTTP/1.1" 200 234 "-" "curl/7.69.1"
```
