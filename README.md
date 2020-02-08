### 
### AsyncM3u8

An async m3u8 downloader for Node.js, based on ffmpeg.



### Usage

```
const AsymM3u8 = require('asyncm3u8');

(async function () {
    const asyncM3u8 = new AsymM3u8('http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/3340_vod.m3u8');
    await asyncM3u8.start();
})();

```



### Note:

Only support the m3u8 url which contain media playlist.