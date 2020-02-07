const AsymM3u8 = require('./aysncM3u8');

(async function () {

    const asyncM3u8 = new AsymM3u8('https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_180_250000.m3u8');
    await asyncM3u8.start();
})();
