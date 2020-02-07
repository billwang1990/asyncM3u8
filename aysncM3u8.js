const request = require('request');
const URL = require('url');
const md5 = require('md5');
const fs = require('fs');
const path = require('path');


class AsyncM3u8 {
    constructor(url) {
        this.m3u8Url = url;
        this.downloadPath = './download';

        const folder = `${this.downloadPath}/${md5(this.m3u8Url)}`;
        fs.mkdirSync(folder, { recursive: true });
        this.folder = folder;
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
            request.get(url, (err, res, body) => {
                if (err) {
                    reject(err);
                }
                resolve(body);
            });
        });
    }

    parse(content, m3u8Url) {
        console.log('start parse m3u8 content');
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
                const path = tmp.slice(0, tmp.length - 1).join('/') + '/' + t;
                const host = `${url.protocol}//${url.host}`;
                return host + path;
            }
        })
    }

    async downloadTs(tsURLList, folder) {
        console.log('start download ts files');

        const all = tsURLList.map((t) => {
            return new Promise((resolve, reject) => {
                const opt = {
                    method: 'GET',
                    url: t,
                    timeout: 100000,
                    headers: {
                        'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
                    },
                    encoding: null
                };
                request.get(opt, (err, response, buff) => {
                    if (err) {
                        reject(err);
                    } else if (response.statusCode === 200) {
                        const tmp = t.split('/');
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
        });
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