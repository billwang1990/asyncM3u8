const AsymM3u8 = require('./aysncM3u8');

(async function () {
    const options = {
        downloadPath: './download',
        throttleRequestMs: 100
    }
    const asyncM3u8 = new AsymM3u8('http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/3340_vod.m3u8', options);
    await asyncM3u8.start();
})();
