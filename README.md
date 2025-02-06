<p align="center">
<img alt="" src="images/header.png"/>
</p>

BudDi is intended to keep track of multiple budgets that you want to send money in a random and distributed fashion.

For example: You can use it to organize all projects or organisations you want to donate money to. BudDi will make sure that your donations are distributed equally between all projects. And if you want to use an automated schedule, it will also randomly choose the next projects you want to donate to.


## How does it work?
BudDi keeps two lists: "All budgets" and "Waiting to be chosen".
Entries that are added to the "All budgets" section will also be added to "Next up" automatically.
Every time you press the "Select a random spending now" button (or when the scheduler does it automatically), one random entry is removed from the "Waiting to be chosen" list and BudDi prompts you to pay money to this budget (by adding it to a third list at the top that can be checkmarked).

When "Waiting to be chosen" is empty, it will automatically be refilled with the entries von "All budgets" and the cycle restarts.


## How to install?
Use docker compose.

Create a new directory and move there:
```shell
mkdir ./buddi
cd ./buddi
```

Download the docker compose file:
```shell
wget -O https://raw.githubusercontent.com/JodliDev/BudDi/refs/heads/master/docker-compose.yml
```

Run the container:
```shell
docker compose up -d
```


### Using a reverse Proxy (e.g. Nginx)
Use the following configuration (assuming, that you use SSL and you want you use **Let's Encrypt**):
> **Note 1:** Replace SERVERNAME with your domain:

> **Note 2:** `/websocket` needs to match the option `pathWs`

> **Note 3:** `1304` needs to match the option `portHttp`
```
server {
    server_name SERVERNAME;
    listen 443;
    listen [::]:443;


    location / {
        proxy_set_header HOST $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header Upgrade $http_upgrade;
        proxy_pass http://127.0.0.1:1304;
    }
    
    location /websocket {
        proxy_pass http://127.0.0.1:1304;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Protocol https;
        proxy_set_header X-Forwarded-Host $server_name;
    }
    
    ssl_certificate /etc/letsencrypt/live/SERVERNAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/SERVERNAME/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

}
server {
    server_name SERVERNAME;
    listen 80;
    listen [::]:80;

    if ($host = SERVERNAME) {
        return 301 https://$host$request_uri;
    }
    return 404;
}

```


## Options
Can be set in the environment section in `docker-compose.yml`:
- **portHttp**: Internal port on which the application should run in the docker image (default: 1304).
- **lang**: Language code to select a translation for the frontend (currently there is only "en") (default: "en").
- **pathWs**: Relative path on which the websocket should be accessible (default: "/websocket").
- **keepAliveTimeoutMs**: Milliseconds after which the frontend should send keep-alive packages to prevent websocket being closed (e.g. nginx closes connections after one minute) (default: 50000).


## How to update?
>**Note 1:** Database updates happen automatically. When BudDi upgrades its database, it automatically creates a backup of its database file (found in `buddi/config`).

>**Note 2:** When starting, BudDi logs all database changes to the console.

Download a new image for the container and restart:
```shell
docker compose pull && docker compose up -d --remove-orphans
```

Delete unused Docker images:
```shell
docker image prune
```

## What is it made of?
The backend is written in TypeScript using Node.js which starts an HTTP and WebSocket server using Express. Data is saved using SQLite.

The frontend is written in TypeScript using Mithril.js and is packed by Webpack.
