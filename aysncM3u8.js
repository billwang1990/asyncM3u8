const request = require('request');
const URL = require('url');
const md5 = require('md5');
const fs = require('fs');
const path = require('path');
const Bottleneck = require('bottleneck');
const exec = require('child_process').exec; 
const cliProgress = require('cli-progress');

const requestLimiter = new Bottleneck({
    minTime: 333 //one request per 333ms
});

class AsyncM3u8 {
    constructor(url, downloadPath) {
        this.m3u8Url = url;

        const videoPath = path.join(downloadPath, md5(url));

        if (!fs.existsSync(videoPath)) {
            fs.mkdirSync(videoPath, { recursive: true });
        }

        this.folder = videoPath;

        const limitedRequest = requestLimiter.wrap(request.get);
        this.limitedRequest = limitedRequest;
    }

    async start() {
        const content = await this.downloadM3u8(this.m3u8Url);
        const tsList = this.parse(content, this.m3u8Url);
        const result = await this.downloadTs(tsList, this.folder);
        const mp4Path = await this.convertTsToMP4(result, this.folder);
        console.log('Output video path is: ', mp4Path);
    }

    downloadM3u8(url) {
        if (!url.startsWith('http')) {
            throw new Error('url is invalid');
        }
        return new Promise((resolve, reject) => {
            this.limitedRequest(url, (err, res, body) => {
                if (err) {
                    reject(err);
                }
                resolve(body);
            });
        });
    }

    parse(content, m3u8Url) {
        console.log('Start parse m3u8 content');
        const tsList = content.match(/((http|https):\/\/.*)|(.+\.ts)/g);
        if (!tsList) {
            throw new Error(`content type is invalid: ${content}`);
        }
        return tsList.map((t) => {
            if (t.startsWith('http')) {
                return t;
            } else {
                const url = URL.parse(m3u8Url);
                const tmp = url.path.split('/');
                const host = `${url.protocol}//${url.host}`;
                if (t.startsWith('/')) {
                    return host + t;
                } else {
                    const path = tmp.slice(0, tmp.length - 1).join('/') + '/' + t;
                    const host = `${url.protocol}//${url.host}`;
                    return host + path;
                }
            }
        })
    }

    async downloadTs(tsURLList, folder) {
        console.log('Start download ts files');
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar.start(tsURLList.length, 0);

        const mapToRequestPromise = (link) => {
            return new Promise((resolve, reject) => {
                const opt = {
                    method: 'GET',
                    url: link,
                    timeout: 100000,
                    encoding: null
                };
                this.limitedRequest(opt, (err, response, buff) => {
                    // console.log('Complete ', link);
                    if (err) {
                        // reject(err);
                        resolve();
                    } else if (response.statusCode === 200) {
                        const tmp = link.split('/');
                        const fileName = tmp[tmp.length - 1];
                        const filePath = path.join(folder, fileName);

                        fs.writeFile(filePath, buff, (writeErr) => {
                            if (writeErr) {
                                // reject(writeErr);
                                resolve();
                            } else {
                                bar.increment();
                                resolve(fileName);
                            }
                        });
                    }
                });
            });
        }
        const all = tsURLList.map(mapToRequestPromise);
        const downloadedFiles = await Promise.all(all);
        bar.stop();
        return downloadedFiles.filter((f) => {return f != null; });
    }

    async convertTsToMP4(tsList, folder) {
        const fileContent = tsList.map(t => {
            return `file ${t}`
        }).join('\n');

        const filelistPath = path.join(folder, 'filelist.txt');
        await new Promise((resolve, reject) => {
            fs.writeFile(filelistPath, fileContent, (writeErr) => {
                if (writeErr) {
                    console.log('errr = ', writeErr);
                    reject(writeErr)
                } else {
                    resolve(`${folder}/filelist.txt`);
                }
            });
        });
        const mp4Path = path.join(folder, `output.mp4`);
        await exec(`ffmpeg -f concat -safe 0 -i ${filelistPath}  -acodec copy -vcodec copy -absf aac_adtstoasc ${mp4Path}`);
        return mp4Path;
    }
}

module.exports = AsyncM3u8;