const AysncM3u8 = require('../aysncM3u8');
const fs = require('fs');

jest.mock('fs');

const m3u8LinkForTesting = 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_180_250000.m3u8';

describe('Testing async m38u downloader', () => {

    let aysncM3u8;
    beforeEach(() => {
        aysncM3u8 = new AysncM3u8(m3u8LinkForTesting);
        aysncM3u8.limitedRequest = jest.fn();
        fs.writeFile.mockReset();
    });

    describe('download function', () => {

        it('should throw error if the url is not start with http', () => {
            expect(aysncM3u8.downloadM3u8).toThrow(Error);
            expect(() => aysncM3u8.downloadM3u8('ftp://foo.bar.com')).toThrow('url is invalid');
        })
        it('should not throw error if the url is start with http', () => {
            expect(() => aysncM3u8.downloadM3u8(m3u8LinkForTesting)).not.toThrow();
        })
        it('should send a get request', () => {
            aysncM3u8.downloadM3u8(m3u8LinkForTesting);
            expect(aysncM3u8.limitedRequest.mock.calls[0][0]).toEqual(m3u8LinkForTesting);
            expect(typeof aysncM3u8.limitedRequest.mock.calls[0][1]).toEqual('function');
        })
    });
    describe('parse function', () => {
        it('should throw error if the content is invalid', () => {
            const content = 'whatever';
            expect(() => aysncM3u8.parse(content)).toThrow('content type is invalid');
        });
        it('should return the list of ts files and get the Host from the original m3u8 url', () => {
            const content = '#EXTM3U\n#EXT-X-VERSION: 3\n#EXT-X-TARGETDURATION: 8\n#EXT-X-MEDIA-SEQUENCE: 0\n#EXTINF: 4.166667,\n93431e0beee000000.ts\n#EXTINF: 6.250000,\n#EXT-X-ENDLIST';
            expect(aysncM3u8.parse(content, m3u8LinkForTesting)).toEqual(['https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/93431e0beee000000.ts'])
        });
        it('should remove the unnecessary slashes from the content' , () => {
            const content = '#EXTM3U\n#EXT-X-VERSION: 3\n#EXT-X-TARGETDURATION: 8\n#EXT-X-MEDIA-SEQUENCE: 0\n#EXTINF: 4.166667,\n/NOTE_SLASH/93431e0beee000000.ts\n#EXTINF: 6.250000,\n#EXT-X-ENDLIST';
            expect(aysncM3u8.parse(content, m3u8LinkForTesting)).toEqual(['https://bitdash-a.akamaihd.net/NOTE_SLASH/93431e0beee000000.ts'])
        });
        it('should ignore the original m3u8 url if the ts url contain their host path', () => {
            const m3u8Url = 'http://foo.bar.com';
            const content = '#EXTM3U\n#EXT-X-VERSION: 3\n#EXT-X-TARGETDURATION: 8\n#EXT-X-MEDIA-SEQUENCE: 0\n#EXTINF: 4.166667,\nhttp://a.b.com/93431e0beee000000.ts\n#EXTINF: 6.250000,\n#EXT-X-ENDLIST';
            expect(aysncM3u8.parse(content, m3u8Url)).toEqual(['http://a.b.com/93431e0beee000000.ts'])
        })
    });
    describe('downloadTs function', () => {
        it('should send a request with expect params for ts file downloading', () => {            
            aysncM3u8.downloadTs(['http://whatever.com/xx.ts'], 'whateverFolder');
            expect(aysncM3u8.limitedRequest.mock.calls[0][0]).toEqual({ "encoding": null, "method": "GET", "timeout": 100000, "url": "http://whatever.com/xx.ts" });
        });
    });
    describe('convertTsToMP4 function', () => {
        it('should combine all the ts file name into filelist.txt', () => {
            aysncM3u8.convertTsToMP4(['a.ts', 'b.ts', 'c.ts'], 'whateverFolder');
            expect(fs.writeFile.mock.calls[0][0]).toEqual(__dirname.substring(0, __dirname.lastIndexOf('/')) + '/whateverFolder/filelist.txt');
            expect(fs.writeFile.mock.calls[0][1]).toEqual('file a.ts\nfile b.ts\nfile c.ts');
        });
    })
})