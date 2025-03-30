# TagAI - Decentralized evolution agent

## 如何创建一个项目
```bash
mkdir my-project
cd my-project
pnpm init
```

## 配置TS环境
```bash
pnpm add -D typescript
pnpm add -D ts-node
pnpm add -D tsup
pnpm add -D @types/node
```

## 配置TSConfig
```bash
vim tsconfig.json
```
添加配置内容
```json
{
    "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext", "dom"],
    "moduleResolution": "Bundler",
    "outDir": "./dist",
    "rootDir": ".",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": false,
    "allowImportingTsExtensions": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "resolveJsonModule": true,
    "noImplicitAny": false,
    "allowJs": true,
    "checkJs": false,
    "noEmitOnError": false,
    "moduleDetection": "force",
    "allowArbitraryExtensions": true
  }
}
```

## 安装elizaos包
```bash
pnpm add @elizaos/core
pnpm add @tavily/core
pnpm add better-sqlite3
pnpm add dotenv
pnpm add fs
pnpm add net
pnpm add path
pnpm add readline
pnpm add sharp
pnpm add url
pnpm add ws
pnpm add yargs
```

## 根据需要安装eliza的插件和客户端库（一下包可选安装）：
```bash
pnpm add @elizaos/adapter-postgres
pnpm add @adapter-sqlite
pnpm add @client-auto
pnpm add @client-direct
pnpm add @client-telegram
pnpm add @client-twitter
pnpm add @client-farcaster
pnpm add @client-github
pnpm add @plugin-bootstrap
pnpm add @plugin-coinbase
pnpm add @plugin-evm
pnpm add @plugin-flow
pnpm add @plugin-goat
pnpm add @plugin-image-generation
pnpm add @plugin-near
pnpm add @plugin-nft-generation
pnpm add @plugin-node
pnpm add @plugin-solana
pnpm add @plugin-tee
pnpm add @plugin-ton
pnpm add @plugin-video-generation
pnpm add @plugin-web-search
```
更多插件请参考[elizaOS](https://github.com/elizaOS/eliza)

## 创建src目录
```bash
mkdir src
touch src/index.ts
```