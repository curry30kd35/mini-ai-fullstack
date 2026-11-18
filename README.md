```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
<!-- 快速生成module命令 -->
```
$ nest g mo modules/名称
nest g co modules/名称 --no-spec
nest g s modules/名称 --no-spec