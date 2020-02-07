const request = require('request');
const URL = require('url');
const md5 = require('md5');
const fs = require('fs');
const path = require('path');
const Bottleneck = require('bottleneck');

const requestLimiter = new Bottleneck({
    minTime: 333 //one request per 333ms
});

class AsyncM3u8 {
    constructor(url) {
        this.m3u8Url = url;
        this.downloadPath = './download';

        const folder = `${this.downloadPath}/${md5(this.m3u8Url)}`;
        fs.mkdirSync(folder, { recursive: true });
        this.folder = folder;

        const limitedRequest = requestLimiter.wrap(request.get);
        this.limitedRequest = limitedRequest;
    }

    async start() {
        const content = await this.downloadM3u8(this.m3u8Url);
        const tsList = this.parse(content, this.m3u8Url);
        const result = await this.downloadTs(tsList, this.folder);
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
            throw new Error('content type is invalid');
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
        console.log('start download ts files');
        const mapToRequestPromise = (link) => {
            return new Promise((resolve, reject) => {
                const opt = {
                    method: 'GET',
                    url: link,
                    timeout: 100000,
                    encoding: null
                };
                this.limitedRequest(opt, (err, response, buff) => {
                    console.log('Complete ', link);
                    if (err) {
                        reject(err);
                    } else if (response.statusCode === 200) {
                        const tmp = link.split('/');
                        const fileName = tmp[tmp.length - 1];
                        const filePath = `${folder}/${fileName}`;

                        fs.writeFile(path.join(__dirname, filePath), buff, (writeErr) => {
                            if (writeErr) {
                                console.log('errr = ', writeErr);
                                reject(writeErr)
                            } else {
                                resolve(fileName);
                            }
                        });
                    }
                });
            });
        }
        const all = tsURLList.map(mapToRequestPromise);
        const downloadedFiles = await Promise.all(all);
        return downloadedFiles;
    }

    async convertTsToMP4(tsList, folder) {
        const fileContent = tsList.map(t => {
            return `file ${t}`
        }).join('\n');

        await new Promise((resolve, reject) => {
            fs.writeFile(path.join(__dirname, `${folder}/filelist.txt`), fileContent, (writeErr) => {
                if (writeErr) {
                    console.log('errr = ', writeErr);
                    reject(writeErr)
                } else {
                    resolve(`${folder}/filelist.txt`);
                }
            });
        })
    }
}

module.exports = AsyncM3u8;