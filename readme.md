## Требования

* node - 14.4.0
* mysql-server - 8 и выше

## Установка

```
git clone https://github.com/peet-peeterson/social-exchange
cd ./social-exchange
npm install
npm run bootstrap
```

## NPM-скрипты

* bootstrap - устанавливает зависимости во всех пакетах
* build - собирает все проекты
* dev - запускает core в режиме разработки.
* start - запускает core в production режиме
* production - запускает core production режиме через pm2
* production-restart - перезапускает core через pm2
