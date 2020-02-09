### 
### AsyncM3u8

An async m3u8 downloader for Node.js, based on ffmpeg.



### Usage

First, install the package:

```
yarn add asyncm3u8
```

Or:

```
npm install asyncm3u8
```



Then: 

```
const AsymM3u8 = require('asyncm3u8');

(async function () {
    const options = {
        downloadPath: './download',
        throttleRequestMs: 100 // The limit time for network request, 100 means only allow one request per 100 millisecond
    }
    const asyncM3u8 = new AsymM3u8('http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/3340_vod.m3u8', options);
    await asyncM3u8.start();
})();

```



### Note:

Only support the m3u8 url which contain media playlist.