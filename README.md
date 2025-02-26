## steps to reproduce this repository

#### create an .env file and  fill the value
```
NODE_ENV=development
```
#### install electron dependencies using npm with [nodejs](https://nodejs.org/en)

```
npm install
```

#### install dependencies for frontend
```
cd src
```
```
npm install
```

### Run the deepseek-coder model locally

#### download the [ollama cli](https://ollama.com/download) 

#### download the deepseek-coder: 1.3B and make sure it runs on port `11434`
```
ollama run deepseek-coder
```

Model specifications <br>
- architecture        llama    
- parameters          1.3B     
- context length      16384    
- embedding length    2048     
- quantization        Q4_0


#### Run the electron app in the root directory of the project
```
npm run dev
```

#### To run it production ready
```
cd src
npm run build
```
#### change the .env at root folder
```
NODE_ENV=production
```

#### Run the electron app at root folder
```
npm run start
```